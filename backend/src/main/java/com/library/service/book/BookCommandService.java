package com.library.service.book;

import com.library.common.exception.AppException;
import com.library.dto.request.BookRequestDTO;
import com.library.dto.response.BookResponseDTO;
import com.library.entity.Book;
import com.library.entity.Publisher;
import com.library.exception.BookErrorCode;
import com.library.repository.BookLoanReferenceRepository;
import com.library.repository.BookRepository;
import com.library.service.MediaService;
import com.library.validator.BookValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BookCommandService {
    private final BookRepository bookRepository;
    private final BookLoanReferenceRepository bookLoanReferenceRepository;
    private final MediaService mediaService;
    private final BookRelationService bookRelationService;
    private final BookQueryService bookQueryService;
    private final BookValidator bookValidator;

    public BookResponseDTO create(BookRequestDTO request) {
        Book book = new Book();
        copyRequestToBook(book, request);

        Book savedBook = bookRepository.save(book);
        saveBookRelations(savedBook, request);

        return bookQueryService.getBookById(savedBook.getId());
    }

    public BookResponseDTO update(Integer id, BookRequestDTO request) {
        Book book = getBook(id);
        copyRequestToBook(book, request);

        Book savedBook = bookRepository.save(book);
        saveBookRelations(savedBook, request);

        return bookQueryService.getBookById(savedBook.getId());
    }

    public void delete(Integer id) {
        Book book = getBook(id);

        if (bookLoanReferenceRepository.countLoanItemsByBookId(id) > 0) {
            throw new AppException(BookErrorCode.BOOK_LINKED_LOAN);
        }

        mediaService.deleteByBook(id);
        bookRelationService.deleteRelations(id);
        deleteBook(book);
    }

    private Book getBook(Integer id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new AppException(BookErrorCode.BOOK_NOT_FOUND));
    }

    private void copyRequestToBook(Book book, BookRequestDTO request) {
        String title = bookValidator.requireTitle(request.getTitle());
        String isbn = bookValidator.trimToNull(request.getIsbn());
        Publisher publisher = bookValidator.requirePublisher(request.getPublisherId());
        int stockTotal = bookValidator.valueOrZero(request.getStockTotal());
        int stockAvailable = bookValidator.valueOrZero(request.getStockAvailable());

        bookValidator.requireAuthor(request.getAuthorIds());
        bookValidator.requireCategory(request.getCategoryIds());
        bookValidator.requireValidStock(stockTotal, stockAvailable);
        bookValidator.requireUniqueIsbn(isbn, book.getId());

        book.setIsbn(isbn);
        book.setTitle(title);
        book.setSubtitle(bookValidator.trimToNull(request.getSubtitle()));
        book.setPublisher(publisher);
        book.setPublishYear(request.getPublishYear());
        book.setLanguageCode(bookValidator.trimToNull(request.getLanguageCode()));
        book.setPageCount(request.getPageCount());
        book.setDescription(bookValidator.trimToNull(request.getDescription()));
        book.setKeywords(bookValidator.trimToNull(request.getKeywords()));
        book.setStockTotal(stockTotal);
        book.setStockAvailable(stockAvailable);
        book.setOriginalPrice(request.getOriginalPrice());
        book.setStatus(bookValidator.toBookStatus(request.getStatus()));
    }

    private void saveBookRelations(Book book, BookRequestDTO request) {
        bookRelationService.syncAuthors(book, request.getAuthorIds());
        bookRelationService.syncCategories(book, request.getCategoryIds());
    }

    private void deleteBook(Book book) {
        try {
            bookRepository.delete(book);
            bookRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(BookErrorCode.BOOK_LINKED_LOAN);
        }
    }
}
