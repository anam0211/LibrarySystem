package com.library.module.circulation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.module.circulation.entity.LoanItem;

@Repository
public interface LoanItemRepository extends JpaRepository<LoanItem, Integer> {
}