package com.library.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.common.exception.BadRequestException;
import com.library.dto.request.BookCopyRequestDTO;
import com.library.dto.response.BookCopyResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.BookCopyCondition;
import com.library.entity.BookCopyStatus;
import com.library.entity.LoanItem;
import com.library.entity.LoanItemStatus;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.LoanItemRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookCopyServiceTest {

    @Mock
    private BookCopyRepository bookCopyRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private LoanItemRepository loanItemRepository;

    @InjectMocks
    private BookCopyService bookCopyService;

    @Test
    void syncBookStockUsesBookCopyCountsWhenCopiesExist() {
        Book book = new Book();
        book.setId(10);
        book.setStockTotal(0);
        book.setStockAvailable(0);

        when(bookCopyRepository.countByBook_Id(10)).thenReturn(5L);
        when(bookCopyRepository.countByBook_IdAndStatusAndCondition(
                10,
                BookCopyStatus.AVAILABLE,
                BookCopyCondition.GOOD))
                .thenReturn(3L);

        bookCopyService.syncBookStock(book);

        assertEquals(5, book.getStockTotal());
        assertEquals(3, book.getStockAvailable());
        verify(bookRepository).save(book);
    }

    @Test
    void syncBookStockKeepsManualStockWhenBookHasNoCopies() {
        Book book = new Book();
        book.setId(11);
        book.setStockTotal(7);
        book.setStockAvailable(4);

        when(bookCopyRepository.countByBook_Id(11)).thenReturn(0L);

        bookCopyService.syncBookStock(book);

        assertEquals(7, book.getStockTotal());
        assertEquals(4, book.getStockAvailable());
        verify(bookRepository, never()).save(book);
    }

    @Test
    void updateCopyRejectsAvailableStatusWhileCopyIsBorrowed() {
        BookCopy copy = new BookCopy();
        copy.setId(12);
        copy.setStatus(BookCopyStatus.BORROWED);
        copy.setCondition(BookCopyCondition.GOOD);

        LoanItem loanItem = new LoanItem();
        loanItem.setStatus(LoanItemStatus.BORROWED);

        BookCopyRequestDTO request = new BookCopyRequestDTO();
        request.setStatus(BookCopyStatus.AVAILABLE);

        when(bookCopyRepository.findById(12)).thenReturn(Optional.of(copy));
        when(loanItemRepository.findFirstByBookCopy_IdAndStatusInOrderByIdDesc(
                org.mockito.ArgumentMatchers.eq(12),
                org.mockito.ArgumentMatchers.anyCollection()))
                .thenReturn(Optional.of(loanItem));

        assertThrows(BadRequestException.class, () -> bookCopyService.updateCopy(12, request));
        verify(bookCopyRepository, never()).save(copy);
    }

    @Test
    void markReturnedDamagedSetsStatusDamagedAndStoresCondition() {
        Book book = new Book();
        book.setId(13);

        BookCopy copy = new BookCopy();
        copy.setId(14);
        copy.setBook(book);
        copy.setStatus(BookCopyStatus.BORROWED);
        copy.setCondition(BookCopyCondition.GOOD);

        when(bookCopyRepository.countByBook_Id(13)).thenReturn(1L);

        bookCopyService.markReturned(copy, BookCopyCondition.DAMAGED);

        assertEquals(BookCopyStatus.DAMAGED, copy.getStatus());
        assertEquals(BookCopyCondition.DAMAGED, copy.getCondition());
        verify(bookCopyRepository).save(copy);
        verify(bookCopyRepository).countByBook_IdAndStatusAndCondition(
                13,
                BookCopyStatus.AVAILABLE,
                BookCopyCondition.GOOD);
    }

    @Test
    void createCopyKeepsDamagedStatusAndStoresMatchingCondition() {
        Book book = new Book();
        book.setId(15);

        BookCopyRequestDTO request = new BookCopyRequestDTO();
        request.setBarcode("BC-015");
        request.setStatus(BookCopyStatus.DAMAGED);
        request.setCondition(BookCopyCondition.GOOD);

        when(bookRepository.findById(15)).thenReturn(Optional.of(book));
        when(bookCopyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookCopyResponseDTO response = bookCopyService.createCopy(15, request);

        assertEquals(BookCopyStatus.DAMAGED, response.getStatus());
        assertEquals(BookCopyCondition.DAMAGED, response.getCondition());
    }
}
