package com.library.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.entity.Book;
import com.library.entity.Review;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.ReviewRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Review> listAll() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Review> listByBook(Integer bookId) {
        return reviewRepository.findByBook_IdOrderByCreatedAtDesc(bookId);
    }

    @Transactional
    public Review create(Integer userId, Integer bookId, Integer rating, String comment) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Điểm đánh giá phải từ 1 đến 5.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách."));

        Review review = new Review();
        review.setUser(user);
        review.setBook(book);
        review.setRating(rating);
        review.setComment(comment);
        Review savedReview = reviewRepository.save(review);
        refreshBookRating(book);
        return savedReview;
    }

    @Transactional
    public Review setHidden(Integer reviewId, Boolean hidden) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        review.setHidden(Boolean.TRUE.equals(hidden));
        Review savedReview = reviewRepository.save(review);
        refreshBookRating(review.getBook());
        return savedReview;
    }

    private void refreshBookRating(Book book) {
        List<Review> reviews = reviewRepository.findByBook_IdOrderByCreatedAtDesc(book.getId());
        reviews = reviews.stream().filter(review -> !Boolean.TRUE.equals(review.getHidden())).toList();
        int reviewCount = reviews.size();
        float average = reviewCount == 0
                ? 0F
                : (float) reviews.stream().mapToInt(Review::getRating).average().orElse(0);

        book.setReviewCount(reviewCount);
        book.setAverageRating(Math.round(average * 10F) / 10F);
        bookRepository.save(book);
    }
}
