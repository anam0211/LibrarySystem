package com.library.service;

import com.library.common.response.PagedResult;
import com.library.dto.request.BookRequestDTO;
import com.library.dto.response.BookResponseDTO;
import com.library.service.book.BookCommandService;
import com.library.service.book.BookQueryService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookQueryService bookQueryService;
    private final BookCommandService bookCommandService;

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
        return bookQueryService.getBooks(
                keyword,
                authorId,
                categoryId,
                publisherId,
                publishYear,
                status,
                available,
                sortBy,
                sortDir,
                page,
                size);
    }

    public BookResponseDTO getBookById(Integer id) {
        return bookQueryService.getBookById(id);
    }

    public List<BookResponseDTO> getNewestBooks(int limit) {
        return bookQueryService.getNewestBooks(limit);
    }

    public List<BookResponseDTO> getFeaturedBooks(int limit) {
        return bookQueryService.getFeaturedBooks(limit);
    }

    public Map<String, List<BookResponseDTO>> getLeaderboards(int limit) {
        return bookQueryService.getLeaderboards(limit);
    }

    public BookResponseDTO create(BookRequestDTO requestDTO) {
        return bookCommandService.create(requestDTO);
    }

    public BookResponseDTO update(Integer id, BookRequestDTO requestDTO) {
        return bookCommandService.update(id, requestDTO);
    }

    public void delete(Integer id) {
        bookCommandService.delete(id);
    }
}
