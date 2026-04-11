package com.library.module.book.controller;

import com.library.common.response.ApiResponse;
import com.library.common.response.PagedResult;
import com.library.module.book.dto.request.BookRequestDTO;
import com.library.module.book.dto.response.BookResponseDTO;
import com.library.module.book.service.BookService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @RequestParam(required = false) Boolean available,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                bookService.getBooks(keyword, authorId, categoryId, publisherId, publishYear, available, sortBy, sortDir, page, size)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<BookResponseDTO> getBookById(@PathVariable Integer id) {
        return ApiResponse.success(bookService.getBookById(id));
    }

    @GetMapping("/newest")
    public ApiResponse<List<BookResponseDTO>> getNewestBooks(@RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.success(bookService.getNewestBooks(limit));
    }

    @GetMapping("/featured")
    public ApiResponse<List<BookResponseDTO>> getFeaturedBooks(@RequestParam(defaultValue = "8") int limit) {
        return ApiResponse.success(bookService.getFeaturedBooks(limit));
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
