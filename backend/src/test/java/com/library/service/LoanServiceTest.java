package com.library.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.library.dto.request.ConfirmReturnRequestDTO;
import com.library.entity.BookCopy;
import com.library.entity.BookCopyCondition;
import com.library.entity.DeliveryMethod;
import com.library.entity.Fine;
import com.library.entity.FineReason;
import com.library.entity.Loan;
import com.library.entity.LoanItem;
import com.library.entity.LoanItemStatus;
import com.library.entity.LoanStatus;
import com.library.entity.User;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private UserRepository userRepository;

    private RecordingFineService fineService;

    private LoanService loanService;

    @BeforeEach
    void setUp() {
        fineService = new RecordingFineService();
        loanService = new LoanService(
                loanRepository,
                null,
                userRepository,
                new SilentNotificationService(),
                fineService,
                new SilentBookCopyService());
    }

    @Test
    void requestReturnStoresRequestTime() {
        Loan loan = loan(DeliveryMethod.HOME_DELIVERY, LoanStatus.OPEN);
        when(loanRepository.findById(1)).thenReturn(Optional.of(loan));
        when(loanRepository.save(loan)).thenReturn(loan);

        LocalDateTime beforeRequest = LocalDateTime.now();
        loanService.requestReturn(1, "reader@example.com");

        assertNotNull(loan.getReturnRequestedAt());
        assertTrue(!loan.getReturnRequestedAt().isBefore(beforeRequest));
        assertTrue(!loan.getReturnRequestedAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void confirmReturnDoesNotFineHomeDeliveryRequestedBeforeDueDate() {
        Loan loan = returnableLoan(DeliveryMethod.HOME_DELIVERY);
        loan.setReturnRequestedAt(LocalDateTime.now().minusDays(2));
        LoanItem item = loan.getLoanItems().getFirst();

        confirmReturn(loan);

        assertFalse(fineService.wasLateFineCreatedFor(item));
    }

    @Test
    void confirmReturnFinesPickupReceivedAfterDueDateEvenWhenRequestedEarlier() {
        Loan loan = returnableLoan(DeliveryMethod.PICKUP);
        loan.setReturnRequestedAt(LocalDateTime.now().minusDays(2));
        LoanItem item = loan.getLoanItems().getFirst();

        confirmReturn(loan);

        assertTrue(fineService.wasLateFineCreatedFor(item));
    }

    private void confirmReturn(Loan loan) {
        ConfirmReturnRequestDTO request = new ConfirmReturnRequestDTO();
        request.setBookConditions(List.of("OK"));
        User staff = new User();

        when(loanRepository.findById(1)).thenReturn(Optional.of(loan));
        when(userRepository.findByEmail("staff@example.com")).thenReturn(Optional.of(staff));
        when(loanRepository.save(loan)).thenReturn(loan);

        loanService.confirmReturn(1, request, "staff@example.com");
    }

    private Loan returnableLoan(DeliveryMethod method) {
        Loan loan = loan(method, LoanStatus.RETURNING);
        LoanItem item = LoanItem.builder()
                .id(7)
                .bookCopy(new BookCopy())
                .status(LoanItemStatus.RETURNING)
                .dueAt(LocalDateTime.now().minusDays(1))
                .build();
        loan.addLoanItem(item);
        return loan;
    }

    private Loan loan(DeliveryMethod method, LoanStatus status) {
        User borrower = new User();
        borrower.setEmail("reader@example.com");
        return Loan.builder()
                .id(1)
                .borrower(borrower)
                .deliveryMethod(method)
                .status(status)
                .build();
    }

    private static class SilentNotificationService extends NotificationService {
        SilentNotificationService() {
            super(null, null);
        }

        @Override
        public void notifyLoanStatus(Loan loan) {
            // Notification delivery is outside the late-return policy under test.
        }
    }

    private static class SilentBookCopyService extends BookCopyService {
        SilentBookCopyService() {
            super(null, null, null);
        }

        @Override
        public void markReturned(BookCopy copy, BookCopyCondition condition) {
            // Stock synchronization is outside the late-return policy under test.
        }
    }

    private static class RecordingFineService extends FineService {
        private LoanItem lateFineItem;

        RecordingFineService() {
            super(null, null, null);
        }

        @Override
        public Fine createForLoanItemIfAbsent(LoanItem item, FineReason reason, BigDecimal amount) {
            if (reason == FineReason.LATE_RETURN && BigDecimal.valueOf(10000).compareTo(amount) == 0) {
                lateFineItem = item;
            }
            return null;
        }

        boolean wasLateFineCreatedFor(LoanItem item) {
            return lateFineItem == item;
        }
    }
}
