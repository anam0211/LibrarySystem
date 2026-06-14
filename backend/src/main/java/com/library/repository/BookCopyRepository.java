package com.library.repository;

import com.library.entity.BookCopy;
import com.library.entity.BookCopyCondition;
import com.library.entity.BookCopyStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Integer> {
    long countByBook_Id(Integer bookId);

    long countByBook_IdAndStatusAndCondition(
            Integer bookId,
            BookCopyStatus status,
            BookCopyCondition condition);

    boolean existsByBarcode(String barcode);

    List<BookCopy> findByBook_IdOrderByCreatedAtDesc(Integer bookId);

    List<BookCopy> findByBook_IdAndStatusOrderByCreatedAtAsc(Integer bookId, BookCopyStatus status);

    /**
     * Lấy bản sao AVAILABLE đầu tiên theo thứ tự nhập kho với pessimistic write lock.
     * Đảm bảo chỉ một transaction có thể đặt chỗ bản sao này cùng lúc.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c
            FROM BookCopy c
            WHERE c.book.id = :bookId
              AND c.status = :status
              AND c.condition = :condition
            ORDER BY c.createdAt ASC
            """)
    List<BookCopy> findAvailableForUpdate(
            @Param("bookId") Integer bookId,
            @Param("status") BookCopyStatus status,
            @Param("condition") BookCopyCondition condition);
}
