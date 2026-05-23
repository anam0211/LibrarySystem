package com.library.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.common.exception.BadRequestException;
import com.library.entity.Book;
import com.library.entity.LoanItemStatus;
import com.library.entity.LoanStatus;
import com.library.entity.Review;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.LoanItemRepository;
import com.library.repository.ReviewRepository;
import com.library.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoanItemRepository loanItemRepository;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void createRejectsReviewWithoutCompletedLoanContainingBook() {
        User user = new User();
        user.setId(5);
        Book book = new Book();
        book.setId(20);

        when(userRepository.findById(5)).thenReturn(Optional.of(user));
        when(bookRepository.findById(20)).thenReturn(Optional.of(book));
        when(loanItemRepository.existsReviewableLoanItem(
                org.mockito.ArgumentMatchers.eq(5),
                org.mockito.ArgumentMatchers.eq(LoanStatus.CLOSED),
                org.mockito.ArgumentMatchers.eq(20),
                org.mockito.ArgumentMatchers.<Set<LoanItemStatus>>any()))
                .thenReturn(false);

        assertThrows(BadRequestException.class, () -> reviewService.create(5, 20, 5, "Good"));
        verify(reviewRepository, never()).save(org.mockito.ArgumentMatchers.any(Review.class));
    }

    @Test
    void updateMineChangesExistingReviewForCompletedLoan() {
        Book book = new Book();
        book.setId(20);
        Review review = new Review();
        review.setBook(book);
        review.setRating(2);
        review.setComment("Old");

        when(loanItemRepository.existsReviewableLoanItem(
                org.mockito.ArgumentMatchers.eq(5),
                org.mockito.ArgumentMatchers.eq(LoanStatus.CLOSED),
                org.mockito.ArgumentMatchers.eq(20),
                org.mockito.ArgumentMatchers.<Set<LoanItemStatus>>any()))
                .thenReturn(true);
        when(reviewRepository.findByUser_IdAndBook_Id(5, 20)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewRepository.findByBook_IdOrderByCreatedAtDesc(20)).thenReturn(List.of(review));

        Review savedReview = reviewService.updateMine(5, 20, 4, "Updated");

        assertEquals(4, savedReview.getRating());
        assertEquals("Updated", savedReview.getComment());
        assertEquals(4F, book.getAverageRating());
        assertEquals(1, book.getReviewCount());
        verify(bookRepository).save(book);
    }
}
