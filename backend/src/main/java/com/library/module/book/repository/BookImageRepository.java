package com.library.module.book.repository;

import com.library.module.book.entity.BookImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookImageRepository extends JpaRepository<BookImage, Integer> {
    List<BookImage> findByBook_IdOrderByCreatedAtDesc(Integer bookId);

    List<BookImage> findByBook_IdInOrderByCreatedAtDesc(List<Integer> bookIds);

    Optional<BookImage> findFirstByBook_IdAndPrimaryTrue(Integer bookId);
}
