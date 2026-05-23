package com.library.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.library.entity.LoanItem;
import com.library.entity.LoanItemStatus;
import com.library.entity.LoanStatus;

@Repository
public interface LoanItemRepository extends JpaRepository<LoanItem, Integer> {
    boolean existsByBookCopy_Id(Integer copyId);

    Optional<LoanItem> findFirstByBookCopy_IdAndStatusInOrderByIdDesc(
            Integer copyId,
            Collection<LoanItemStatus> statuses);

    @Query("""
            select case when count(item) > 0 then true else false end
            from LoanItem item
            where item.loan.borrower.id = :userId
              and item.loan.status = :loanStatus
              and item.bookCopy.book.id = :bookId
              and item.status in :itemStatuses
            """)
    boolean existsReviewableLoanItem(
            @Param("userId") Integer userId,
            @Param("loanStatus") LoanStatus loanStatus,
            @Param("bookId") Integer bookId,
            @Param("itemStatuses") Collection<LoanItemStatus> itemStatuses);
}
