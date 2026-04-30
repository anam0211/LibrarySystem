package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Book;
import com.library.entity.Wishlist;
import com.library.service.WishlistService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> list(@PathVariable Integer userId) {
        return ApiResponse.success(wishlistService.listByUser(userId).stream().map(this::toResponse).toList());
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

    private Map<String, Object> toResponse(Wishlist wishlist) {
        Book book = wishlist.getBook();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", wishlist.getUser() != null ? wishlist.getUser().getId() : null);
        result.put("bookId", book != null ? book.getId() : null);
        result.put("title", book != null ? book.getTitle() : null);
        result.put("createdAt", wishlist.getCreatedAt());
        return result;
    }
}
