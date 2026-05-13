package com.library.controller;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Book;
import com.library.entity.BookImage;
import com.library.entity.Wishlist;
import com.library.repository.BookLoanReferenceRepository;
import com.library.repository.BookImageRepository;
import com.library.repository.WishlistRepository;
import com.library.service.WishlistService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final BookImageRepository bookImageRepository;
    private final BookLoanReferenceRepository bookLoanReferenceRepository;
    private final WishlistRepository wishlistRepository;

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> list(@PathVariable Integer userId) {
        List<Wishlist> wishlists = wishlistService.listByUser(userId);
        Map<Integer, String> primaryImageUrls = resolvePrimaryImageUrls(wishlists.stream()
                .map(Wishlist::getBook)
                .filter(Objects::nonNull)
                .map(Book::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        return ApiResponse.success(wishlists.stream()
                .map(wishlist -> toResponse(wishlist, primaryImageUrls))
                .toList());
    }

    @PostMapping("/users/{userId}/books/{bookId}/toggle")
    public ApiResponse<Map<String, Object>> toggle(@PathVariable Integer userId, @PathVariable Integer bookId) {
        boolean active = wishlistService.toggle(userId, bookId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", userId);
        result.put("bookId", bookId);
        result.put("active", active);
        return ApiResponse.success(result);
    }

    private Map<String, Object> toResponse(Wishlist wishlist, Map<Integer, String> primaryImageUrls) {
        Book book = wishlist.getBook();
        Integer bookId = book != null ? book.getId() : null;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", wishlist.getUser() != null ? wishlist.getUser().getId() : null);
        result.put("bookId", bookId);
        result.put("title", book != null ? book.getTitle() : null);
        result.put("description", book != null ? book.getDescription() : null);
        result.put("publisherName", book != null && book.getPublisher() != null ? book.getPublisher().getName() : null);
        result.put("publishYear", book != null ? book.getPublishYear() : null);
        result.put("stockAvailable", book != null ? book.getStockAvailable() : null);
        result.put("averageRating", book != null ? book.getAverageRating() : null);
        result.put("reviewCount", book != null ? book.getReviewCount() : null);
        result.put("borrowCount", bookId != null ? resolveBorrowCount(bookId) : 0);
        result.put("favoriteCount", bookId != null ? resolveFavoriteCount(bookId) : 0);
        result.put("primaryImageUrl", bookId != null ? primaryImageUrls.get(bookId) : null);
        result.put("media", bookId != null && primaryImageUrls.get(bookId) != null
                ? List.of(Map.of(
                        "bookId", bookId,
                        "fileUrl", primaryImageUrls.get(bookId),
                        "assetType", resolveAssetType(primaryImageUrls.get(bookId)),
                        "primary", true))
                : List.of());
        result.put("createdAt", wishlist.getCreatedAt());
        return result;
    }

    private Integer resolveBorrowCount(Integer bookId) {
        long count = bookLoanReferenceRepository.countBorrowedCopiesByBookId(bookId);
        return count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
    }

    private Integer resolveFavoriteCount(Integer bookId) {
        long count = wishlistRepository.countByBook_Id(bookId);
        return count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
    }

    private Map<Integer, String> resolvePrimaryImageUrls(List<Integer> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, BookImage> selectedImages = new HashMap<>();
        for (BookImage image : bookImageRepository.findByBook_IdInOrderByCreatedAtDesc(bookIds)) {
            if (image.getBook() == null || image.getBook().getId() == null) {
                continue;
            }

            Integer bookId = image.getBook().getId();
            if (Boolean.TRUE.equals(image.getPrimary()) || !selectedImages.containsKey(bookId)) {
                selectedImages.put(bookId, image);
            }
        }

        Map<Integer, String> result = new HashMap<>();
        selectedImages.forEach((bookId, image) -> result.put(bookId, image.getFileUrl()));
        return result;
    }

    private String resolveAssetType(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank() || !fileUrl.contains(".")) {
            return "FILE";
        }

        return fileUrl.substring(fileUrl.lastIndexOf('.') + 1).toUpperCase();
    }
}
