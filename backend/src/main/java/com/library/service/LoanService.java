package com.library.service;

import java.time.LocalDateTime;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.dto.request.CheckoutRequestDTO;
import com.library.dto.request.ConfirmReturnRequestDTO;
import com.library.dto.request.LoanCheckoutRequestDTO;
import com.library.dto.request.LoanStatusUpdateRequestDTO;
import com.library.dto.response.AdminLoanKanbanResponseDTO;
import com.library.dto.response.LoanTrackingItemResponseDTO;
import com.library.dto.response.LoanTrackingResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookStatus;
import com.library.entity.DeliveryMethod;
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

    @Transactional
    public Loan checkoutBooks(CheckoutRequestDTO request, Integer processedById) {
        User borrower = findUserById(request.getBorrowerId(), "Khong tim thay nguoi dung.");
        User processor = findUserById(processedById, "Khong tim thay nguoi xu ly.");
        DeliveryMethod deliveryMethod = resolveDeliveryMethod(request.getDeliveryMethod());
        validateDeliveryDetails(deliveryMethod, request.getDeliveryAddress(), request.getDeliveryPhone());

        int totalQty = request.getItems() != null ? request.getItems().stream().mapToInt(item -> item.getQty() != null ? item.getQty() : 1).sum() : 0;
        checkMembershipBorrowLimit(borrower, totalQty);

        LocalDateTime loanedAt = LocalDateTime.now();
        LocalDateTime dueAt = loanedAt.plusDays(resolveDueDays(request.getDueDays()));

        Loan loan = Loan.builder()
                .borrower(borrower)
                .processedBy(processor)
                .status(LoanStatus.OPEN)
                .deliveryMethod(deliveryMethod)
                .deliveryAddress(isHomeDelivery(deliveryMethod) ? normalizeText(request.getDeliveryAddress()) : null)
                .deliveryPhone(normalizeText(request.getDeliveryPhone()))
                .trackingCode(normalizeText(request.getTrackingCode()))
                .loanedAt(loanedAt)
                .dueAt(dueAt)
                .build();

        addLoanItemsFromCheckoutRequest(loan, request, LoanItemStatus.BORROWED, loanedAt, dueAt);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan checkoutOnline(CheckoutRequestDTO request, Integer borrowerId) {
        User borrower = findUserById(borrowerId, "Khong tim thay nguoi dung.");
        ensureBorrowerVerified(borrower);

        DeliveryMethod deliveryMethod = resolveDeliveryMethod(request.getDeliveryMethod());
        validateDeliveryDetails(deliveryMethod, request.getDeliveryAddress(), request.getDeliveryPhone());

        int totalQty = request.getItems() != null ? request.getItems().stream().mapToInt(item -> item.getQty() != null ? item.getQty() : 1).sum() : 0;
        checkMembershipBorrowLimit(borrower, totalQty);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .status(LoanStatus.PENDING)
                .deliveryMethod(deliveryMethod)
                .deliveryAddress(isHomeDelivery(deliveryMethod) ? normalizeText(request.getDeliveryAddress()) : null)
                .deliveryPhone(normalizeText(request.getDeliveryPhone()))
                .trackingCode(normalizeText(request.getTrackingCode()))
                .note("Reader created online loan.")
                .build();

        addLoanItemsFromCheckoutRequest(loan, request, LoanItemStatus.PENDING, null, null);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan checkoutForCurrentUser(LoanCheckoutRequestDTO request, String borrowerEmail) {
        User borrower = findUserByEmail(borrowerEmail, "Khong tim thay nguoi dung.");
        ensureBorrowerVerified(borrower);

        DeliveryMethod deliveryMethod = resolveDeliveryMethod(request.getDeliveryMethod());
        validateDeliveryDetails(deliveryMethod, request.getAddress(), request.getPhone());

        int totalQty = request.getBookIds() != null ? request.getBookIds().size() : 0;
        checkMembershipBorrowLimit(borrower, totalQty);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .status(LoanStatus.PENDING)
                .deliveryMethod(deliveryMethod)
                .deliveryAddress(isHomeDelivery(deliveryMethod) ? normalizeText(request.getAddress()) : null)
                .deliveryPhone(normalizeText(request.getPhone()))
                .note("User checkout request.")
                .build();

        addLoanItemsFromBookIds(loan, request.getBookIds(), LoanItemStatus.PENDING, null, null);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public void returnBook(Integer loanId, Integer bookId) {
        Loan loan = findLoanById(loanId);

        LoanItem itemToReturn = loan.getLoanItems().stream()
                .filter(item -> item.getBook().getId().equals(bookId) && item.getStatus() == LoanItemStatus.BORROWED)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Sach khong nam trong phieu muon hoac da duoc xu ly."));

        itemToReturn.setStatus(LoanItemStatus.RETURNED);
        itemToReturn.setReturnedAt(LocalDateTime.now());
        incrementStock(itemToReturn.getBook());

        boolean allProcessed = loan.getLoanItems().stream()
                .noneMatch(item -> RETURNABLE_ITEM_STATUSES.contains(item.getStatus()));

        if (allProcessed) {
            loan.setStatus(LoanStatus.CLOSED);
            loan.setClosedAt(LocalDateTime.now());
        }

        Loan savedLoan = loanRepository.save(loan);
        if (allProcessed) {
            notificationService.notifyLoanStatus(savedLoan);
        }
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
                            .map(item -> item.getBook().getTitle())
                            .collect(Collectors.joining(" • ")));
                    map.put("bookIds", loan.getLoanItems().stream()
                            .map(item -> item.getBook().getId())
                            .toList());
                    map.put("status", loan.getStatus().name());
                    map.put("deliveryMethod", loan.getDeliveryMethod().name());
                    map.put("deliveryAddress", loan.getDeliveryAddress());
                    map.put("deliveryPhone", loan.getDeliveryPhone());
                    map.put("trackingCode", loan.getTrackingCode());
                    map.put("dueDate", toDateString(loan.getDueAt()));
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
                    map.put("dueDate", toDateString(loan.getDueAt()));
                    map.put("items", loan.getLoanItems().stream().map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("bookTitle", item.getBook().getTitle());
                        itemMap.put("itemStatus", item.getStatus().name());
                        return itemMap;
                    }).toList());
                    return map;
                })
                .toList();
    }

    @Transactional
    public Loan reserveBook(
            String borrowerEmail,
            Integer bookId,
            String pickupDate,
            String deliveryMethodValue,
            String deliveryAddress,
            String deliveryPhone
    ) {
        User borrower = findUserByEmail(borrowerEmail, "Khong tim thay nguoi dung.");
        ensureBorrowerVerified(borrower);

        DeliveryMethod deliveryMethod = resolveDeliveryMethod(deliveryMethodValue);
        validateDeliveryDetails(deliveryMethod, deliveryAddress, deliveryPhone);

        checkMembershipBorrowLimit(borrower, 1);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .status(LoanStatus.PENDING)
                .deliveryMethod(deliveryMethod)
                .deliveryAddress(isHomeDelivery(deliveryMethod) ? normalizeText(deliveryAddress) : null)
                .deliveryPhone(normalizeText(deliveryPhone))
                .note(buildReservationNote(pickupDate))
                .build();

        addLoanItemsFromBookIds(loan, List.of(bookId), LoanItemStatus.PENDING, null, null);
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional(readOnly = true)
    public List<Loan> getPendingReservations() {
        return loanRepository.findByProcessedByIsNullOrderByCreatedAtDesc();
    }

    @Transactional
    public Loan confirmReservation(Integer loanId, String librarianEmail) {
        User librarian = findUserByEmail(librarianEmail, "Khong tim thay tai khoan thu thu.");
        Loan loan = findLoanById(loanId);

        if (loan.getProcessedBy() != null) {
            throw new BadRequestException("Phieu nay da duoc xu ly boi nguoi khac.");
        }

        loan.setProcessedBy(librarian);
        loan.setStatus(LoanStatus.PREPARING);
        appendNote(loan, "Reservation confirmed.");
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan cancelReservation(Integer loanId, String librarianEmail, String reason) {
        User librarian = findUserByEmail(librarianEmail, "Khong tim thay tai khoan thu thu.");
        Loan loan = findLoanById(loanId);

        if (loan.getProcessedBy() != null) {
            throw new BadRequestException("Phieu nay da duoc xu ly, khong the huy.");
        }

        loan.setProcessedBy(librarian);
        loan.setStatus(LoanStatus.CANCELLED);
        loan.setClosedAt(LocalDateTime.now());
        appendNote(loan, "Cancelled: " + normalizeText(reason));
        releaseReservedStock(loan, LocalDateTime.now());
        Loan savedLoan = loanRepository.save(loan);
        notificationService.notifyLoanStatus(savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan updateStatus(Integer loanId, String statusValue) {
        Loan loan = findLoanById(loanId);
        LoanStatus newStatus = resolveLoanStatus(statusValue);
        LoanStatus oldStatus = loan.getStatus();
        validateStatusTransition(loan, newStatus);
        applyStatusChange(loan, newStatus, null);
        Loan savedLoan = loanRepository.save(loan);
        if (oldStatus != newStatus) {
            notificationService.notifyLoanStatus(savedLoan);
        }
        return savedLoan;
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

        if (!isHomeDelivery(loan.getDeliveryMethod())) {
            throw new BadRequestException("Don nhan tai quay se duoc thu thu xac nhan tra sach truc tiep.");
        }

        if (loan.getStatus() != LoanStatus.OPEN) {
            throw new BadRequestException("Chi co the yeu cau tra sach khi don dang o trang thai OPEN.");
        }

        loan.setStatus(LoanStatus.RETURNING);
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

        if (loan.getStatus() != LoanStatus.OPEN && loan.getStatus() != LoanStatus.RETURNING) {
            throw new BadRequestException("Chi co the xac nhan tra sach cho don OPEN hoac RETURNING.");
        }

        normalizeLoanItemsToUnitCopies(loan);
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
                incrementStock(item.getBook());
                continue;
            }

            if (condition == BookCondition.DAMAGED) {
                item.setStatus(LoanItemStatus.DAMAGED);
            } else {
                item.setStatus(LoanItemStatus.LOST);
            }

            issueLogs.add(item.getBook().getTitle() + "=" + condition.name());
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

    private void addLoanItemsFromCheckoutRequest(
            Loan loan,
            CheckoutRequestDTO request,
            LoanItemStatus itemStatus,
            LocalDateTime borrowedAt,
            LocalDateTime dueAt
    ) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Danh sach sach khong duoc de trong.");
        }

        for (CheckoutRequestDTO.CheckoutItem requestItem : request.getItems()) {
            if (requestItem == null || requestItem.getBookId() == null) {
                throw new BadRequestException("bookId khong hop le.");
            }

            int quantity = requestItem.getQty() == null ? 1 : requestItem.getQty();
            if (quantity < 1) {
                throw new BadRequestException("So luong sach phai lon hon 0.");
            }

            Book book = findBookById(requestItem.getBookId());
            reserveBookStock(book, quantity);
            for (int index = 0; index < quantity; index++) {
                loan.addLoanItem(buildLoanItem(book, itemStatus, borrowedAt, dueAt));
            }
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

            Book book = findBookById(bookId);
            reserveBookStock(book, 1);
            loan.addLoanItem(buildLoanItem(book, itemStatus, borrowedAt, dueAt));
        }
    }

    private LoanItem buildLoanItem(
            Book book,
            LoanItemStatus itemStatus,
            LocalDateTime borrowedAt,
            LocalDateTime dueAt
    ) {
        return LoanItem.builder()
                .book(book)
                .qty(1)
                .status(itemStatus)
                .borrowedAt(borrowedAt)
                .dueAt(dueAt)
                .build();
    }

    private void reserveBookStock(Book book, int quantity) {
        ensureBookCanBeBorrowed(book);
        int available = book.getStockAvailable() == null ? 0 : book.getStockAvailable();
        if (available < quantity) {
            throw new BadRequestException("Sach '" + book.getTitle() + "' da het hoac khong du ton kho.");
        }
        book.setStockAvailable(available - quantity);
    }

    private void ensureBookCanBeBorrowed(Book book) {
        BookStatus status = book.getStatus() == null ? BookStatus.ACTIVE : book.getStatus();
        if (status == BookStatus.ARCHIVED) {
            throw new BadRequestException("Sach '" + book.getTitle() + "' da duoc luu tru va khong the muon.");
        }
    }

    private void incrementStock(Book book) {
        int available = book.getStockAvailable() == null ? 0 : book.getStockAvailable();
        book.setStockAvailable(available + 1);
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
                });
    }

    private void releaseReservedStock(Loan loan, LocalDateTime releasedAt) {
        loan.getLoanItems().stream()
                .filter(item -> STOCK_HELD_ITEM_STATUSES.contains(item.getStatus()))
                .forEach(item -> {
                    incrementStock(item.getBook());
                    item.setStatus(LoanItemStatus.RETURNED);
                    item.setReturnedAt(releasedAt);
                });
    }

    private void normalizeLoanItemsToUnitCopies(Loan loan) {
        List<LoanItem> extraItems = new ArrayList<>();
        for (LoanItem item : new ArrayList<>(loan.getLoanItems())) {
            int quantity = item.getQty() == null ? 1 : item.getQty();
            if (quantity <= 1) {
                continue;
            }

            item.setQty(1);
            for (int index = 1; index < quantity; index++) {
                extraItems.add(LoanItem.builder()
                        .book(item.getBook())
                        .qty(1)
                        .status(item.getStatus())
                        .borrowedAt(item.getBorrowedAt())
                        .dueAt(item.getDueAt())
                        .returnedAt(item.getReturnedAt())
                        .build());
            }
        }

        extraItems.forEach(loan::addLoanItem);
    }

    private List<LoanItem> getReturnableItems(Loan loan) {
        return loan.getLoanItems().stream()
                .filter(item -> RETURNABLE_ITEM_STATUSES.contains(item.getStatus()))
                .sorted(Comparator
                        .comparing((LoanItem item) -> item.getBook().getId())
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
            throw new BadRequestException("Gia tri bookCondition khong hop le.");
        }

        return switch (value.trim().toUpperCase()) {
            case "OK" -> BookCondition.OK;
            case "DAMAGED" -> BookCondition.DAMAGED;
            case "LOST" -> BookCondition.LOST;
            default -> throw new BadRequestException("bookCondition phai la OK, DAMAGED hoac LOST.");
        };
    }

    private void validateStatusTransition(Loan loan, LoanStatus newStatus) {
        LoanStatus currentStatus = loan.getStatus();
        if (currentStatus == newStatus) {
            return;
        }

        if (currentStatus == LoanStatus.CLOSED || currentStatus == LoanStatus.CANCELLED) {
            throw new BadRequestException("Phieu muon da ket thuc, khong the cap nhat trang thai.");
        }

        boolean allowed = isHomeDelivery(loan.getDeliveryMethod())
                ? isAllowedHomeDeliveryTransition(currentStatus, newStatus)
                : isAllowedPickupTransition(currentStatus, newStatus);

        if (!allowed) {
            throw new BadRequestException("Khong the chuyen trang thai tu " + currentStatus + " sang " + newStatus + ".");
        }
    }

    private boolean isAllowedPickupTransition(LoanStatus currentStatus, LoanStatus newStatus) {
        return switch (currentStatus) {
            case PENDING -> EnumSet.of(LoanStatus.OPEN, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case OPEN -> EnumSet.of(LoanStatus.CLOSED, LoanStatus.EXPIRED).contains(newStatus);
            default -> false;
        };
    }

    private boolean isAllowedHomeDeliveryTransition(LoanStatus currentStatus, LoanStatus newStatus) {
        return switch (currentStatus) {
            case PENDING -> EnumSet.of(LoanStatus.PREPARING, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case PREPARING -> EnumSet.of(LoanStatus.SHIPPING, LoanStatus.CANCELLED, LoanStatus.EXPIRED).contains(newStatus);
            case SHIPPING -> EnumSet.of(LoanStatus.OPEN, LoanStatus.EXPIRED).contains(newStatus);
            case OPEN -> EnumSet.of(LoanStatus.RETURNING, LoanStatus.EXPIRED).contains(newStatus);
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
                        .mapToInt(item -> item.getQty() != null ? item.getQty() : 1)
                        .sum())
                .sum();
    }

    private void closeLoanAsReturned(Loan loan, LocalDateTime returnedAt) {
        normalizeLoanItemsToUnitCopies(loan);
        List<LoanItem> activeItems = getReturnableItems(loan);

        for (LoanItem item : activeItems) {
            item.setStatus(LoanItemStatus.RETURNED);
            item.setReturnedAt(returnedAt);
            incrementStock(item.getBook());
        }

        loan.setClosedAt(returnedAt);
    }

    private void ensureBorrowerVerified(User borrower) {
        if (borrower.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException("Tai khoan chua duoc VERIFIED.");
        }
    }

    private void ensureLoanOwner(Loan loan, String borrowerEmail) {
        if (!loan.getBorrower().getEmail().equalsIgnoreCase(borrowerEmail)) {
            throw new BadRequestException("Ban khong co quyen thao tac voi phieu muon nay.");
        }
    }

    private User findUserById(Integer userId, String message) {
        if (userId == null) {
            throw new BadRequestException(message);
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(message));
    }

    private User findUserByEmail(String email, String message) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(message));
    }

    private Book findBookById(Integer bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay sach co ID " + bookId + "."));
    }

    private Loan findLoanById(Integer loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phieu muon."));
    }

    private int resolveDueDays(Integer dueDays) {
        if (dueDays == null) {
            return DEFAULT_LOAN_DAYS;
        }
        if (dueDays < 1) {
            throw new BadRequestException("dueDays phai lon hon 0.");
        }
        return dueDays;
    }

    private LoanStatus resolveLoanStatus(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Trang thai phieu muon khong hop le.");
        }

        return switch (value.trim().toUpperCase()) {
            case "NEW", "PENDING" -> LoanStatus.PENDING;
            case "PACKING", "PREPARING" -> LoanStatus.PREPARING;
            case "SHIPPING" -> LoanStatus.SHIPPING;
            case "BORROWING", "OPEN" -> LoanStatus.OPEN;
            case "RETURNING" -> LoanStatus.RETURNING;
            case "RETURNED", "CLOSED" -> LoanStatus.CLOSED;
            case "OVERDUE", "EXPIRED" -> LoanStatus.EXPIRED;
            case "CANCELLED" -> LoanStatus.CANCELLED;
            default -> throw new BadRequestException("Trang thai phieu muon khong hop le.");
        };
    }

    private DeliveryMethod resolveDeliveryMethod(String value) {
        if (value == null || value.isBlank()) {
            return DeliveryMethod.PICKUP;
        }

        try {
            return DeliveryMethod.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Phuong thuc nhan sach khong hop le.");
        }
    }

    private void validateDeliveryDetails(DeliveryMethod deliveryMethod, String address, String phone) {
        if (normalizeText(phone) == null) {
            throw new BadRequestException("So dien thoai khong duoc de trong.");
        }
        if (isHomeDelivery(deliveryMethod) && normalizeText(address) == null) {
            throw new BadRequestException("Dia chi giao sach khong duoc de trong.");
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

    private String buildReservationNote(String pickupDate) {
        String normalizedPickupDate = normalizeText(pickupDate);
        if (normalizedPickupDate == null) {
            return "Online reservation created.";
        }
        return "Online reservation created. Pickup date: " + normalizedPickupDate;
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
                .loanedAt(loan.getLoanedAt())
                .dueAt(loan.getDueAt())
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
                .note(loan.getNote())
                .items(toTrackingItems(loan))
                .build();
    }

    private List<LoanTrackingItemResponseDTO> toTrackingItems(Loan loan) {
        return loan.getLoanItems().stream()
                .sorted(Comparator
                        .comparing((LoanItem item) -> item.getBook().getId())
                        .thenComparing(item -> item.getId() == null ? Integer.MAX_VALUE : item.getId()))
                .map(item -> LoanTrackingItemResponseDTO.builder()
                        .loanItemId(item.getId())
                        .bookId(item.getBook().getId())
                        .bookTitle(item.getBook().getTitle())
                        .quantity(item.getQty())
                        .status(item.getStatus().name())
                        .build())
                .toList();
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
