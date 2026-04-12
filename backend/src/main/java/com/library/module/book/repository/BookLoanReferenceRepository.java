package com.library.module.book.repository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookLoanReferenceRepository {
    JdbcTemplate jdbcTemplate;

    public long countLoanItemsByBookId(Integer bookId) {
        Long count = jdbcTemplate.queryForObject(
                "select count(*) from loan_items where book_id = ?",
                Long.class,
                bookId
        );

        return count == null ? 0 : count;
    }
}
