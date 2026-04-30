package com.library.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Loan;
import com.library.entity.LoanStatus;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Integer> {
    List<Loan> findByBorrowerIdOrderByCreatedAtDesc(Integer borrowerId);
    List<Loan> findByProcessedByIsNullOrderByCreatedAtDesc();
    List<Loan> findByStatusInOrderByCreatedAtDesc(Collection<LoanStatus> statuses);
}
