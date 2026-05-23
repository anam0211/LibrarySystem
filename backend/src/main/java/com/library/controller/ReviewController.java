package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.request.ReviewRequest;
import com.library.entity.Review;
import com.library.service.CurrentUserService;
import com.library.service.ReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/books/{bookId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@PathVariable Integer bookId) {
        return ApiResponse.success(reviewService.listByBook(bookId).stream().map(this::toResponse).toList());
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> mine(@PathVariable Integer bookId) {
        Review review = reviewService.getMine(currentUserService.getCurrentUserId(), bookId);
        return ApiResponse.success(review == null ? Map.of() : toResponse(review));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(
            @PathVariable Integer bookId,
            @RequestBody ReviewRequest request
    ) {
        Review review = reviewService.create(currentUserService.getCurrentUserId(), bookId, request.getRating(), request.getComment());
        return ApiResponse.success(toResponse(review));
    }

    @PutMapping("/me")
    public ApiResponse<Map<String, Object>> updateMine(
            @PathVariable Integer bookId,
            @RequestBody ReviewRequest request
    ) {
        Review review = reviewService.updateMine(
                currentUserService.getCurrentUserId(),
                bookId,
                request.getRating(),
                request.getComment());
        return ApiResponse.success(toResponse(review));
    }

    private Map<String, Object> toResponse(Review review) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", review.getId());
        result.put("userId", review.getUser() != null ? review.getUser().getId() : null);
        result.put("userName", review.getUser() != null ? review.getUser().getFullName() : null);
        result.put("bookId", review.getBook() != null ? review.getBook().getId() : null);
        result.put("rating", review.getRating());
        result.put("comment", review.getComment());
        result.put("content", review.getComment());
        result.put("hidden", Boolean.TRUE.equals(review.getHidden()));
        result.put("createdAt", review.getCreatedAt());
        return result;
    }
}
