package com.library.module.search.service;

import com.library.common.response.PagedResult;
import com.library.module.author.repository.AuthorRepository;
import com.library.module.book.dto.response.BookResponseDTO;
import com.library.module.book.repository.BookRepository;
import com.library.module.book.service.BookService;
import com.library.module.category.repository.CategoryRepository;
import com.library.module.publisher.repository.PublisherRepository;
import com.library.module.search.dto.SearchSuggestionResponseDTO;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SearchService {
    static final int MAX_SEARCH_POOL_SIZE = 5000;
    static final Pattern TERM_SPLITTER = Pattern.compile("[^\\p{L}\\p{N}]+");

    BookService bookService;
    BookRepository bookRepository;
    AuthorRepository authorRepository;
    CategoryRepository categoryRepository;
    PublisherRepository publisherRepository;

    public PagedResult<BookResponseDTO> searchBooks(
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
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        if (normalizedKeyword.isEmpty()) {
            return bookService.getBooks(null, authorId, categoryId, publisherId, publishYear, available, sortBy, sortDir, page, size);
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
                    available,
                    normalizeSortBy(sortBy),
                    sortDir,
                    0,
                    MAX_SEARCH_POOL_SIZE
            );

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
                        rankMap.getOrDefault(second.getId(), Integer.MAX_VALUE)
                ));
            }

            return paginate(sortedBooks, page, size);
        } catch (DataAccessException exception) {
            return bookService.getBooks(normalizedKeyword, authorId, categoryId, publisherId, publishYear, available, normalizeSortBy(sortBy), sortDir, page, size);
        }
    }

    public SearchSuggestionResponseDTO suggest(String keyword, int limit) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        if (normalizedKeyword.isEmpty()) {
            return SearchSuggestionResponseDTO.builder().suggestions(java.util.List.of()).build();
        }

        Set<String> suggestions = new LinkedHashSet<>();
        suggestions.addAll(bookService.suggestTitles(normalizedKeyword, limit));
        authorRepository.findAll().stream()
                .map(author -> author.getName())
                .filter(name -> name != null && name.toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .limit(limit)
                .forEach(suggestions::add);
        categoryRepository.findAll().stream()
                .map(category -> category.getName())
                .filter(name -> name != null && name.toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .limit(limit)
                .forEach(suggestions::add);
        publisherRepository.findAll().stream()
                .map(publisher -> publisher.getName())
                .filter(name -> name != null && name.toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .limit(limit)
                .forEach(suggestions::add);

        return SearchSuggestionResponseDTO.builder()
                .suggestions(suggestions.stream().limit(limit).toList())
                .build();
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
