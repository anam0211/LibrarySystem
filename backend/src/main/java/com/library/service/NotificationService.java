package com.library.service;

import com.library.common.exception.ResourceNotFoundException;
import com.library.common.exception.BadRequestException;
import com.library.dto.response.NotificationResponseDTO;
import com.library.entity.DeliveryMethod;
import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.entity.Notification;
import com.library.entity.NotificationChannel;
import com.library.entity.NotificationStatus;
import com.library.entity.NotificationType;
import com.library.repository.LoanRepository;
import com.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final LoanRepository loanRepository;

    private NotificationResponseDTO mapToResponseDTO(Notification notification) {
        return NotificationResponseDTO.builder()
                .notificationId(notification.getNotificationId())
                .type(notification.getType())
                .channel(notification.getChannel())
                .subject(notification.getSubject())
                .body(notification.getBody())
                .relatedLoanId(notification.getRelatedLoanId())
                .relatedBookId(notification.getRelatedBookId())
                .scheduledAt(notification.getScheduledAt())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public List<NotificationResponseDTO> getUserNotifications(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<NotificationResponseDTO> getUnreadNotifications(Integer userId) {
        return notificationRepository.findByUserIdAndReadAtIsNull(userId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));
        
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAsReadForUser(Integer notificationId, Integer userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay thong bao voi ID: " + notificationId));

        if (notification.getUserId() == null || !notification.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Khong tim thay thong bao cua nguoi dung hien tai.");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public Notification createInApp(
            Integer userId,
            NotificationType type,
            String subject,
            String body,
            Integer relatedLoanId,
            Integer relatedBookId
    ) {
        LocalDateTime now = LocalDateTime.now();
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .channel(NotificationChannel.INAPP)
                .subject(subject)
                .body(body)
                .relatedLoanId(relatedLoanId)
                .relatedBookId(relatedBookId)
                .scheduledAt(now)
                .sentAt(now)
                .status(NotificationStatus.SENT)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional
    public NotificationResponseDTO sendReturnReminder(Integer loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phieu muon."));

        Integer userId = loan.getBorrower() != null ? loan.getBorrower().getId() : null;
        if (userId == null) {
            throw new BadRequestException("Phieu muon khong co thong tin ban doc.");
        }

        if (loan.getStatus() != LoanStatus.OPEN && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new BadRequestException("Chi co the nhac tra cho phieu dang muon hoac qua han.");
        }

        boolean overdue = loan.getStatus() == LoanStatus.OVERDUE
                || (loan.getDueAt() != null && loan.getDueAt().isBefore(LocalDateTime.now()));
        NotificationType type = overdue ? NotificationType.OVERDUE : NotificationType.DUE_SOON;
        String subject = overdue ? "Nhắc trả sách quá hạn" : "Nhắc trả sách";
        String body = "Thư viện nhắc bạn trả " + bookSummary(loan)
                + " của phiếu mượn #" + loan.getId()
                + ". Hạn trả: " + dueDateText(loan)
                + ". Vui lòng trả sách sớm để tránh phát sinh thêm phí.";

        return mapToResponseDTO(createInApp(
                userId,
                type,
                subject,
                body,
                loan.getId(),
                firstBookId(loan)
        ));
    }

    @Transactional
    public void notifyLoanStatus(Loan loan) {
        if (loan == null || loan.getBorrower() == null || loan.getBorrower().getId() == null) {
            return;
        }

        LoanStatus status = loan.getStatus();
        String subject = loanStatusSubject(status);
        String body = loanStatusBody(loan);

        if (subject == null || body == null) {
            return;
        }

        createInApp(
                loan.getBorrower().getId(),
                NotificationType.LOAN_STATUS,
                subject,
                body,
                loan.getId(),
                firstBookId(loan)
        );
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendDueSoonReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime from = tomorrow.atStartOfDay();
        LocalDateTime to = tomorrow.plusDays(1).atStartOfDay();

        List<Loan> dueLoans = loanRepository.findByStatusAndDueAtGreaterThanEqualAndDueAtLessThan(
                LoanStatus.OPEN,
                from,
                to
        );

        for (Loan loan : dueLoans) {
            Integer userId = loan.getBorrower() != null ? loan.getBorrower().getId() : null;
            if (userId == null || loan.getId() == null) {
                continue;
            }

            boolean alreadySent = notificationRepository.existsByUserIdAndTypeAndRelatedLoanId(
                    userId,
                    NotificationType.DUE_SOON,
                    loan.getId()
            );
            if (alreadySent) {
                continue;
            }

            createInApp(
                    userId,
                    NotificationType.DUE_SOON,
                    "Sắp đến hạn trả sách",
                    "Phiếu mượn #" + loan.getId() + " sẽ đến hạn trả vào ngày "
                            + loan.getDueAt().toLocalDate()
                            + ". Vui lòng trả sách đúng hạn để tránh phát sinh phí phạt.",
                    loan.getId(),
                    firstBookId(loan)
            );
        }

        if (!dueLoans.isEmpty()) {
            log.info("Processed due-soon reminders for {} loan(s).", dueLoans.size());
        }
    }

    private String loanStatusSubject(LoanStatus status) {
        return switch (status) {
            case PENDING -> "Yêu cầu mượn sách đã được ghi nhận";
            case PREPARING -> "Thư viện đang chuẩn bị sách";
            case SHIPPING -> "Sách đang được giao";
            case OPEN -> "Bạn đang mượn sách";
            case OVERDUE -> "Phiếu mượn đã quá hạn";
            case RETURNING -> "Yêu cầu trả sách đã được ghi nhận";
            case CLOSED -> "Phiếu mượn đã hoàn tất";
            case CANCELLED -> "Phiếu mượn đã bị hủy";
            case EXPIRED -> "Phiếu mượn đã quá hạn";
        };
    }

    private String loanStatusBody(Loan loan) {
        String bookSummary = bookSummary(loan);
        String loanText = "Phiếu mượn #" + loan.getId();
        boolean homeDelivery = loan.getDeliveryMethod() == DeliveryMethod.HOME_DELIVERY;

        return switch (loan.getStatus()) {
            case PENDING -> loanText + " (" + bookSummary + ") đang chờ thư viện xác nhận.";
            case PREPARING -> loanText + " đang được đóng gói để giao tận nhà.";
            case SHIPPING -> loanText + " đang trên đường giao đến bạn."
                    + trackingText(loan);
            case OPEN -> homeDelivery
                    ? loanText + " đã được giao thành công. Hạn trả: " + dueDateText(loan) + "."
                    : loanText + " đã được bàn giao tại quầy. Hạn trả: " + dueDateText(loan) + ".";
            case OVERDUE -> loanText + " đã quá hạn trả. Vui lòng trả sách sớm để tránh phát sinh thêm phí.";
            case RETURNING -> loanText + " đã chuyển sang trạng thái chờ thư viện nhận lại sách.";
            case CLOSED -> loanText + " đã hoàn tất trả sách. Cảm ơn bạn đã sử dụng thư viện.";
            case CANCELLED -> loanText + " đã bị hủy. Sách đã được hoàn lại kho nếu chưa bàn giao.";
            case EXPIRED -> loanText + " đã quá hạn trả sách. Vui lòng liên hệ thư viện để xử lý.";
        };
    }

    private String bookSummary(Loan loan) {
        if (loan.getLoanItems() == null || loan.getLoanItems().isEmpty()) {
            return "sách đã chọn";
        }

        List<String> titles = loan.getLoanItems().stream()
                .map(item -> item.getBook() != null ? item.getBook().getTitle() : null)
                .filter(title -> title != null && !title.isBlank())
                .distinct()
                .limit(2)
                .toList();

        if (titles.isEmpty()) {
            return "sách đã chọn";
        }

        int totalBooks = (int) loan.getLoanItems().stream()
                .map(item -> item.getBook() != null ? item.getBook().getId() : null)
                .filter(id -> id != null)
                .distinct()
                .count();
        String summary = String.join(", ", titles);
        if (totalBooks > titles.size()) {
            summary += " và " + (totalBooks - titles.size()) + " sách khác";
        }
        return summary;
    }

    private String dueDateText(Loan loan) {
        return loan.getDueAt() == null ? "chưa cập nhật" : loan.getDueAt().toLocalDate().toString();
    }

    private String trackingText(Loan loan) {
        if (loan.getTrackingCode() == null || loan.getTrackingCode().isBlank()) {
            return "";
        }
        return " Mã vận đơn: " + loan.getTrackingCode().trim() + ".";
    }

    private Integer firstBookId(Loan loan) {
        if (loan.getLoanItems() == null) {
            return null;
        }
        return loan.getLoanItems().stream()
                .map(item -> item.getBook() != null ? item.getBook().getId() : null)
                .filter(id -> id != null)
                .findFirst()
                .orElse(null);
    }
}
