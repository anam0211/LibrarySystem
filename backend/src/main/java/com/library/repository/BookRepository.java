package com.library.repository;

import com.library.entity.Book;
import com.library.entity.BookStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

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

    /**
     * Lấy Book với pessimistic write lock để bảo vệ stock_available
     * khỏi race condition khi nhiều request checkout cùng lúc.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Book b WHERE b.id = :id")
    Optional<Book> findWithLockById(@Param("id") Integer id);
}
