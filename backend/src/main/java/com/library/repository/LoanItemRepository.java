package com.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.LoanItem;

@Repository
public interface LoanItemRepository extends JpaRepository<LoanItem, Integer> {
    boolean existsByBookCopy_Id(Integer copyId);
}
