package com.library.service.book;

import com.library.common.exception.AppException;
import com.library.entity.Author;
import com.library.entity.Book;
import com.library.entity.BookAuthor;
import com.library.entity.BookAuthorId;
import com.library.entity.BookCategory;
import com.library.entity.BookCategoryId;
import com.library.entity.BookImage;
import com.library.entity.Category;
import com.library.exception.BookErrorCode;
import com.library.repository.AuthorRepository;
import com.library.repository.BookAuthorRepository;
import com.library.repository.BookCategoryRepository;
import com.library.repository.BookImageRepository;
import com.library.repository.CategoryRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookRelationService {
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final BookAuthorRepository bookAuthorRepository;
    private final BookCategoryRepository bookCategoryRepository;
    private final BookImageRepository bookImageRepository;

    public void syncAuthors(Book book, List<Integer> authorIds) {
        bookAuthorRepository.deleteByBookId(book.getId());

        int authorOrder = 1;
        for (Integer authorId : uniqueIds(authorIds)) {
            Author author = authorRepository.findById(authorId)
                    .orElseThrow(() -> new AppException(BookErrorCode.BOOK_AUTHOR_NOT_FOUND));

            BookAuthor relation = new BookAuthor();
            BookAuthorId id = new BookAuthorId();
            id.setBookId(book.getId());
            id.setAuthorId(authorId);

            relation.setId(id);
            relation.setBook(book);
            relation.setAuthor(author);
            relation.setAuthorOrder(authorOrder);

            bookAuthorRepository.save(relation);
            authorOrder++;
        }
    }

    public void syncCategories(Book book, List<Integer> categoryIds) {
        bookCategoryRepository.deleteByBookId(book.getId());

        for (Integer categoryId : uniqueIds(categoryIds)) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(BookErrorCode.BOOK_CATEGORY_NOT_FOUND));

            BookCategory relation = new BookCategory();
            BookCategoryId id = new BookCategoryId();
            id.setBookId(book.getId());
            id.setCategoryId(categoryId);

            relation.setId(id);
            relation.setBook(book);
            relation.setCategory(category);

            bookCategoryRepository.save(relation);
        }
    }

    public void deleteRelations(Integer bookId) {
        bookAuthorRepository.deleteByBookId(bookId);
        bookCategoryRepository.deleteByBookId(bookId);
    }

    public List<BookAuthor> findAuthors(Integer bookId) {
        return bookAuthorRepository.findByBook_IdOrderByAuthorOrderAsc(bookId);
    }

    public List<BookCategory> findCategories(Integer bookId) {
        return bookCategoryRepository.findByBook_Id(bookId);
    }

    public BookImage findPrimaryImage(Integer bookId) {
        return bookImageRepository.findFirstByBook_IdAndPrimaryTrue(bookId).orElse(null);
    }

    public Map<Integer, List<BookAuthor>> groupAuthorsByBook(List<Integer> bookIds) {
        Map<Integer, List<BookAuthor>> result = new LinkedHashMap<>();
        if (bookIds == null || bookIds.isEmpty()) {
            return result;
        }

        List<BookAuthor> authors = bookAuthorRepository.findByBook_IdInOrderByAuthorOrderAsc(bookIds);
        for (BookAuthor author : authors) {
            Integer bookId = author.getBook().getId();
            if (!result.containsKey(bookId)) {
                result.put(bookId, new ArrayList<>());
            }
            result.get(bookId).add(author);
        }

        return result;
    }

    public Map<Integer, List<BookCategory>> groupCategoriesByBook(List<Integer> bookIds) {
        Map<Integer, List<BookCategory>> result = new LinkedHashMap<>();
        if (bookIds == null || bookIds.isEmpty()) {
            return result;
        }

        List<BookCategory> categories = bookCategoryRepository.findByBook_IdIn(bookIds);
        for (BookCategory category : categories) {
            Integer bookId = category.getBook().getId();
            result.computeIfAbsent(bookId, key -> new ArrayList<>()).add(category);
        }

        return result;
    }

    public Map<Integer, BookImage> groupPrimaryImagesByBook(List<Integer> bookIds) {
        Map<Integer, BookImage> result = new HashMap<>();
        if (bookIds == null || bookIds.isEmpty()) {
            return result;
        }

        List<BookImage> images = bookImageRepository.findByBook_IdInOrderByCreatedAtDesc(bookIds);
        for (BookImage image : images) {
            Integer bookId = image.getBook().getId();
            boolean isPrimary = Boolean.TRUE.equals(image.getPrimary());

            if (isPrimary || !result.containsKey(bookId)) {
                result.put(bookId, image);
            }
        }

        return result;
    }

    private List<Integer> uniqueIds(List<Integer> ids) {
        List<Integer> result = new ArrayList<>();
        if (ids == null) {
            return result;
        }

        for (Integer id : ids) {
            if (id == null || result.contains(id)) {
                continue;
            }

            result.add(id);
        }

        return result;
    }
}
