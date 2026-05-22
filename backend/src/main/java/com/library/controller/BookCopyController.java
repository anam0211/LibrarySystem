package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.dto.request.BookCopyRequestDTO;
import com.library.dto.response.BookCopyResponseDTO;
import com.library.service.BookCopyService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/book-copies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
public class BookCopyController {
    private final BookCopyService bookCopyService;

    @GetMapping("/books/{bookId}")
    public ApiResponse<List<BookCopyResponseDTO>> getCopiesByBook(@PathVariable Integer bookId) {
        return ApiResponse.success(bookCopyService.getCopiesByBook(bookId));
    }

    @PostMapping("/books/{bookId}")
    public ApiResponse<BookCopyResponseDTO> createCopy(
            @PathVariable Integer bookId,
            @RequestBody BookCopyRequestDTO request) {
        return ApiResponse.success(bookCopyService.createCopy(bookId, request));
    }

    @PutMapping("/{copyId}")
    public ApiResponse<BookCopyResponseDTO> updateCopy(
            @PathVariable Integer copyId,
            @RequestBody BookCopyRequestDTO request) {
        return ApiResponse.success(bookCopyService.updateCopy(copyId, request));
    }

    @DeleteMapping("/{copyId}")
    public ApiResponse<Void> deleteCopy(@PathVariable Integer copyId) {
        bookCopyService.deleteCopy(copyId);
        return ApiResponse.success(null);
    }
}
