package com.library.module.book.repository;

import com.library.module.book.entity.Book;
import com.library.module.book.entity.BookStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer>, JpaSpecificationExecutor<Book> {
    long countByPublisher_Id(Integer publisherId);

    long countByStockAvailableGreaterThan(Integer stockAvailable);

    long countByStockAvailableLessThanEqual(Integer stockAvailable);

    List<Book> findTop8ByStatusOrderByCreatedAtDesc(BookStatus status);

    Page<Book> findByStatusOrderByCreatedAtDesc(BookStatus status, Pageable pageable);

    @Query("""
            select distinct b.title
            from Book b
            where lower(b.title) like lower(concat('%', :keyword, '%'))
            order by b.title asc
            """)
    List<String> suggestTitles(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = """
            select cast(ft.[KEY] as int)
            from containstable(books, (title, subtitle, description, keywords, isbn), :ftsQuery) ft
            order by ft.[RANK] desc
            """, nativeQuery = true)
    List<Integer> searchBookIdsByFullText(@Param("ftsQuery") String ftsQuery);
}
