package com.library.module.book.service;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.common.response.PagedResult;
import com.library.module.author.entity.Author;
import com.library.module.author.repository.AuthorRepository;
import com.library.module.book.dto.request.BookRequestDTO;
import com.library.module.book.dto.response.BookAuthorItemDTO;
import com.library.module.book.dto.response.BookCategoryItemDTO;
import com.library.module.book.dto.response.BookResponseDTO;
import com.library.module.book.entity.*;
import com.library.module.book.repository.BookAuthorRepository;
import com.library.module.book.repository.BookCategoryRepository;
import com.library.module.book.repository.BookImageRepository;
import com.library.module.book.repository.BookRepository;
import com.library.module.category.entity.Category;
import com.library.module.category.repository.CategoryRepository;
import com.library.module.publisher.entity.Publisher;
import com.library.module.publisher.repository.PublisherRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookService {
    BookRepository bookRepository;
    PublisherRepository publisherRepository;
    AuthorRepository authorRepository;
    CategoryRepository categoryRepository;
    BookAuthorRepository bookAuthorRepository;
    BookCategoryRepository bookCategoryRepository;
    BookImageRepository bookImageRepository;

    public PagedResult<BookResponseDTO> getBooks(
            String keyword,
            Integer authorId,
            Integer categoryId,
            Integer publisherId,
            Integer publishYear,
            Boolean available,
            String sortBy,
            String sortDir,
            int page,
            int size
    ) {
        List<Book> books = bookRepository.findAll(resolveSort(sortBy, sortDir));

        List<Book> filteredBooks = books.stream()
                .filter(book -> matchesKeyword(book, keyword))
                .filter(book -> matchesPublisher(book, publisherId))
                .filter(book -> matchesPublishYear(book, publishYear))
                .filter(book -> matchesAvailable(book, available))
                .toList();

        Map<Integer, List<BookAuthor>> bookAuthors = groupAuthorsByBook(
                filteredBooks.stream().map(Book::getId).toList()
        );
        Map<Integer, List<BookCategory>> bookCategories = groupCategoriesByBook(
                filteredBooks.stream().map(Book::getId).toList()
        );
        Map<Integer, BookImage> primaryImages = groupPrimaryImagesByBook(
                filteredBooks.stream().map(Book::getId).toList()
        );

        List<Book> relationFilteredBooks = filteredBooks.stream()
                .filter(book -> matchesAuthor(bookAuthors.get(book.getId()), authorId))
                .filter(book -> matchesCategory(bookCategories.get(book.getId()), categoryId))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, relationFilteredBooks.size());
        int toIndex = Math.min(fromIndex + safeSize, relationFilteredBooks.size());
        List<BookResponseDTO> items = relationFilteredBooks.subList(fromIndex, toIndex)
                .stream()
                .map(book -> toResponse(book, bookAuthors.get(book.getId()), bookCategories.get(book.getId()), primaryImages.get(book.getId())))
                .toList();

        int totalPages = relationFilteredBooks.isEmpty() ? 0 : (int) Math.ceil((double) relationFilteredBooks.size() / safeSize);

        return PagedResult.<BookResponseDTO>builder()
                .items(items)
                .page(safePage)
                .size(safeSize)
                .totalItems(relationFilteredBooks.size())
                .totalPages(totalPages)
                .first(safePage == 0)
                .last(totalPages == 0 || safePage >= totalPages - 1)
                .build();
    }

    public BookResponseDTO getBookById(Integer id) {
        Book book = getBook(id);

        return toResponse(
                book,
                bookAuthorRepository.findByBook_IdOrderByAuthorOrderAsc(id),
                bookCategoryRepository.findByBook_Id(id),
                bookImageRepository.findFirstByBook_IdAndPrimaryTrue(id).orElse(null)
        );
    }

    public BookResponseDTO create(BookRequestDTO requestDTO) {
        Book book = new Book();
        applyRequest(book, requestDTO);
        Book savedBook = bookRepository.save(book);
        syncAuthors(savedBook, requestDTO.getAuthorIds());
        syncCategories(savedBook, requestDTO.getCategoryIds());

        return getBookById(savedBook.getId());
    }

    public BookResponseDTO update(Integer id, BookRequestDTO requestDTO) {
        Book book = getBook(id);
        applyRequest(book, requestDTO);
        Book savedBook = bookRepository.save(book);
        syncAuthors(savedBook, requestDTO.getAuthorIds());
        syncCategories(savedBook, requestDTO.getCategoryIds());

        return getBookById(savedBook.getId());
    }

    public void delete(Integer id) {
        Book book = getBook(id);
        bookAuthorRepository.deleteByBookId(id);
        bookCategoryRepository.deleteByBookId(id);
        bookRepository.delete(book);
    }

    public List<BookResponseDTO> getNewestBooks(int limit) {
        return bookRepository.findTop8ByStatusOrderByCreatedAtDesc(BookStatus.ACTIVE)
                .stream()
                .limit(limit)
                .map(book -> getBookById(book.getId()))
                .toList();
    }

    public List<BookResponseDTO> getFeaturedBooks(int limit) {
        return bookRepository.findAll().stream()
                .filter(book -> book.getStatus() == BookStatus.ACTIVE)
                .sorted(Comparator.comparing(Book::getStockAvailable, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Book::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .map(book -> getBookById(book.getId()))
                .toList();
    }

    public List<String> suggestTitles(String keyword, int limit) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }

        return bookRepository.suggestTitles(keyword.trim(), PageRequest.of(0, Math.max(limit, 1)));
    }

    private Book getBook(Integer id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay sach."));
    }

    private void applyRequest(Book book, BookRequestDTO requestDTO) {
        if (requestDTO.getTitle() == null || requestDTO.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Tieu de sach la bat buoc.");
        }

        if (requestDTO.getPublisherId() == null) {
            throw new BadRequestException("Sach can co nha xuat ban.");
        }

        Publisher publisher = publisherRepository.findById(requestDTO.getPublisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nha xuat ban."));

        List<Integer> authorIds = requestDTO.getAuthorIds() == null ? List.of() : requestDTO.getAuthorIds();
        List<Integer> categoryIds = requestDTO.getCategoryIds() == null ? List.of() : requestDTO.getCategoryIds();

        if (authorIds.isEmpty()) {
            throw new BadRequestException("Sach can it nhat mot tac gia.");
        }

        if (categoryIds.isEmpty()) {
            throw new BadRequestException("Sach can it nhat mot the loai.");
        }

        int stockTotal = requestDTO.getStockTotal() == null ? 0 : requestDTO.getStockTotal();
        int stockAvailable = requestDTO.getStockAvailable() == null ? 0 : requestDTO.getStockAvailable();

        if (stockTotal < 0 || stockAvailable < 0 || stockAvailable > stockTotal) {
            throw new BadRequestException("Ton kho khong hop le.");
        }

        book.setIsbn(trimToNull(requestDTO.getIsbn()));
        book.setTitle(requestDTO.getTitle().trim());
        book.setSubtitle(trimToNull(requestDTO.getSubtitle()));
        book.setPublisher(publisher);
        book.setPublishYear(requestDTO.getPublishYear());
        book.setLanguageCode(trimToNull(requestDTO.getLanguageCode()));
        book.setPageCount(requestDTO.getPageCount());
        book.setDescription(trimToNull(requestDTO.getDescription()));
        book.setKeywords(trimToNull(requestDTO.getKeywords()));
        book.setStockTotal(stockTotal);
        book.setStockAvailable(stockAvailable);
        book.setStatus(resolveStatus(requestDTO.getStatus()));
    }

    private void syncAuthors(Book book, List<Integer> authorIds) {
        bookAuthorRepository.deleteByBookId(book.getId());

        List<Integer> distinctAuthorIds = authorIds == null ? List.of() : authorIds.stream().filter(Objects::nonNull).distinct().toList();
        int order = 1;
        for (Integer authorId : distinctAuthorIds) {
            Author author = authorRepository.findById(authorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tac gia."));
            BookAuthor relation = new BookAuthor();
            BookAuthorId id = new BookAuthorId();
            id.setBookId(book.getId());
            id.setAuthorId(authorId);
            relation.setId(id);
            relation.setBook(book);
            relation.setAuthor(author);
            relation.setAuthorOrder(order++);
            bookAuthorRepository.save(relation);
        }
    }

    private void syncCategories(Book book, List<Integer> categoryIds) {
        bookCategoryRepository.deleteByBookId(book.getId());

        List<Integer> distinctCategoryIds = categoryIds == null ? List.of() : categoryIds.stream().filter(Objects::nonNull).distinct().toList();
        for (Integer categoryId : distinctCategoryIds) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay the loai."));
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

    private Map<Integer, List<BookAuthor>> groupAuthorsByBook(List<Integer> bookIds) {
        if (bookIds.isEmpty()) {
            return Map.of();
        }

        return bookAuthorRepository.findByBook_IdInOrderByAuthorOrderAsc(bookIds)
                .stream()
                .collect(Collectors.groupingBy(item -> item.getBook().getId(), LinkedHashMap::new, Collectors.toList()));
    }

    private Map<Integer, List<BookCategory>> groupCategoriesByBook(List<Integer> bookIds) {
        if (bookIds.isEmpty()) {
            return Map.of();
        }

        return bookCategoryRepository.findByBook_IdIn(bookIds)
                .stream()
                .collect(Collectors.groupingBy(item -> item.getBook().getId(), LinkedHashMap::new, Collectors.toList()));
    }

    private Map<Integer, BookImage> groupPrimaryImagesByBook(List<Integer> bookIds) {
        if (bookIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, BookImage> result = new HashMap<>();
        for (BookImage image : bookImageRepository.findByBook_IdInOrderByCreatedAtDesc(bookIds)) {
            Integer bookId = image.getBook().getId();

            if (Boolean.TRUE.equals(image.getPrimary())) {
                result.put(bookId, image);
                continue;
            }

            result.putIfAbsent(bookId, image);
        }
        return result;
    }

    private boolean matchesKeyword(Book book, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase(Locale.ROOT);

        return contains(book.getTitle(), normalizedKeyword)
                || contains(book.getSubtitle(), normalizedKeyword)
                || contains(book.getIsbn(), normalizedKeyword)
                || contains(book.getDescription(), normalizedKeyword)
                || contains(book.getKeywords(), normalizedKeyword);
    }

    private boolean matchesPublisher(Book book, Integer publisherId) {
        return publisherId == null || (book.getPublisher() != null && Objects.equals(book.getPublisher().getId(), publisherId));
    }

    private boolean matchesPublishYear(Book book, Integer publishYear) {
        return publishYear == null || Objects.equals(book.getPublishYear(), publishYear);
    }

    private boolean matchesAvailable(Book book, Boolean available) {
        if (available == null) {
            return true;
        }

        boolean isAvailable = Optional.ofNullable(book.getStockAvailable()).orElse(0) > 0;
        return available == isAvailable;
    }

    private boolean matchesAuthor(List<BookAuthor> authors, Integer authorId) {
        if (authorId == null) {
            return true;
        }

        return authors != null && authors.stream().anyMatch(item -> Objects.equals(item.getAuthor().getId(), authorId));
    }

    private boolean matchesCategory(List<BookCategory> categories, Integer categoryId) {
        if (categoryId == null) {
            return true;
        }

        return categories != null && categories.stream().anyMatch(item -> Objects.equals(item.getCategory().getId(), categoryId));
    }

    private BookResponseDTO toResponse(
            Book book,
            List<BookAuthor> authors,
            List<BookCategory> categories,
            BookImage primaryImage
    ) {
        return BookResponseDTO.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .subtitle(book.getSubtitle())
                .publisherId(book.getPublisher() != null ? book.getPublisher().getId() : null)
                .publisherName(book.getPublisher() != null ? book.getPublisher().getName() : null)
                .publishYear(book.getPublishYear())
                .languageCode(book.getLanguageCode())
                .pageCount(book.getPageCount())
                .description(book.getDescription())
                .keywords(book.getKeywords())
                .stockTotal(book.getStockTotal())
                .stockAvailable(book.getStockAvailable())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .available(Optional.ofNullable(book.getStockAvailable()).orElse(0) > 0)
                .primaryImageUrl(primaryImage != null ? primaryImage.getFileUrl() : null)
                .authors((authors == null ? List.<BookAuthor>of() : authors).stream()
                        .map(item -> BookAuthorItemDTO.builder()
                                .id(item.getAuthor().getId())
                                .name(item.getAuthor().getName())
                                .build())
                        .toList())
                .categories((categories == null ? List.<BookCategory>of() : categories).stream()
                        .map(item -> BookCategoryItemDTO.builder()
                                .id(item.getCategory().getId())
                                .name(item.getCategory().getName())
                                .build())
                        .toList())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }

    private Sort resolveSort(String sortBy, String sortDir) {
        String safeSortBy = switch (sortBy == null ? "" : sortBy) {
            case "title", "publishYear", "stockTotal", "stockAvailable", "createdAt", "updatedAt", "isbn" -> sortBy;
            default -> "createdAt";
        };

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return Sort.by(direction, safeSortBy);
    }

    private BookStatus resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return BookStatus.ACTIVE;
        }

        try {
            return BookStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Trang thai sach khong hop le.");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }
}
