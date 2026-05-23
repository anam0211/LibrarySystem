package com.library.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.common.exception.BadRequestException;
import com.library.entity.Fine;
import com.library.entity.FineReason;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.repository.FineRepository;
import com.library.repository.LoanRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FineServiceTest {

    @Mock
    private FineRepository fineRepository;

    @Mock
    private LoanRepository loanRepository;

    @Test
    void createRejectsUserThatDoesNotOwnLoan() {
        FineService fineService = new FineService(fineRepository, loanRepository, null);
        User borrower = new User();
        borrower.setId(3);
        Loan loan = new Loan();
        loan.setBorrower(borrower);

        when(loanRepository.findById(9)).thenReturn(Optional.of(loan));

        assertThrows(
                BadRequestException.class,
                () -> fineService.create(4, 9, BigDecimal.valueOf(10000), FineReason.LATE_RETURN));
        verify(fineRepository, never()).save(org.mockito.ArgumentMatchers.any(Fine.class));
    }
}
