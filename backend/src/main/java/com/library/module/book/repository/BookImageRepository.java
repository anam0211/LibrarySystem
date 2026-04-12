package com.library.module.book.repository;

import com.library.module.book.entity.BookImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookImageRepository extends JpaRepository<BookImage, Integer> {
    List<BookImage> findByBook_IdOrderByCreatedAtDesc(Integer bookId);

    List<BookImage> findByBook_IdInOrderByCreatedAtDesc(List<Integer> bookIds);

    Optional<BookImage> findFirstByBook_IdAndPrimaryTrue(Integer bookId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from BookImage bi where bi.book.id = :bookId")
    void deleteByBookId(@Param("bookId") Integer bookId);
}
