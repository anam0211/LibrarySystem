package com.library.module.search.controller;

import com.library.common.response.ApiResponse;
import com.library.common.response.PagedResult;
import com.library.module.book.dto.response.BookResponseDTO;
import com.library.module.search.dto.SearchSuggestionResponseDTO;
import com.library.module.search.service.SearchService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SearchController {
    SearchService searchService;

    @GetMapping("/books")
    public ApiResponse<PagedResult<BookResponseDTO>> searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer authorId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer publisherId,
            @RequestParam(required = false) Integer publishYear,
            @RequestParam(required = false) Boolean available,
            @RequestParam(defaultValue = "relevance") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                searchService.searchBooks(keyword, authorId, categoryId, publisherId, publishYear, available, sortBy, sortDir, page, size)
        );
    }

    @GetMapping("/suggestions")
    public ApiResponse<SearchSuggestionResponseDTO> suggest(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ApiResponse.success(searchService.suggest(keyword, limit));
    }
}
