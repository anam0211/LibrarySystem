package com.library.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Fine;
import com.library.entity.FineStatus;

@Repository
public interface FineRepository extends JpaRepository<Fine, Integer> {
    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findByStatusOrderByCreatedAtDesc(FineStatus status);

    @EntityGraph(attributePaths = {"user", "loan"})
    List<Fine> findByLoan_IdOrderByCreatedAtDesc(Integer loanId);
}
