package com.library.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;

import com.library.entity.Fine;
import com.library.entity.FineReason;

@Repository
public interface FineRepository extends JpaRepository<Fine, Integer> {
    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findByLoan_IdOrderByCreatedAtDesc(Integer loanId);

    @Query("select coalesce(sum(f.amount), 0) from Fine f where f.status = com.library.entity.FineStatus.UNPAID")
    BigDecimal sumUnpaidAmount();

    boolean existsByLoanItem_IdAndReason(Integer loanItemId, FineReason reason);
}
