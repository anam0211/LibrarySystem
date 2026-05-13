package com.library.controller;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Book;
import com.library.entity.BookImage;
import com.library.entity.CartItem;
import com.library.repository.BookImageRepository;
import com.library.service.CartService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final BookImageRepository bookImageRepository;

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> getCart(@PathVariable Integer userId) {
        List<CartItem> items = cartService.getItems(userId);
        Map<Integer, String> primaryImageUrls = resolvePrimaryImageUrls(items.stream()
                .map(CartItem::getBook)
                .filter(Objects::nonNull)
                .map(Book::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        return ApiResponse.success(items.stream().map(item -> toResponse(item, primaryImageUrls)).toList());
    }

    @PostMapping("/users/{userId}/books/{bookId}")
    public ApiResponse<Map<String, Object>> addBook(@PathVariable Integer userId, @PathVariable Integer bookId) {
        CartItem item = cartService.addBook(userId, bookId);
        return ApiResponse.success(toResponse(item, resolvePrimaryImageUrls(List.of(bookId))));
    }

    @DeleteMapping("/users/{userId}/books/{bookId}")
    public ApiResponse<Void> removeBook(@PathVariable Integer userId, @PathVariable Integer bookId) {
        cartService.removeBook(userId, bookId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/users/{userId}")
    public ApiResponse<Void> clear(@PathVariable Integer userId) {
        cartService.clear(userId);
        return ApiResponse.success(null);
    }

    private Map<String, Object> toResponse(CartItem item, Map<Integer, String> primaryImageUrls) {
        Book book = item.getBook();
        Integer bookId = book != null ? book.getId() : null;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", item.getId());
        result.put("bookId", bookId);
        result.put("title", book != null ? book.getTitle() : null);
        result.put("stockAvailable", book != null ? book.getStockAvailable() : null);
        result.put("primaryImageUrl", bookId != null ? primaryImageUrls.get(bookId) : null);
        result.put("media", bookId != null && primaryImageUrls.get(bookId) != null
                ? List.of(Map.of(
                        "bookId", bookId,
                        "fileUrl", primaryImageUrls.get(bookId),
                        "assetType", resolveAssetType(primaryImageUrls.get(bookId)),
                        "primary", true))
                : List.of());
        result.put("addedAt", item.getAddedAt());
        return result;
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
