package com.library.module.report.catalog.service;

import com.library.module.author.entity.Author;
import com.library.module.author.repository.AuthorRepository;
import com.library.module.book.repository.BookAuthorRepository;
import com.library.module.book.repository.BookCategoryRepository;
import com.library.module.book.repository.BookRepository;
import com.library.module.book.service.BookService;
import com.library.module.category.entity.Category;
import com.library.module.category.repository.CategoryRepository;
import com.library.module.publisher.repository.PublisherRepository;
import com.library.module.report.catalog.dto.CatalogMetricItemDTO;
import com.library.module.report.catalog.dto.CatalogOverviewResponseDTO;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CatalogReportService {
    BookRepository bookRepository;
    AuthorRepository authorRepository;
    CategoryRepository categoryRepository;
    PublisherRepository publisherRepository;
    BookAuthorRepository bookAuthorRepository;
    BookCategoryRepository bookCategoryRepository;
    BookService bookService;

    public CatalogOverviewResponseDTO getOverview() {
        Map<Integer, Author> authorMap = authorRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Author::getId, Function.identity()));
        Map<Integer, Category> categoryMap = categoryRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));

        List<CatalogMetricItemDTO> booksByCategory = bookCategoryRepository.countBooksByCategory()
                .stream()
                .map(row -> CatalogMetricItemDTO.builder()
                        .id((Integer) row[0])
                        .label(categoryMap.containsKey((Integer) row[0]) ? categoryMap.get((Integer) row[0]).getName() : "Khong xac dinh")
                        .value((Long) row[1])
                        .build())
                .toList();

        List<CatalogMetricItemDTO> topAuthors = bookAuthorRepository.countBooksByAuthor()
                .stream()
                .map(row -> CatalogMetricItemDTO.builder()
                        .id((Integer) row[0])
                        .label(authorMap.containsKey((Integer) row[0]) ? authorMap.get((Integer) row[0]).getName() : "Khong xac dinh")
                        .value((Long) row[1])
                        .build())
                .toList();

        List<CatalogMetricItemDTO> topCategories = booksByCategory.stream().limit(5).toList();

        return CatalogOverviewResponseDTO.builder()
                .totalBooks(bookRepository.count())
                .totalAuthors(authorRepository.count())
                .totalCategories(categoryRepository.count())
                .totalPublishers(publisherRepository.count())
                .inStockBooks(bookRepository.countByStockAvailableGreaterThan(0))
                .outOfStockBooks(bookRepository.countByStockAvailableLessThanEqual(0))
                .booksByCategory(booksByCategory)
                .topAuthors(topAuthors)
                .topCategories(topCategories)
                .newestBooks(bookService.getNewestBooks(6))
                .featuredBooks(bookService.getFeaturedBooks(6))
                .build();
    }
}
