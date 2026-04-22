package com.library.module.circulation.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.library.module.book.entity.Book;
import com.library.module.book.repository.BookRepository;
import com.library.module.circulation.dto.request.CheckoutRequestDTO;
import com.library.module.circulation.entity.Loan;
import com.library.module.circulation.entity.LoanItem;
import com.library.module.circulation.entity.LoanItemStatus;
import com.library.module.circulation.entity.LoanStatus;
import com.library.module.circulation.repository.LoanRepository;
import com.library.module.user.entity.User;
import com.library.module.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public Loan checkoutBooks(CheckoutRequestDTO request, Integer processedById) {
        User borrower = userRepository.findById(request.getBorrowerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        User processor = userRepository.findById(processedById)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người xử lý."));

        LocalDateTime dueAt = LocalDateTime.now().plusDays(request.getDueDays());

        Loan loan = Loan.builder()
                .borrower(borrower)
                .processedBy(processor)
                .status(LoanStatus.OPEN)
                .dueAt(dueAt)
                .build();

        for (CheckoutRequestDTO.CheckoutItem reqItem : request.getItems()) {
            Book book = bookRepository.findById(reqItem.getBookId())
                    .orElseThrow(() -> new RuntimeException("Sách ID " + reqItem.getBookId() + " không tồn tại."));

            if (book.getStockAvailable() < reqItem.getQty()) {
                throw new RuntimeException("Sách '" + book.getTitle() + "' không đủ số lượng trong kho.");
            }

            book.setStockAvailable(book.getStockAvailable() - reqItem.getQty());
            bookRepository.save(book);

            LoanItem loanItem = LoanItem.builder()
                    .book(book)
                    .qty(reqItem.getQty())
                    .status(LoanItemStatus.BORROWED)
                    .dueAt(dueAt)
                    .build();

            loan.addLoanItem(loanItem);
        }

        return loanRepository.save(loan);
    }

    @Transactional
    public void returnBook(Integer loanId, Integer bookId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn."));

        LoanItem itemToReturn = loan.getLoanItems().stream()
                .filter(item -> item.getBook().getId().equals(bookId) && item.getStatus() == LoanItemStatus.BORROWED)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sách không nằm trong phiếu mượn hoặc đã được xử lý."));

        itemToReturn.setStatus(LoanItemStatus.RETURNED);
        itemToReturn.setReturnedAt(LocalDateTime.now());

        Book book = itemToReturn.getBook();
        book.setStockAvailable(book.getStockAvailable() + itemToReturn.getQty());
        bookRepository.save(book);

        boolean allProcessed = loan.getLoanItems().stream()
                .allMatch(item -> item.getStatus() != LoanItemStatus.BORROWED);
        if (allProcessed) {
            loan.setStatus(LoanStatus.CLOSED);
            loan.setClosedAt(LocalDateTime.now());
        }

        loanRepository.save(loan);
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
                
                String allBooks = loan.getLoanItems().stream()
                        .map(item -> item.getBook().getTitle())
                        .collect(Collectors.joining(" • "));
                
                List<Integer> allBookIds = loan.getLoanItems().stream()
                        .map(item -> item.getBook().getId())
                        .collect(Collectors.toList());

                map.put("book", allBooks); 
                map.put("bookIds", allBookIds); 
                
                map.put("status", loan.getStatus().name());
                map.put("dueDate", loan.getDueAt().toLocalDate().toString());
                return map;
            })
            .collect(Collectors.toList());
}

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyBorrowHistory(Integer userId) {
        return loanRepository.findByBorrowerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(loan -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("loanId", loan.getId());
                    map.put("status", loan.getStatus().name());
                    map.put("dueDate", loan.getDueAt().toLocalDate().toString());
                    
                    List<Map<String, Object>> items = loan.getLoanItems().stream().map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("bookTitle", item.getBook().getTitle());
                        itemMap.put("itemStatus", item.getStatus().name());
                        return itemMap;
                    }).collect(Collectors.toList());
                    
                    map.put("items", items);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Loan reserveBook(String borrowerEmail, Integer bookId, String pickupDate) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Sách không tồn tại."));

        if (book.getStockAvailable() < 1) {
            throw new RuntimeException("Sách này đã hết trong kho, không thể đặt trước.");
        }

        book.setStockAvailable(book.getStockAvailable() - 1);
        bookRepository.save(book);

        LocalDateTime dueAt = java.time.LocalDate.parse(pickupDate).atStartOfDay().plusDays(14);

        Loan loan = Loan.builder()
                .borrower(borrower)
                .processedBy(null) 
                .status(LoanStatus.OPEN)
                .dueAt(dueAt)
                .note("Độc giả đặt trực tuyến. Hẹn đến lấy sách ngày: " + pickupDate) 
                .build();

        LoanItem loanItem = LoanItem.builder()
                .book(book)
                .qty(1)
                .status(LoanItemStatus.BORROWED)
                .dueAt(dueAt)
                .build();

        loan.addLoanItem(loanItem);
        return loanRepository.save(loan);
    }

    public List<Loan> getPendingReservations() {
        return loanRepository.findByProcessedByIsNullOrderByCreatedAtDesc();
    }

    @Transactional
    public Loan confirmReservation(Integer loanId, String librarianEmail) {
        User librarian = userRepository.findByEmail(librarianEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản thủ thư."));

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn."));

        if (loan.getProcessedBy() != null) {
            throw new RuntimeException("Phiếu này đã được xử lý bởi người khác!");
        }

        loan.setProcessedBy(librarian);
        
        loan.setNote(loan.getNote() + " - Đã xác nhận.");

        return loanRepository.save(loan);
    }

    @Transactional
    public Loan cancelReservation(Integer loanId, String librarianEmail, String reason) {
        User librarian = userRepository.findByEmail(librarianEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản thủ thư."));

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn."));

        if (loan.getProcessedBy() != null) {
            throw new RuntimeException("Phiếu này đã được xử lý, không thể hủy!");
        }

        loan.setProcessedBy(librarian);
        loan.setStatus(LoanStatus.CANCELLED);
        loan.setClosedAt(LocalDateTime.now()); 
        loan.setNote(loan.getNote() + " | Hủy bởi: " + librarianEmail + " - Lý do: " + reason);

        for (LoanItem item : loan.getLoanItems()) {
            if (item.getStatus() == LoanItemStatus.BORROWED) {
                item.setStatus(LoanItemStatus.RETURNED);
                item.setReturnedAt(LocalDateTime.now()); 
                
                Book book = item.getBook();
                book.setStockAvailable(book.getStockAvailable() + item.getQty());
                bookRepository.save(book);
            }
        }

        return loanRepository.save(loan);
    }
}