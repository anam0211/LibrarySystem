package com.library.mapper;

import com.library.dto.response.BookAuthorItemDTO;
import com.library.dto.response.BookCategoryItemDTO;
import com.library.dto.response.BookResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookAuthor;
import com.library.entity.BookCategory;
import com.library.entity.BookImage;
import com.library.repository.BookLoanReferenceRepository;
import com.library.repository.WishlistRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookResponseMapper {
    private final BookLoanReferenceRepository bookLoanReferenceRepository;
    private final WishlistRepository wishlistRepository;

    public BookResponseDTO toResponse(
            Book book,
            List<BookAuthor> authors,
            List<BookCategory> categories,
            BookImage primaryImage) {
        return BookResponseDTO.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .subtitle(book.getSubtitle())
                .publisherId(book.getPublisher() != null ? book.getPublisher().getId() : null)
                .publisherName(book.getPublisher() != null ? book.getPublisher().getName() : null)
                .publishYear(book.getPublishYear())
                .languageCode(book.getLanguageCode())
                .pageCount(book.getPageCount())
                .description(book.getDescription())
                .keywords(book.getKeywords())
                .stockTotal(book.getStockTotal())
                .stockAvailable(book.getStockAvailable())
                .originalPrice(book.getOriginalPrice())
                .averageRating(book.getAverageRating())
                .reviewCount(book.getReviewCount())
                .borrowCount(resolveBorrowCount(book.getId()))
                .favoriteCount(resolveFavoriteCount(book.getId()))
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .available(Optional.ofNullable(book.getStockAvailable()).orElse(0) > 0)
                .primaryImageUrl(primaryImage != null ? primaryImage.getFileUrl() : null)
                .authors((authors == null ? List.<BookAuthor>of() : authors).stream()
                        .map(item -> BookAuthorItemDTO.builder()
                                .id(item.getAuthor().getId())
                                .name(item.getAuthor().getName())
                                .build())
                        .toList())
                .categories((categories == null ? List.<BookCategory>of() : categories).stream()
                        .map(item -> BookCategoryItemDTO.builder()
                                .id(item.getCategory().getId())
                                .name(item.getCategory().getName())
                                .build())
                        .toList())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }

    private Integer resolveBorrowCount(Integer bookId) {
        if (bookId == null) {
            return 0;
        }

        long count = bookLoanReferenceRepository.countBorrowedCopiesByBookId(bookId);
        return count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
    }

    private Integer resolveFavoriteCount(Integer bookId) {
        if (bookId == null) {
            return 0;
        }

        long count = wishlistRepository.countByBook_Id(bookId);
        return count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
    }
}
