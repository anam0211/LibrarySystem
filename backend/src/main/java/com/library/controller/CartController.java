package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Book;
import com.library.entity.CartItem;
import com.library.service.CartService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> getCart(@PathVariable Integer userId) {
        return ApiResponse.success(cartService.getItems(userId).stream().map(this::toResponse).toList());
    }

    @PostMapping("/users/{userId}/books/{bookId}")
    public ApiResponse<Map<String, Object>> addBook(@PathVariable Integer userId, @PathVariable Integer bookId) {
        return ApiResponse.success(toResponse(cartService.addBook(userId, bookId)));
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

    private Map<String, Object> toResponse(CartItem item) {
        Book book = item.getBook();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", item.getId());
        result.put("bookId", book != null ? book.getId() : null);
        result.put("title", book != null ? book.getTitle() : null);
        result.put("stockAvailable", book != null ? book.getStockAvailable() : null);
        result.put("addedAt", item.getAddedAt());
        return result;
    }
}
