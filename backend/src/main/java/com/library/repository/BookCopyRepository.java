package com.library.repository;

import com.library.entity.BookCopy;
import com.library.entity.BookCopyStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Integer> {
    long countByBook_Id(Integer bookId);

    long countByBook_IdAndStatus(Integer bookId, BookCopyStatus status);

    boolean existsByBarcode(String barcode);

    List<BookCopy> findByBook_IdOrderByCreatedAtDesc(Integer bookId);

    List<BookCopy> findByBook_IdAndStatusOrderByCreatedAtAsc(Integer bookId, BookCopyStatus status);
}
