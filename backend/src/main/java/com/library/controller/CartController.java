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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Book;
import com.library.entity.BookImage;
import com.library.entity.CartItem;
import com.library.repository.BookImageRepository;
import com.library.service.CartService;
import com.library.service.CurrentUserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final CurrentUserService currentUserService;
    private final BookImageRepository bookImageRepository;

    @GetMapping("/me")
    public ApiResponse<List<Map<String, Object>>> getMyCart() {
        return getCartResponse(currentUserService.getCurrentUserId());
    }

    @PostMapping("/me/books/{bookId}")
    public ApiResponse<Map<String, Object>> addMyBook(@PathVariable Integer bookId) {
        Integer userId = currentUserService.getCurrentUserId();
        CartItem item = cartService.addBook(userId, bookId);
        return ApiResponse.success(toResponse(item, resolvePrimaryImageUrls(List.of(bookId))));
    }

    @DeleteMapping("/me/books/{bookId}")
    public ApiResponse<Void> removeMyBook(@PathVariable Integer bookId) {
        cartService.removeBook(currentUserService.getCurrentUserId(), bookId);
        return ApiResponse.success(null);
    }

    @PutMapping("/me/books/{bookId}/quantity")
    public ApiResponse<Map<String, Object>> updateMyQuantity(
            @PathVariable Integer bookId,
            @RequestBody QuantityRequest request) {
        CartItem item = cartService.updateQuantity(currentUserService.getCurrentUserId(), bookId, request.getQuantity());
        return ApiResponse.success(toResponse(item, resolvePrimaryImageUrls(List.of(bookId))));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> clearMyCart() {
        cartService.clear(currentUserService.getCurrentUserId());
        return ApiResponse.success(null);
    }

    private ApiResponse<List<Map<String, Object>>> getCartResponse(Integer userId) {
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

    private Map<String, Object> toResponse(CartItem item, Map<Integer, String> primaryImageUrls) {
        Book book = item.getBook();
        Integer bookId = book != null ? book.getId() : null;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", item.getId());
        result.put("bookId", bookId);
        result.put("title", book != null ? book.getTitle() : null);
        result.put("stockAvailable", book != null ? book.getStockAvailable() : null);
        result.put("quantity", item.getQuantity() == null ? 1 : item.getQuantity());
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

    public static class QuantityRequest {
        private Integer quantity;

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
