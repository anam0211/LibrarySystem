package com.library.service;

import com.library.common.response.PagedResult;
import com.library.dto.response.BookResponseDTO;
import com.library.repository.BookRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SearchService {
    static final int MAX_SEARCH_POOL_SIZE = 5000;
    static final Pattern TERM_SPLITTER = Pattern.compile("[^\\p{L}\\p{N}]+");

    BookService bookService;
    BookRepository bookRepository;

    public PagedResult<BookResponseDTO> searchBooks(
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
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        if (normalizedKeyword.isEmpty()) {
            return bookService.getBooks(null, authorId, categoryId, publisherId, publishYear, status, available, sortBy,
                    sortDir, page, size);
        }

        try {
            List<Integer> rankedBookIds = bookRepository.searchBookIdsByFullText(buildFullTextQuery(normalizedKeyword));

            if (rankedBookIds.isEmpty()) {
                return emptyPage(page, size);
            }

            PagedResult<BookResponseDTO> baseResult = bookService.getBooks(
                    null,
                    authorId,
                    categoryId,
                    publisherId,
                    publishYear,
                    status,
                    available,
                    normalizeSortBy(sortBy),
                    sortDir,
                    0,
                    MAX_SEARCH_POOL_SIZE);

            Map<Integer, Integer> rankMap = new HashMap<>();
            for (int index = 0; index < rankedBookIds.size(); index++) {
                rankMap.putIfAbsent(rankedBookIds.get(index), index);
            }

            List<BookResponseDTO> matchedBooks = baseResult.getItems().stream()
                    .filter(book -> rankMap.containsKey(book.getId()))
                    .toList();

            List<BookResponseDTO> sortedBooks = new ArrayList<>(matchedBooks);
            if (sortBy == null || sortBy.isBlank() || "relevance".equalsIgnoreCase(sortBy)) {
                sortedBooks.sort((first, second) -> Integer.compare(
                        rankMap.getOrDefault(first.getId(), Integer.MAX_VALUE),
                        rankMap.getOrDefault(second.getId(), Integer.MAX_VALUE)));
            }

            return paginate(sortedBooks, page, size);
        } catch (DataAccessException exception) {
            return bookService.getBooks(normalizedKeyword, authorId, categoryId, publisherId, publishYear, status, available,
                    normalizeSortBy(sortBy), sortDir, page, size);
        }
    }

    private String buildFullTextQuery(String keyword) {
        List<String> terms = TERM_SPLITTER.splitAsStream(keyword.trim())
                .map(String::trim)
                .filter(term -> !term.isBlank())
                .map(term -> "\"" + term.replace("\"", "") + "*\"")
                .distinct()
                .toList();

        if (terms.isEmpty()) {
            return "\"" + keyword.replace("\"", "").trim() + "*\"";
        }

        return String.join(" OR ", terms);
    }

    private String normalizeSortBy(String sortBy) {
        return sortBy == null || sortBy.isBlank() || "relevance".equalsIgnoreCase(sortBy)
                ? "createdAt"
                : sortBy;
    }

    private PagedResult<BookResponseDTO> paginate(List<BookResponseDTO> books, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, books.size());
        int toIndex = Math.min(fromIndex + safeSize, books.size());
        List<BookResponseDTO> items = books.subList(fromIndex, toIndex);
        int totalPages = books.isEmpty() ? 0 : (int) Math.ceil((double) books.size() / safeSize);

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

    private PagedResult<BookResponseDTO> emptyPage(int page, int size) {
        return PagedResult.<BookResponseDTO>builder()
                .items(List.of())
                .page(Math.max(page, 0))
                .size(Math.max(size, 1))
                .totalItems(0)
                .totalPages(0)
                .first(true)
                .last(true)
                .build();
    }
}
