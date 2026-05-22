package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.common.response.PagedResult;
import com.library.dto.request.BookRequestDTO;
import com.library.dto.response.BookResponseDTO;
import com.library.service.BookService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookController {
    BookService bookService;

    @GetMapping
    public ApiResponse<PagedResult<BookResponseDTO>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer authorId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer publisherId,
            @RequestParam(required = false) Integer publishYear,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean available,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                bookService.getBooks(keyword, authorId, categoryId, publisherId, publishYear, status, available, sortBy, sortDir, page, size)
        );
    }

    @GetMapping("/newest")
    public ApiResponse<List<BookResponseDTO>> getNewestBooks(@RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.success(bookService.getNewestBooks(limit));
    }

    @GetMapping("/featured")
    public ApiResponse<List<BookResponseDTO>> getFeaturedBooks(@RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.success(bookService.getFeaturedBooks(limit));
    }

    @GetMapping("/leaderboards")
    public ApiResponse<Map<String, List<BookResponseDTO>>> getLeaderboards(@RequestParam(defaultValue = "6") int limit) {
        return ApiResponse.success(bookService.getLeaderboards(limit));
    }

    @GetMapping("/{id:\\d+}")
    public ApiResponse<BookResponseDTO> getBookById(@PathVariable Integer id) {
        return ApiResponse.success(bookService.getBookById(id));
    }

    @PostMapping
    public ApiResponse<BookResponseDTO> create(@RequestBody BookRequestDTO requestDTO) {
        return ApiResponse.success(bookService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ApiResponse<BookResponseDTO> update(@PathVariable Integer id, @RequestBody BookRequestDTO requestDTO) {
        return ApiResponse.success(bookService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        bookService.delete(id);
        return ApiResponse.success(null);
    }
}
