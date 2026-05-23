package com.library.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.entity.Book;
import com.library.entity.LoanItemStatus;
import com.library.entity.LoanStatus;
import com.library.entity.Review;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.LoanItemRepository;
import com.library.repository.ReviewRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private static final Set<LoanItemStatus> REVIEWABLE_ITEM_STATUSES = EnumSet.of(
            LoanItemStatus.RETURNED,
            LoanItemStatus.DAMAGED,
            LoanItemStatus.LOST);

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final LoanItemRepository loanItemRepository;

    @Transactional(readOnly = true)
    public List<Review> listAll() {
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Review> listByBook(Integer bookId) {
        return reviewRepository.findByBook_IdOrderByCreatedAtDesc(bookId);
    }

    @Transactional(readOnly = true)
    public Review getMine(Integer userId, Integer bookId) {
        return reviewRepository.findByUser_IdAndBook_Id(userId, bookId).orElse(null);
    }

    @Transactional
    public Review create(Integer userId, Integer bookId, Integer rating, String comment) {
        validateRating(rating);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách."));

        validateReviewableLoan(userId, bookId);
        if (reviewRepository.existsByUser_IdAndBook_Id(userId, bookId)) {
            throw new BadRequestException("Bạn đã đánh giá sách này. Bạn có thể chỉnh sửa đánh giá đã có.");
        }

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
    public Review updateMine(Integer userId, Integer bookId, Integer rating, String comment) {
        validateRating(rating);
        validateReviewableLoan(userId, bookId);

        Review review = reviewRepository.findByUser_IdAndBook_Id(userId, bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá của bạn."));
        review.setRating(rating);
        review.setComment(comment);

        Review savedReview = reviewRepository.save(review);
        refreshBookRating(review.getBook());
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

    private void validateRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Điểm đánh giá phải từ 1 đến 5.");
        }
    }

    private void validateReviewableLoan(Integer userId, Integer bookId) {
        if (!loanItemRepository.existsReviewableLoanItem(userId, LoanStatus.CLOSED, bookId, REVIEWABLE_ITEM_STATUSES)) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá sách trong đơn mượn đã hoàn tất.");
        }
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
