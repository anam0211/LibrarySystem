package com.library.repository;

import java.util.Collection;
import java.util.List;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.entity.DeliveryMethod;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Integer> {
    List<Loan> findByBorrowerIdOrderByCreatedAtDesc(Integer borrowerId);
    List<Loan> findByStatusInOrderByCreatedAtDesc(Collection<LoanStatus> statuses);
    List<Loan> findByStatusAndDueAtGreaterThanEqualAndDueAtLessThan(LoanStatus status, LocalDateTime from, LocalDateTime to);
    List<Loan> findByStatusAndCreatedAtBefore(LoanStatus status, LocalDateTime createdBefore);
    List<Loan> findByStatusAndDueAtBefore(LoanStatus status, LocalDateTime dueBefore);
    long countByStatus(LoanStatus status);
    long countByDeliveryMethod(DeliveryMethod deliveryMethod);
}
