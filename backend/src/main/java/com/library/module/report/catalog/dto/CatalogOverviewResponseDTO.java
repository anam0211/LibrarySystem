package com.library.module.report.catalog.dto;

import com.library.module.book.dto.response.BookResponseDTO;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CatalogOverviewResponseDTO {
    Long totalBooks;
    Long totalAuthors;
    Long totalCategories;
    Long totalPublishers;
    Long inStockBooks;
    Long outOfStockBooks;
    List<CatalogMetricItemDTO> booksByCategory;
    List<CatalogMetricItemDTO> topAuthors;
    List<CatalogMetricItemDTO> topCategories;
    List<BookResponseDTO> newestBooks;
    List<BookResponseDTO> featuredBooks;
}
