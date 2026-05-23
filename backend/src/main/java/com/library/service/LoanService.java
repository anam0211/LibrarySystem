package com.library.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.dto.request.ConfirmReturnRequestDTO;
import com.library.dto.request.LoanCheckoutRequestDTO;
import com.library.dto.request.LoanStatusUpdateRequestDTO;
import com.library.dto.response.AdminLoanKanbanResponseDTO;
import com.library.dto.response.LoanTrackingItemResponseDTO;
import com.library.dto.response.LoanTrackingResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.BookCopyCondition;
import com.library.entity.BookStatus;
import com.library.entity.DeliveryMethod;
import com.library.entity.FineReason;
import com.library.entity.Loan;
import com.library.entity.LoanItem;
import com.library.entity.LoanItemStatus;
import com.library.entity.LoanStatus;
import com.library.entity.User;
import com.library.entity.VerificationStatus;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private static final int DEFAULT_LOAN_DAYS = 14;
    private static final Set<LoanStatus> KANBAN_STATUSES = EnumSet.of(
            LoanStatus.PENDING,
            LoanStatus.PREPARING,
            LoanStatus.SHIPPING,
            LoanStatus.OPEN,
            LoanStatus.OVERDUE,
            LoanStatus.RETURNING,
            LoanStatus.CLOSED
    );
    private static final Set<LoanItemStatus> STOCK_HELD_ITEM_STATUSES = EnumSet.of(
            LoanItemStatus.PENDING,
            LoanItemStatus.BORROWED,
            LoanItemStatus.RETURNING
    );
    private static final Set<LoanItemStatus> RETURNABLE_ITEM_STATUSES = EnumSet.of(
            LoanItemStatus.BORROWED,
            LoanItemStatus.RETURNING
    );

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FineService fineService;
    private final BookCopyService bookCopyService;

    @Value("${app.loans.pending-expire-hours:24}")
    private long pendingExpireHours;

    @Transactional
    public Loan checkoutForCurrentUser(LoanCheckoutRequestDTO request, String borrowerEmail) {
        User borrower = findUserByEmail(borrowerEmail, "Khong tim thay nguoi dung.");
        ensureBorrowerVerified(borrower);

        DeliveryMethod deliveryMethod = resolveDeliveryMethod(request.getDeliveryMethod());
        validateDeliveryDetails(deliveryMethod, request.getAddress(), request.getPhone());

        int totalQty = countCheckoutQuantity(request);
        checkMembershipBorrowLimit(borrower, totalQty);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .status(LoanStatus.PENDING)
                .deliveryMethod(deliveryMethod)
                .deliveryAddress(isHomeDelivery(deliveryMethod) ? normalizeText(request.getAddress()) : null)
                .deliveryPhone(normalizeText(request.getPhone()))
                .note("User checkout request.")
                .build();

        addLoanItemsFromReaderRequest(loan, request, LoanItemStatus.PENDING, null, null);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentTransactions() {
        return loanRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(loan -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("loanId", loan.getId());
                    map.put("userId", loan.getBorrower().getId());
                    map.put("reader", loan.getBorrower().getFullName());
                    map.put("processId", loan.getProcessedBy() != null ? loan.getProcessedBy().getId() : null);
                    map.put("book", loan.getLoanItems().stream()
                            .map(item -> getItemBook(item).getTitle())
                            .collect(Collectors.joining(" • ")));
                    map.put("bookIds", loan.getLoanItems().stream()
                            .map(item -> getItemBook(item).getId())
                            .toList());
                    map.put("status", loan.getStatus().name());
                    map.put("deliveryMethod", loan.getDeliveryMethod().name());
                    map.put("deliveryAddress", loan.getDeliveryAddress());
                    map.put("deliveryPhone", loan.getDeliveryPhone());
                    map.put("trackingCode", loan.getTrackingCode());
                    map.put("createdAt", loan.getCreatedAt());
                    map.put("loanedAt", displayLoanedAt(loan));
                    map.put("dueDate", toDateString(loan.getDueAt()));
                    map.put("returnRequestedAt", loan.getReturnRequestedAt());
                    return map;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyBorrowHistory(Integer userId) {
        return loanRepository.findByBorrowerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(loan -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("loanId", loan.getId());
                    map.put("status", loan.getStatus().name());
                    map.put("deliveryMethod", loan.getDeliveryMethod().name());
                    map.put("deliveryAddress", loan.getDeliveryAddress());
                    map.put("deliveryPhone", loan.getDeliveryPhone());
                    map.put("trackingCode", loan.getTrackingCode());
                    map.put("createdAt", loan.getCreatedAt());
                    map.put("loanedAt", displayLoanedAt(loan));
                    map.put("dueDate", toDateString(loan.getDueAt()));
                    map.put("returnRequestedAt", loan.getReturnRequestedAt());
                    map.put("items", loan.getLoanItems().stream().map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("loanItemId", item.getId());
                        itemMap.put("bookId", getItemBook(item).getId());
                        itemMap.put("bookTitle", getItemBook(item).getTitle());
                        itemMap.put("copyId", item.getBookCopy().getId());
                        itemMap.put("copyBarcode", item.getBookCopy().getBarcode());
                        itemMap.put("copyStatus", item.getBookCopy().getStatus().name());
                        itemMap.put("copyCondition", item.getBookCopy().getCondition().name());
                        itemMap.put("itemStatus", item.getStatus().name());
                        itemMap.put("borrowedAt", item.getBorrowedAt());
                        return itemMap;
                    }).toList());
                    return map;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanTrackingResponseDTO> getMyTracking(String borrowerEmail) {
        User borrower = findUserByEmail(borrowerEmail, "Khong tim thay nguoi dung.");
        return loanRepository.findByBorrowerIdOrderByCreatedAtDesc(borrower.getId())
                .stream()
                .map(this::toTrackingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminLoanKanbanResponseDTO> getKanbanLoans() {
        return loanRepository.findByStatusInOrderByCreatedAtDesc(KANBAN_STATUSES)
                .stream()
                .map(this::toKanbanResponse)
                .toList();
    }

    @Transactional
    public Loan updateAdminStatus(Integer loanId, LoanStatusUpdateRequestDTO request, String staffEmail) {
        Loan loan = findLoanById(loanId);
        User staff = findUserByEmail(staffEmail, "Khong tim thay tai khoan nhan vien.");
        LoanStatus newStatus = resolveLoanStatus(request.getNewStatus());
        LoanStatus oldStatus = loan.getStatus();

        if (!KANBAN_STATUSES.contains(newStatus) && newStatus != LoanStatus.EXPIRED && newStatus != LoanStatus.CANCELLED) {
            throw new BadRequestException("Trang thai cap nhat khong hop le cho quy trinh muon sach.");
        }

        validateStatusTransition(loan, newStatus);

        if (newStatus == LoanStatus.SHIPPING) {
            if (!isHomeDelivery(loan.getDeliveryMethod())) {
                throw new BadRequestException("Don den lay tai quay khong co trang thai SHIPPING.");
            }
        }

        applyStatusChange(loan, newStatus, staff);
        if (newStatus == LoanStatus.SHIPPING) {
            loan.setTrackingCode(normalizeText(request.getTrackingCode()));
        }
        Loan savedLoan = loanRepository.save(loan);
        if (oldStatus != newStatus) {
            notificationService.notifyLoanStatus(savedLoan);
        }
        return savedLoan;
    }

    @Transactional
    public Loan requestReturn(Integer loanId, String borrowerEmail) {
        Loan loan = findLoanById(loanId);
        ensureLoanOwner(loan, borrowerEmail);

        if (loan.getStatus() != LoanStatus.OPEN && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new BadRequestException("Chi co the yeu cau tra sach khi don dang o trang thai OPEN hoac OVERDUE.");
        }

        loan.setStatus(LoanStatus.RETURNING);
        loan.setReturnRequestedAt(LocalDateTime.now());
        loan.getLoanItems().stream()
                .filter(item -> item.getStatus() == LoanItemStatus.BORROWED)
                .forEach(item -> item.setStatus(LoanItemStatus.RETURNING));

        appendNote(loan, "Return requested by user.");
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan confirmReturn(Integer loanId, ConfirmReturnRequestDTO request, String staffEmail) {
        Loan loan = findLoanById(loanId);
        User staff = findUserByEmail(staffEmail, "Khong tim thay tai khoan nhan vien.");

        if (loan.getStatus() != LoanStatus.OPEN && loan.getStatus() != LoanStatus.OVERDUE && loan.getStatus() != LoanStatus.RETURNING) {
            throw new BadRequestException("Chi co the xac nhan tra sach cho don OPEN, OVERDUE hoac RETURNING.");
        }

        List<LoanItem> activeItems = getReturnableItems(loan);
        List<BookCondition> conditions = resolveConditions(request);

        if (conditions.size() != activeItems.size()) {
            throw new BadRequestException("So luong bookConditions phai bang so ban sach dang duoc muon.");
        }

        LocalDateTime now = LocalDateTime.now();
        List<String> issueLogs = new ArrayList<>();

        for (int index = 0; index < activeItems.size(); index++) {
            LoanItem item = activeItems.get(index);
            BookCondition condition = conditions.get(index);

            item.setReturnedAt(now);
            if (condition == BookCondition.OK) {
                item.setStatus(LoanItemStatus.RETURNED);
                returnCopy(item, BookCopyCondition.GOOD);
                createLateFineIfNeeded(loan, item);
                continue;
            }

            if (condition == BookCondition.DAMAGED) {
                item.setStatus(LoanItemStatus.DAMAGED);
                returnCopy(item, BookCopyCondition.DAMAGED);
                createFineIfNeeded(item, FineReason.DAMAGED_BOOK, BigDecimal.valueOf(50000));
            } else {
                item.setStatus(LoanItemStatus.LOST);
                returnCopy(item, BookCopyCondition.LOST);
                createFineIfNeeded(item, FineReason.LOST_BOOK, BigDecimal.valueOf(100000));
            }

            createLateFineIfNeeded(loan, item);

            issueLogs.add(getItemBook(item).getTitle() + "=" + condition.name());
        }

        if (!issueLogs.isEmpty()) {
            String issueSummary = String.join(", ", issueLogs);
            appendNote(loan, "Return issues: " + issueSummary);
            log.warn("Loan {} closed with return issues: {}", loan.getId(), issueSummary);
        }

        loan.setProcessedBy(staff);
        loan.setStatus(LoanStatus.CLOSED);
        loan.setClosedAt(now);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void expireOldPendingLoans() {
        LocalDateTime expiredBefore = LocalDateTime.now().minusHours(Math.max(pendingExpireHours, 1));
        List<Loan> loans = loanRepository.findByStatusAndCreatedAtBefore(LoanStatus.PENDING, expiredBefore);

        for (Loan loan : loans) {
            releaseReservedStock(loan, LocalDateTime.now());
            loan.setStatus(LoanStatus.EXPIRED);
            loan.setClosedAt(LocalDateTime.now());
            appendNote(loan, "Pending loan expired automatically.");
            notificationService.notifyLoanStatus(loanRepository.save(loan));
        }
    }

    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void markOverdueLoans() {
        List<Loan> loans = loanRepository.findByStatusAndDueAtBefore(LoanStatus.OPEN, LocalDateTime.now());

        for (Loan loan : loans) {
            loan.setStatus(LoanStatus.OVERDUE);
            appendNote(loan, "Loan marked overdue automatically.");
            notificationService.notifyLoanStatus(loanRepository.save(loan));
        }
    }

    private void addLoanItemsFromBookIds(
            Loan loan,
            Collection<Integer> bookIds,
            LoanItemStatus itemStatus,
            LocalDateTime borrowedAt,
            LocalDateTime dueAt
    ) {
        if (bookIds == null || bookIds.isEmpty()) {
            throw new BadRequestException("Danh sach bookIds khong duoc de trong.");
        }

        for (Integer bookId : bookIds) {
            if (bookId == null) {
                throw new BadRequestException("bookId khong hop le.");
            }

            Book book = findBookByIdForUpdate(bookId);
            BookCopy copy = reserveBookStock(book);
            if (itemStatus == LoanItemStatus.BORROWED) {
                bookCopyService.markBorrowed(copy);
            }
            loan.addLoanItem(buildLoanItem(copy, itemStatus, borrowedAt, dueAt));
        }
    }

    private void addLoanItemsFromReaderRequest(
            Loan loan,
            LoanCheckoutRequestDTO request,
            LoanItemStatus itemStatus,
            LocalDateTime borrowedAt,
            LocalDateTime dueAt
    ) {
        if (request != null && request.getItems() != null && !request.getItems().isEmpty()) {
            for (LoanCheckoutRequestDTO.CheckoutItem requestItem : request.getItems()) {
                if (requestItem == null || requestItem.getBookId() == null) {
                    throw new BadRequestException("bookId khong hop le.");
                }

                int quantity = requestItem.getQty() == null ? 1 : requestItem.getQty();
                if (quantity < 1) {
                    throw new BadRequestException("So luong sach phai lon hon 0.");
                }

                Book book = findBookByIdForUpdate(requestItem.getBookId());
                for (int index = 0; index < quantity; index++) {
                    BookCopy copy = reserveBookStock(book);
                    if (itemStatus == LoanItemStatus.BORROWED) {
                        bookCopyService.markBorrowed(copy);
                    }
                    loan.addLoanItem(buildLoanItem(copy, itemStatus, borrowedAt, dueAt));
                }
            }
            return;
        }

        addLoanItemsFromBookIds(loan, request != null ? request.getBookIds() : null, itemStatus, borrowedAt, dueAt);
    }

    private int countCheckoutQuantity(LoanCheckoutRequestDTO request) {
        if (request == null) {
            return 0;
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            return request.getItems().stream()
                    .filter(item -> item != null && item.getBookId() != null)
                    .mapToInt(item -> item.getQty() == null ? 1 : Math.max(item.getQty(), 0))
                    .sum();
        }

        return request.getBookIds() == null ? 0 : request.getBookIds().size();
    }

    private LoanItem buildLoanItem(
            BookCopy copy,
            LoanItemStatus itemStatus,
            LocalDateTime borrowedAt,
            LocalDateTime dueAt
    ) {
        return LoanItem.builder()
                .bookCopy(copy)
                .status(itemStatus)
                .borrowedAt(borrowedAt)
                .dueAt(dueAt)
                .build();
    }

    private BookCopy reserveBookStock(Book book) {
        ensureBookCanBeBorrowed(book);
        BookCopy copy = bookCopyService.reserveAvailableCopy(book);
        if (copy != null) {
            return copy;
        }

        throw new BadRequestException("Sach '" + book.getTitle() + "' khong co ban sao kha dung de muon.");
    }

    private void ensureBookCanBeBorrowed(Book book) {
        BookStatus status = book.getStatus() == null ? BookStatus.ACTIVE : book.getStatus();
        if (status == BookStatus.ARCHIVED) {
            throw new BadRequestException("Sach '" + book.getTitle() + "' da duoc luu tru va khong the muon.");
        }
    }

    private void releaseCopy(LoanItem item) {
        bookCopyService.releaseCopy(item.getBookCopy());
    }

    private void returnCopy(LoanItem item, BookCopyCondition condition) {
        bookCopyService.markReturned(item.getBookCopy(), condition);
    }

    private void createLateFineIfNeeded(Loan loan, LoanItem item) {
        LocalDateTime effectiveReturnAt = resolveEffectiveReturnAt(loan, item);
        if (item.getDueAt() == null || effectiveReturnAt == null) {
            return;
        }

        if (effectiveReturnAt.isAfter(item.getDueAt())) {
            createFineIfNeeded(item, FineReason.LATE_RETURN, BigDecimal.valueOf(10000));
        }
    }

    private LocalDateTime resolveEffectiveReturnAt(Loan loan, LoanItem item) {
        if (isHomeDelivery(loan.getDeliveryMethod()) && loan.getReturnRequestedAt() != null) {
            return loan.getReturnRequestedAt();
        }
        return item.getReturnedAt();
    }

    private void createFineIfNeeded(LoanItem item, FineReason reason, BigDecimal amount) {
        fineService.createForLoanItemIfAbsent(item, reason, amount);
    }

    private void activateLoan(Loan loan, LocalDateTime loanedAt) {
        LocalDateTime dueAt = loanedAt.plusDays(DEFAULT_LOAN_DAYS);
        loan.setLoanedAt(loanedAt);
        loan.setDueAt(dueAt);
        loan.getLoanItems().stream()
                .filter(item -> !isTerminalItemStatus(item.getStatus()))
                .forEach(item -> {
                    item.setStatus(LoanItemStatus.BORROWED);
                    item.setBorrowedAt(loanedAt);
                    item.setDueAt(dueAt);
                    bookCopyService.markBorrowed(item.getBookCopy());
                });
    }

    private void releaseReservedStock(Loan loan, LocalDateTime releasedAt) {
        loan.getLoanItems().stream()
                .filter(item -> STOCK_HELD_ITEM_STATUSES.contains(item.getStatus()))
                .forEach(item -> {
                    releaseCopy(item);
                    item.setStatus(LoanItemStatus.RETURNED);
                    item.setReturnedAt(releasedAt);
                });
    }

    private List<LoanItem> getReturnableItems(Loan loan) {
        return loan.getLoanItems().stream()
                .filter(item -> RETURNABLE_ITEM_STATUSES.contains(item.getStatus()))
                .sorted(Comparator
                        .comparing((LoanItem item) -> getItemBook(item).getId())
                        .thenComparing(item -> item.getId() == null ? Integer.MAX_VALUE : item.getId()))
                .toList();
    }

    private List<BookCondition> resolveConditions(ConfirmReturnRequestDTO request) {
        if (request == null || request.getBookConditions() == null || request.getBookConditions().isEmpty()) {
            throw new BadRequestException("bookConditions khong duoc de trong.");
        }

        return request.getBookConditions().stream()
                .map(this::resolveBookCondition)
                .toList();
    }

    private BookCondition resolveBookCondition(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Giá trị tình trạng sách không hợp lệ.");
        }

        return switch (value.trim().toUpperCase()) {
            case "OK" -> BookCondition.OK;
            case "DAMAGED" -> BookCondition.DAMAGED;
            case "LOST" -> BookCondition.LOST;
            default -> throw new BadRequestException("Tình trạng sách phải là OK, DAMAGED hoặc LOST.");
        };
    }

    private void validateStatusTransition(Loan loan, LoanStatus newStatus) {
        LoanStatus currentStatus = loan.getStatus();
        if (currentStatus == newStatus) {
            return;
        }

        if (currentStatus == LoanStatus.CLOSED || currentStatus == LoanStatus.CANCELLED) {
            throw new BadRequestException("Phiếu mượn đã kết thúc, không thể cập nhật trạng thái.");
        }

        boolean allowed = isHomeDelivery(loan.getDeliveryMethod())
                ? isAllowedHomeDeliveryTransition(currentStatus, newStatus)
                : isAllowedPickupTransition(currentStatus, newStatus);

        if (!allowed) {
            throw new BadRequestException("Không thể chuyển trạng thái từ " + currentStatus + " sang " + newStatus + ".");
        }
    }

    private boolean isAllowedPickupTransition(LoanStatus currentStatus, LoanStatus newStatus) {
        return switch (currentStatus) {
            case PENDING -> EnumSet.of(LoanStatus.OPEN, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case OPEN -> EnumSet.of(LoanStatus.CLOSED, LoanStatus.OVERDUE, LoanStatus.EXPIRED).contains(newStatus);
            case OVERDUE -> EnumSet.of(LoanStatus.CLOSED, LoanStatus.EXPIRED).contains(newStatus);
            default -> false;
        };
    }

    private boolean isAllowedHomeDeliveryTransition(LoanStatus currentStatus, LoanStatus newStatus) {
        return switch (currentStatus) {
            case PENDING -> EnumSet.of(LoanStatus.PREPARING, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case PREPARING -> EnumSet.of(LoanStatus.SHIPPING, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case SHIPPING -> EnumSet.of(LoanStatus.OPEN, LoanStatus.EXPIRED).contains(newStatus);
            case OPEN -> EnumSet.of(LoanStatus.RETURNING, LoanStatus.OVERDUE, LoanStatus.EXPIRED).contains(newStatus);
            case OVERDUE -> EnumSet.of(LoanStatus.RETURNING, LoanStatus.CLOSED, LoanStatus.EXPIRED).contains(newStatus);
            case RETURNING -> EnumSet.of(LoanStatus.CLOSED, LoanStatus.EXPIRED).contains(newStatus);
            default -> false;
        };
    }

    private void applyStatusChange(Loan loan, LoanStatus newStatus, User processor) {
        LocalDateTime now = LocalDateTime.now();

        if (processor != null) {
            loan.setProcessedBy(processor);
        }

        if (newStatus == LoanStatus.OPEN && loan.getLoanedAt() == null) {
            activateLoan(loan, now);
        } else if (newStatus == LoanStatus.EXPIRED || newStatus == LoanStatus.CANCELLED) {
            if (loan.getLoanedAt() == null) {
                releaseReservedStock(loan, now);
            }
            loan.setClosedAt(now);
        } else if (newStatus == LoanStatus.CLOSED) {
            closeLoanAsReturned(loan, now);
        }

        loan.setStatus(newStatus);
    }

    private void checkMembershipBorrowLimit(User borrower, int requestedQty) {
        if (borrower.getMembership() != null) {
            int maxLimit = borrower.getMembership().getMaxBorrowLimit();
            int currentBorrowed = countActiveBorrowedBooks(borrower);
            
            if (currentBorrowed + requestedQty > maxLimit) {
                throw new BadRequestException("Gói hội viên của bạn chỉ được giữ tối đa " + maxLimit + " cuốn sách cùng lúc. Bạn đang giữ (hoặc chờ duyệt) " + currentBorrowed + " cuốn, không thể mượn thêm " + requestedQty + " cuốn.");
            }
        }
    }

    private int countActiveBorrowedBooks(User borrower) {
        return loanRepository.findByBorrowerIdOrderByCreatedAtDesc(borrower.getId())
                .stream()
                .filter(loan -> loan.getStatus() != LoanStatus.CLOSED
                        && loan.getStatus() != LoanStatus.CANCELLED
                        && loan.getStatus() != LoanStatus.EXPIRED)
                .mapToInt(loan -> loan.getLoanItems().stream()
                        .filter(item -> !isTerminalItemStatus(item.getStatus()))
                        .mapToInt(item -> 1)
                        .sum())
                .sum();
    }

    private void closeLoanAsReturned(Loan loan, LocalDateTime returnedAt) {
        List<LoanItem> activeItems = getReturnableItems(loan);

        for (LoanItem item : activeItems) {
            item.setStatus(LoanItemStatus.RETURNED);
            item.setReturnedAt(returnedAt);
            returnCopy(item, BookCopyCondition.GOOD);
            createLateFineIfNeeded(loan, item);
        }

        loan.setClosedAt(returnedAt);
    }

    private void ensureBorrowerVerified(User borrower) {
        if (borrower.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException("Tài khoản chưa được xác thực. Vui lòng hoàn thành xác minh KYC.");
        }
    }

    private void ensureLoanOwner(Loan loan, String borrowerEmail) {
        if (!loan.getBorrower().getEmail().equalsIgnoreCase(borrowerEmail)) {
            throw new BadRequestException("Bạn không có quyền thao tác với phiếu mượn này.");
        }
    }

    private User findUserByEmail(String email, String message) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(message));
    }

    /**
     * Lấy sách với pessimistic write lock — dùng khi cần thao tác stock
     * (reserve/checkout) để ngăn race condition giữa các transaction đồng thời.
     */
    private Book findBookByIdForUpdate(Integer bookId) {
        return bookRepository.findWithLockById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID " + bookId + "."));
    }

    private Loan findLoanById(Integer loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn."));
    }

    private Book getItemBook(LoanItem item) {
        return item.getBookCopy().getBook();
    }

    private LoanStatus resolveLoanStatus(String value) {

        return switch (value.trim().toUpperCase()) {
            case "NEW", "PENDING" -> LoanStatus.PENDING;
            case "PACKING", "PREPARING" -> LoanStatus.PREPARING;
            case "SHIPPING" -> LoanStatus.SHIPPING;
            case "BORROWING", "OPEN" -> LoanStatus.OPEN;
            case "OVERDUE" -> LoanStatus.OVERDUE;
            case "RETURNING" -> LoanStatus.RETURNING;
            case "RETURNED", "CLOSED" -> LoanStatus.CLOSED;
            case "EXPIRED" -> LoanStatus.EXPIRED;
            case "CANCELLED" -> LoanStatus.CANCELLED;
            default -> throw new BadRequestException("Trạng thái phiếu mượn không hợp lệ.");
        };
    }

    private DeliveryMethod resolveDeliveryMethod(String value) {
        if (value == null || value.isBlank()) {
            return DeliveryMethod.PICKUP;
        }

        try {
            return DeliveryMethod.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Phương thức nhận sách không hợp lệ.");
        }
    }

    private void validateDeliveryDetails(DeliveryMethod deliveryMethod, String address, String phone) {
        if (normalizeText(phone) == null) {
            throw new BadRequestException("Số điện thoại không được để trống.");
        }
        if (isHomeDelivery(deliveryMethod) && normalizeText(address) == null) {
            throw new BadRequestException("Địa chỉ giao sách không được để trống.");
        }
    }

    private boolean isHomeDelivery(DeliveryMethod deliveryMethod) {
        return deliveryMethod == DeliveryMethod.HOME_DELIVERY;
    }

    private boolean isTerminalItemStatus(LoanItemStatus status) {
        return status == LoanItemStatus.RETURNED
                || status == LoanItemStatus.DAMAGED
                || status == LoanItemStatus.LOST;
    }

    private void appendNote(Loan loan, String fragment) {
        String normalizedFragment = normalizeText(fragment);
        if (normalizedFragment == null) {
            return;
        }

        String currentNote = normalizeText(loan.getNote());
        String merged = currentNote == null ? normalizedFragment : currentNote + " | " + normalizedFragment;
        if (merged.length() > 255) {
            merged = merged.substring(0, 255);
        }
        loan.setNote(merged);
    }

    private LoanTrackingResponseDTO toTrackingResponse(Loan loan) {
        return LoanTrackingResponseDTO.builder()
                .loanId(loan.getId())
                .status(loan.getStatus().name())
                .deliveryMethod(loan.getDeliveryMethod().name())
                .address(loan.getDeliveryAddress())
                .phone(loan.getDeliveryPhone())
                .trackingCode(loan.getTrackingCode())
                .createdAt(loan.getCreatedAt())
                .loanedAt(displayLoanedAt(loan))
                .dueAt(loan.getDueAt())
                .returnRequestedAt(loan.getReturnRequestedAt())
                .closedAt(loan.getClosedAt())
                .items(toTrackingItems(loan))
                .build();
    }

    private AdminLoanKanbanResponseDTO toKanbanResponse(Loan loan) {
        return AdminLoanKanbanResponseDTO.builder()
                .loanId(loan.getId())
                .borrowerId(loan.getBorrower().getId())
                .borrowerName(loan.getBorrower().getFullName())
                .borrowerEmail(loan.getBorrower().getEmail())
                .status(loan.getStatus().name())
                .deliveryMethod(loan.getDeliveryMethod().name())
                .address(loan.getDeliveryAddress())
                .phone(loan.getDeliveryPhone())
                .trackingCode(loan.getTrackingCode())
                .createdAt(loan.getCreatedAt())
                .loanedAt(displayLoanedAt(loan))
                .dueAt(loan.getDueAt())
                .returnRequestedAt(loan.getReturnRequestedAt())
                .borrowerCardCode(buildBorrowerCardCode(loan.getBorrower()))
                .borrowerStudentCode(loan.getBorrower().getIdCardNumber())
                .borrowerMembershipCode(loan.getBorrower().getMembership() != null
                        ? loan.getBorrower().getMembership().getCode()
                        : null)
                .borrowerMembershipName(loan.getBorrower().getMembership() != null
                        ? loan.getBorrower().getMembership().getName()
                        : null)
                .priorityProcessing(isPriorityBorrower(loan.getBorrower()))
                .note(loan.getNote())
                .items(toTrackingItems(loan))
                .build();
    }

    private boolean isPriorityBorrower(User borrower) {
        return borrower != null
                && borrower.getMembership() != null
                && Boolean.TRUE.equals(borrower.getMembership().getPriorityProcessing());
    }

    private List<LoanTrackingItemResponseDTO> toTrackingItems(Loan loan) {
        return loan.getLoanItems().stream()
                .sorted(Comparator
                        .comparing((LoanItem item) -> getItemBook(item).getId())
                        .thenComparing(item -> item.getId() == null ? Integer.MAX_VALUE : item.getId()))
                .map(item -> LoanTrackingItemResponseDTO.builder()
                        .loanItemId(item.getId())
                        .bookId(getItemBook(item).getId())
                        .bookTitle(getItemBook(item).getTitle())
                        .copyId(item.getBookCopy().getId())
                        .copyBarcode(item.getBookCopy().getBarcode())
                        .copyStatus(item.getBookCopy().getStatus() != null
                                ? item.getBookCopy().getStatus().name()
                                : null)
                        .copyCondition(item.getBookCopy().getCondition() != null
                                ? item.getBookCopy().getCondition().name()
                                : null)
                        .status(item.getStatus().name())
                .build())
                .toList();
    }

    private String buildBorrowerCardCode(User borrower) {
        if (borrower == null || borrower.getId() == null) {
            return null;
        }

        return "LIB-USER-" + borrower.getId();
    }

    private LocalDateTime displayLoanedAt(Loan loan) {
        return loan.getLoanedAt() != null ? loan.getLoanedAt() : loan.getCreatedAt();
    }

    private String toDateString(LocalDateTime value) {
        return value == null ? null : value.toLocalDate().toString();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private enum BookCondition {
        OK,
        DAMAGED,
        LOST
    }
}
