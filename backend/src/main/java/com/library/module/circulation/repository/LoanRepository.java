package com.library.module.circulation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.module.circulation.entity.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Integer> {
    List<Loan> findByBorrowerIdOrderByCreatedAtDesc(Integer borrowerId);
    List<Loan> findByProcessedByIsNullOrderByCreatedAtDesc();
}