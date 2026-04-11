package com.library.module.book.repository;

import com.library.module.book.entity.BookCategory;
import com.library.module.book.entity.BookCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookCategoryRepository extends JpaRepository<BookCategory, BookCategoryId> {
    List<BookCategory> findByBook_Id(Integer bookId);

    List<BookCategory> findByBook_IdIn(List<Integer> bookIds);

    long countByCategory_Id(Integer categoryId);

    @Modifying
    @Query("delete from BookCategory bc where bc.book.id = :bookId")
    void deleteByBookId(@Param("bookId") Integer bookId);

    @Query("""
            select bc.category.id as categoryId, count(bc) as bookCount
            from BookCategory bc
            group by bc.category.id
            order by count(bc) desc
            """)
    List<Object[]> countBooksByCategory();
}
