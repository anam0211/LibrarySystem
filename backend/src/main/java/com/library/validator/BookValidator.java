package com.library.validator;

import com.library.common.exception.AppException;
import com.library.entity.BookStatus;
import com.library.entity.Publisher;
import com.library.exception.BookErrorCode;
import com.library.repository.BookRepository;
import com.library.repository.PublisherRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookValidator {
    private final BookRepository bookRepository;
    private final PublisherRepository publisherRepository;

    public String requireTitle(String title) {
        String text = trimToNull(title);
        if (text == null) {
            throw new AppException(BookErrorCode.BOOK_TITLE_REQUIRED);
        }

        return text;
    }

    public Publisher requirePublisher(Integer publisherId) {
        if (publisherId == null) {
            throw new AppException(BookErrorCode.BOOK_PUBLISHER_REQUIRED);
        }

        return publisherRepository.findById(publisherId)
                .orElseThrow(() -> new AppException(BookErrorCode.BOOK_PUBLISHER_NOT_FOUND));
    }

    public void requireAuthor(List<Integer> authorIds) {
        if (!hasAnyId(authorIds)) {
            throw new AppException(BookErrorCode.BOOK_AUTHOR_REQUIRED);
        }
    }

    public void requireCategory(List<Integer> categoryIds) {
        if (!hasAnyId(categoryIds)) {
            throw new AppException(BookErrorCode.BOOK_CATEGORY_REQUIRED);
        }
    }

    public void requireValidStock(int stockTotal, int stockAvailable) {
        if (stockTotal < 0 || stockAvailable < 0 || stockAvailable > stockTotal) {
            throw new AppException(BookErrorCode.BOOK_STOCK_INVALID);
        }
    }

    public void requireUniqueIsbn(String isbn, Integer currentBookId) {
        if (isbn == null) {
            return;
        }

        boolean exists;
        if (currentBookId == null) {
            exists = bookRepository.existsByIsbn(isbn);
        } else {
            exists = bookRepository.existsByIsbnAndIdNot(isbn, currentBookId);
        }

        if (exists) {
            throw new AppException(BookErrorCode.BOOK_ISBN_DUPLICATED);
        }
    }

    public BookStatus toBookStatus(String status) {
        if (status == null || status.isBlank()) {
            return BookStatus.ACTIVE;
        }

        try {
            return BookStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new AppException(BookErrorCode.BOOK_STATUS_INVALID);
        }
    }

    public String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String text = value.trim();
        return text.isEmpty() ? null : text;
    }

    public int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private boolean hasAnyId(List<Integer> ids) {
        if (ids == null) {
            return false;
        }

        for (Integer id : ids) {
            if (id != null) {
                return true;
            }
        }

        return false;
    }
}
