package com.library.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.entity.Book;
import com.library.entity.BookCopyStatus;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.LoanItemRepository;
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
        when(bookCopyRepository.countByBook_IdAndStatus(10, BookCopyStatus.AVAILABLE)).thenReturn(3L);

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
}
