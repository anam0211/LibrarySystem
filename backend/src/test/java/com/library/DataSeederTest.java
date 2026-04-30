package com.library;

import com.library.entity.*;
import com.library.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
public class DataSeederTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private FineRepository fineRepository;

    @Test
    @Transactional
    @Commit
    public void seedDataForUser3() {
        // Lấy User ID = 3
        User user3 = userRepository.findById(3).orElse(null);
        if (user3 == null) {
            System.out.println("User ID = 3 không tồn tại. Bỏ qua seed data.");
            return;
        }

        // Tạo 1 đơn mượn sách (Sách đang mượn)
        Loan activeLoan = new Loan();
        activeLoan.setBorrower(user3);
        activeLoan.setStatus(LoanStatus.OPEN);
        activeLoan.setLoanedAt(LocalDateTime.now().minusDays(5)); // Mượn cách đây 5 ngày
        activeLoan.setDueAt(LocalDateTime.now().plusDays(9)); // Còn 9 ngày nữa phải trả
        
        // Thêm thông tin giao hàng
        activeLoan.setDeliveryMethod(DeliveryMethod.HOME_DELIVERY);
        activeLoan.setDeliveryAddress("KTX Bách Khoa, Tòa B1");
        activeLoan.setDeliveryPhone("0987654321");
        activeLoan.setTrackingCode("GHTK-9988123");

        // Lấy thử 2 cuốn sách đầu tiên trong DB để cho mượn
        List<Book> allBooks = bookRepository.findAll();
        if (allBooks.size() >= 2) {
            Book book1 = allBooks.get(0);
            Book book2 = allBooks.get(1);

            LoanItem item1 = new LoanItem();
            item1.setLoan(activeLoan);
            item1.setBook(book1);
            item1.setBorrowedAt(LocalDateTime.now().minusDays(5));
            item1.setDueAt(LocalDateTime.now().plusDays(9));

            LoanItem item2 = new LoanItem();
            item2.setLoan(activeLoan);
            item2.setBook(book2);
            item2.setBorrowedAt(LocalDateTime.now().minusDays(5));
            item2.setDueAt(LocalDateTime.now().plusDays(9));

            activeLoan.setLoanItems(List.of(item1, item2));
            loanRepository.save(activeLoan);
            System.out.println("Đã tạo Đơn mượn sách (Loan) thành công!");

            // Tạo 1 phiếu phạt chưa thanh toán (Ví dụ: Làm rách cuốn sách khác ở đơn cũ)
            Loan oldLoan = new Loan();
            oldLoan.setBorrower(user3);
            oldLoan.setStatus(LoanStatus.CLOSED); // Đơn cũ đã đóng
            oldLoan.setLoanedAt(LocalDateTime.now().minusDays(30));
            oldLoan.setDueAt(LocalDateTime.now().minusDays(16));
            loanRepository.save(oldLoan);

            Fine unpaidFine = new Fine();
            unpaidFine.setUser(user3);
            unpaidFine.setLoan(oldLoan);
            unpaidFine.setAmount(new BigDecimal("50000.00")); // Phạt 50k
            unpaidFine.setReason(FineReason.DAMAGED_BOOK);
            unpaidFine.setStatus(FineStatus.UNPAID);
            fineRepository.save(unpaidFine);

            // Tạo 1 phiếu phạt trễ hạn đã thanh toán
            Fine paidFine = new Fine();
            paidFine.setUser(user3);
            paidFine.setLoan(oldLoan);
            paidFine.setAmount(new BigDecimal("15000.00")); // Phạt trễ 15k
            paidFine.setReason(FineReason.LATE_RETURN);
            paidFine.setStatus(FineStatus.PAID);
            paidFine.setPaidAt(LocalDateTime.now().minusDays(2));
            fineRepository.save(paidFine);

            System.out.println("Đã tạo Phiếu phạt (Fine) thành công!");
        } else {
            System.out.println("Không đủ sách trong DB để tạo dữ liệu mẫu.");
        }
    }
}
