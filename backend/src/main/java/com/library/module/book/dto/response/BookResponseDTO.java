package com.library.module.book.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookResponseDTO {
    Integer id;
    String isbn;
    String title;
    String subtitle;
    Integer publisherId;
    String publisherName;
    Integer publishYear;
    String languageCode;
    Integer pageCount;
    String description;
    String keywords;
    Integer stockTotal;
    Integer stockAvailable;
    String status;
    Boolean available;
    String primaryImageUrl;
    List<BookAuthorItemDTO> authors;
    List<BookCategoryItemDTO> categories;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
