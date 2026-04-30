package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.entity.Review;
import com.library.service.ReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> listAll() {
        return ApiResponse.success(reviewService.listAll().stream().map(this::toResponse).toList());
    }

    @PutMapping("/{reviewId}/hidden")
    public ApiResponse<Map<String, Object>> setHidden(
            @PathVariable Integer reviewId,
            @RequestBody Map<String, Boolean> body
    ) {
        return ApiResponse.success(toResponse(reviewService.setHidden(reviewId, body.get("hidden"))));
    }

    private Map<String, Object> toResponse(Review review) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", review.getId());
        result.put("bookId", review.getBook() != null ? review.getBook().getId() : null);
        result.put("bookTitle", review.getBook() != null ? review.getBook().getTitle() : null);
        result.put("userId", review.getUser() != null ? review.getUser().getId() : null);
        result.put("userName", review.getUser() != null ? review.getUser().getFullName() : null);
        result.put("rating", review.getRating());
        result.put("content", review.getComment());
        result.put("comment", review.getComment());
        result.put("hidden", Boolean.TRUE.equals(review.getHidden()));
        result.put("createdAt", review.getCreatedAt());
        return result;
    }
}
