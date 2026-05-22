package com.library.repository;

import com.library.entity.Book;
import com.library.entity.BookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer>, JpaSpecificationExecutor<Book> {
    boolean existsByIsbn(String isbn);

    boolean existsByIsbnAndIdNot(String isbn, Integer id);

    long countByPublisher_Id(Integer publisherId);

    long countByStockAvailableGreaterThan(Integer stockAvailable);

    long countByStockAvailableLessThanEqual(Integer stockAvailable);

    List<Book> findTop8ByStatusOrderByCreatedAtDesc(BookStatus status);

    @Query(value = """
            select cast(ft.[KEY] as int)
            from containstable(books, (title, subtitle, description, keywords, isbn), :ftsQuery) ft
            order by ft.[RANK] desc
            """, nativeQuery = true)
    List<Integer> searchBookIdsByFullText(@Param("ftsQuery") String ftsQuery);
}
