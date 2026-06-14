package com.library.service.book;
import com.library.common.exception.AppException;
import com.library.common.response.PagedResult;
import com.library.dto.response.BookResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookAuthor;
import com.library.entity.BookCategory;
import com.library.entity.BookImage;
import com.library.entity.BookStatus;
import com.library.exception.BookErrorCode;
import com.library.mapper.BookResponseMapper;
import com.library.repository.BookRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookQueryService {
    private final BookRepository bookRepository;
    private final BookRelationService bookRelationService;
    private final BookResponseMapper bookResponseMapper;

    public PagedResult<BookResponseDTO> getBooks(
            String keyword,
            Integer authorId,
            Integer categoryId,
            Integer publisherId,
            Integer publishYear,
            String status,
            Boolean available,
            String sortBy,
            String sortDir,
            int page,
            int size) {
        List<Book> books = bookRepository.findAll(toSort(sortBy, sortDir));
        BookStatus statusFilter = toStatusFilter(status);
        String keywordText = cleanText(keyword);

        List<Book> filteredBooks = filterBooks(
                books,
                keywordText,
                publisherId,
                publishYear,
                statusFilter,
                available);

        List<Integer> bookIds = getBookIds(filteredBooks);
        Map<Integer, List<BookAuthor>> authors = bookRelationService.groupAuthorsByBook(bookIds);
        Map<Integer, List<BookCategory>> categories = bookRelationService.groupCategoriesByBook(bookIds);
        Map<Integer, BookImage> images = bookRelationService.groupPrimaryImagesByBook(bookIds);

        List<Book> resultBooks = filterByAuthorAndCategory(filteredBooks, authors, categories, authorId, categoryId);

        return buildPage(resultBooks, authors, categories, images, page, size);
    }

    public BookResponseDTO getBookById(Integer id) {
        Book book = getBook(id);

        return bookResponseMapper.toResponse(
                book,
                bookRelationService.findAuthors(id),
                bookRelationService.findCategories(id),
                bookRelationService.findPrimaryImage(id));
    }

    public List<BookResponseDTO> getNewestBooks(int limit) {
        List<BookResponseDTO> result = new ArrayList<>();
        List<Book> books = bookRepository.findTop8ByStatusOrderByCreatedAtDesc(BookStatus.ACTIVE);

        for (Book book : books) {
            if (result.size() >= limit) {
                break;
            }

            result.add(getBookById(book.getId()));
        }

        return result;
    }
    
    public List<BookResponseDTO> getFeaturedBooks(int limit) {
        List<Book> books = new ArrayList<>(bookRepository.findAll());

        Collections.sort(books, new Comparator<Book>() {
            @Override
            public int compare(Book b1, Book b2) {
                int stockCompare = compareIntegerDesc(b1.getStockAvailable(), b2.getStockAvailable());
                if (stockCompare != 0) {
                    return stockCompare;
                }

                return compareCreatedAtDesc(b1, b2);
            }
        });

        List<BookResponseDTO> result = new ArrayList<>();
        for (Book book : books) {
            if (result.size() >= limit) {
                break;
            }

            if (book.getStatus() == BookStatus.ACTIVE) {
                result.add(getBookById(book.getId()));
            }
        }

        return result;
    }

    public Map<String, List<BookResponseDTO>> getLeaderboards(int limit) {
        int safeLimit = Math.max(1, limit);
        List<BookResponseDTO> books = getAllActiveBookResponses();

        Map<String, List<BookResponseDTO>> result = new LinkedHashMap<>();
        result.put("borrowed", topBooksByBorrowCount(books, safeLimit));
        result.put("rated", topBooksByRating(books, safeLimit));
        result.put("favorite", topBooksByFavoriteCount(books, safeLimit));
        return result;
    }

    private Book getBook(Integer id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new AppException(BookErrorCode.BOOK_NOT_FOUND));
    }

    private List<BookResponseDTO> getAllActiveBookResponses() {
        List<Book> books = new ArrayList<>(bookRepository.findAll());

        Collections.sort(books, new Comparator<Book>() {
            @Override
            public int compare(Book b1, Book b2) {
                return compareCreatedAtDesc(b1, b2);
            }
        });

        List<Book> activeBooks = new ArrayList<>();

        for (Book book : books) {
            BookStatus status = book.getStatus() == null ? BookStatus.ACTIVE : book.getStatus();
            if (status == BookStatus.ACTIVE) {
                activeBooks.add(book);
            }
        }

        List<Integer> bookIds = getBookIds(activeBooks);
        Map<Integer, List<BookAuthor>> authors = bookRelationService.groupAuthorsByBook(bookIds);
        Map<Integer, List<BookCategory>> categories = bookRelationService.groupCategoriesByBook(bookIds);
        Map<Integer, BookImage> images = bookRelationService.groupPrimaryImagesByBook(bookIds);

        List<BookResponseDTO> result = new ArrayList<>();
        for (Book book : activeBooks) {
            Integer bookId = book.getId();
            result.add(bookResponseMapper.toResponse(
                    book,
                    authors.get(bookId),
                    categories.get(bookId),
                    images.get(bookId)));
        }

        return result;
    }
    private List<BookResponseDTO> topBooksByBorrowCount(List<BookResponseDTO> books, int limit) {
        List<BookResponseDTO> result = new ArrayList<>();

        for (BookResponseDTO book : books) {
            if (borrowCount(book) > 0) {
                result.add(book);
            }
        }

        Collections.sort(result, new Comparator<BookResponseDTO>() {
            @Override
            public int compare(BookResponseDTO b1, BookResponseDTO b2) {
                int scoreCompare = Double.compare(borrowCount(b2), borrowCount(b1));
                if (scoreCompare != 0) {
                    return scoreCompare;
                }

                return compareTitleAsc(b1.getTitle(), b2.getTitle());
            }
        });

        return limitBookResponses(result, limit);
    }

    private List<BookResponseDTO> topBooksByRating(List<BookResponseDTO> books, int limit) {
        List<BookResponseDTO> result = new ArrayList<>();

        for (BookResponseDTO book : books) {
            if (ratingScore(book) > 0) {
                result.add(book);
            }
        }

        Collections.sort(result, new Comparator<BookResponseDTO>() {
            @Override
            public int compare(BookResponseDTO b1, BookResponseDTO b2) {
                int scoreCompare = Double.compare(ratingScore(b2), ratingScore(b1));
                if (scoreCompare != 0) {
                    return scoreCompare;
                }

                return compareTitleAsc(b1.getTitle(), b2.getTitle());
            }
        });

        return limitBookResponses(result, limit);
    }

    private List<BookResponseDTO> topBooksByFavoriteCount(List<BookResponseDTO> books, int limit) {
        List<BookResponseDTO> result = new ArrayList<>();

        for (BookResponseDTO book : books) {
            if (favoriteCount(book) > 0) {
                result.add(book);
            }
        }

        Collections.sort(result, new Comparator<BookResponseDTO>() {
            @Override
            public int compare(BookResponseDTO b1, BookResponseDTO b2) {
                int scoreCompare = Double.compare(favoriteCount(b2), favoriteCount(b1));
                if (scoreCompare != 0) {
                    return scoreCompare;
                }

                return compareTitleAsc(b1.getTitle(), b2.getTitle());
            }
        });

        return limitBookResponses(result, limit);
    }

    private List<BookResponseDTO> limitBookResponses(List<BookResponseDTO> books, int limit) {
        List<BookResponseDTO> result = new ArrayList<>();

        for (BookResponseDTO book : books) {
            if (result.size() >= limit) {
                break;
            }

            result.add(book);
        }

        return result;
    }

    private int compareIntegerDesc(Integer value1, Integer value2) {
        if (value1 == null && value2 == null) {
            return 0;
        }

        if (value1 == null) {
            return 1;
        }

        if (value2 == null) {
            return -1;
        }

        return Integer.compare(value2, value1);
    }

    private int compareCreatedAtDesc(Book b1, Book b2) {
        if (b1.getCreatedAt() == null && b2.getCreatedAt() == null) {
            return 0;
        }

        if (b1.getCreatedAt() == null) {
            return 1;
        }

        if (b2.getCreatedAt() == null) {
            return -1;
        }

        return b2.getCreatedAt().compareTo(b1.getCreatedAt());
    }

    private int compareTitleAsc(String title1, String title2) {
        if (title1 == null && title2 == null) {
            return 0;
        }

        if (title1 == null) {
            return 1;
        }

        if (title2 == null) {
            return -1;
        }

        return title1.compareToIgnoreCase(title2);
    }

    private double borrowCount(BookResponseDTO book) {
        return book.getBorrowCount() == null ? 0 : book.getBorrowCount();
    }

    private double ratingScore(BookResponseDTO book) {
        return book.getAverageRating() == null ? 0F : book.getAverageRating();
    }

    private double favoriteCount(BookResponseDTO book) {
        return book.getFavoriteCount() == null ? 0 : book.getFavoriteCount();
    }

    private List<Book> filterBooks(
            List<Book> books,
            String keyword,
            Integer publisherId,
            Integer publishYear,
            BookStatus status,
            Boolean available) {
        List<Book> result = new ArrayList<>();

        for (Book book : books) {
            if (!matchKeyword(book, keyword)) {
                continue;
            }
            if (!matchPublisher(book, publisherId)) {
                continue;
            }
            if (!matchPublishYear(book, publishYear)) {
                continue;
            }
            if (!matchStatus(book, status)) {
                continue;
            }
            if (!matchAvailable(book, available)) {
                continue;
            }

            result.add(book);
        }

        return result;
    }

    private List<Book> filterByAuthorAndCategory(
            List<Book> books,
            Map<Integer, List<BookAuthor>> authors,
            Map<Integer, List<BookCategory>> categories,
            Integer authorId,
            Integer categoryId) {
        List<Book> result = new ArrayList<>();

        for (Book book : books) {
            Integer bookId = book.getId();
            if (!matchAuthor(authors.get(bookId), authorId)) {
                continue;
            }
            if (!matchCategory(categories.get(bookId), categoryId)) {
                continue;
            }

            result.add(book);
        }

        return result;
    }

    private PagedResult<BookResponseDTO> buildPage(
            List<Book> books,
            Map<Integer, List<BookAuthor>> authors,
            Map<Integer, List<BookCategory>> categories,
            Map<Integer, BookImage> images,
            int page,
            int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, books.size());
        int toIndex = Math.min(fromIndex + safeSize, books.size());
        int totalPages = books.isEmpty() ? 0 : (int) Math.ceil((double) books.size() / safeSize);

        List<BookResponseDTO> items = new ArrayList<>();
        for (int index = fromIndex; index < toIndex; index++) {
            Book book = books.get(index);
            Integer bookId = book.getId();

            items.add(bookResponseMapper.toResponse(
                    book,
                    authors.get(bookId),
                    categories.get(bookId),
                    images.get(bookId)));
        }

        return PagedResult.<BookResponseDTO>builder()
                .items(items)
                .page(safePage)
                .size(safeSize)
                .totalItems(books.size())
                .totalPages(totalPages)
                .first(safePage == 0)
                .last(totalPages == 0 || safePage >= totalPages - 1)
                .build();
    }

    private List<Integer> getBookIds(List<Book> books) {
        List<Integer> ids = new ArrayList<>();
        for (Book book : books) {
            ids.add(book.getId());
        }

        return ids;
    }

    private boolean matchKeyword(Book book, String keyword) {
        if (keyword == null) {
            return true;
        }

        return contains(book.getTitle(), keyword)
                || contains(book.getSubtitle(), keyword)
                || contains(book.getIsbn(), keyword)
                || contains(book.getDescription(), keyword)
                || contains(book.getKeywords(), keyword);
    }

    private boolean matchPublisher(Book book, Integer publisherId) {
        if (publisherId == null) {
            return true;
        }

        return book.getPublisher() != null && Objects.equals(book.getPublisher().getId(), publisherId);
    }

    private boolean matchPublishYear(Book book, Integer publishYear) {
        return publishYear == null || Objects.equals(book.getPublishYear(), publishYear);
    }

    private boolean matchStatus(Book book, BookStatus status) {
        if (status == null) {
            return true;
        }

        BookStatus bookStatus = book.getStatus() == null ? BookStatus.ACTIVE : book.getStatus();
        return bookStatus == status;
    }

    private boolean matchAvailable(Book book, Boolean available) {
        if (available == null) {
            return true;
        }

        int stockAvailable = book.getStockAvailable() == null ? 0 : book.getStockAvailable();
        boolean inStock = stockAvailable > 0;
        return available == inStock;
    }

    private boolean matchAuthor(List<BookAuthor> authors, Integer authorId) {
        if (authorId == null) {
            return true;
        }
        if (authors == null) {
            return false;
        }

        for (BookAuthor author : authors) {
            if (Objects.equals(author.getAuthor().getId(), authorId)) {
                return true;
            }
        }

        return false;
    }

    private boolean matchCategory(List<BookCategory> categories, Integer categoryId) {
        if (categoryId == null) {
            return true;
        }
        if (categories == null) {
            return false;
        }

        for (BookCategory category : categories) {
            if (Objects.equals(category.getCategory().getId(), categoryId)) {
                return true;
            }
        }

        return false;
    }

    private Sort toSort(String sortBy, String sortDir) {
        String field = validSortField(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private boolean validSortField(String sortBy) {
        return "title".equals(sortBy)
                || "publishYear".equals(sortBy)
                || "stockTotal".equals(sortBy)
                || "stockAvailable".equals(sortBy)
                || "originalPrice".equals(sortBy)
                || "averageRating".equals(sortBy)
                || "reviewCount".equals(sortBy)
                || "createdAt".equals(sortBy)
                || "updatedAt".equals(sortBy)
                || "isbn".equals(sortBy);
    }

    private BookStatus toStatusFilter(String status) {
        String text = cleanText(status);
        if (text == null) {
            return BookStatus.ACTIVE;
        }

        if ("ALL".equalsIgnoreCase(text)) {
            return null;
        }

        try {
            return BookStatus.valueOf(text.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new AppException(BookErrorCode.BOOK_STATUS_INVALID);
        }
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private String cleanText(String value) {
        if (value == null) {
            return null;
        }

        String text = value.trim();
        return text.isEmpty() ? null : text.toLowerCase(Locale.ROOT);
    }
}
