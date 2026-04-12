package com.library.module.book.repository;

import com.library.module.book.entity.BookAuthor;
import com.library.module.book.entity.BookAuthorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookAuthorRepository extends JpaRepository<BookAuthor, BookAuthorId> {
    List<BookAuthor> findByBook_IdOrderByAuthorOrderAsc(Integer bookId);

    List<BookAuthor> findByBook_IdInOrderByAuthorOrderAsc(List<Integer> bookIds);

    long countByAuthor_Id(Integer authorId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from BookAuthor ba where ba.book.id = :bookId")
    void deleteByBookId(@Param("bookId") Integer bookId);

    @Query("""
            select ba.author.id as authorId, count(ba) as bookCount
            from BookAuthor ba
            group by ba.author.id
            order by count(ba) desc
            """)
    List<Object[]> countBooksByAuthor();
}
