package com.library.module.book.entity;

import com.library.common.base.BaseAuditEntity;
import com.library.module.publisher.entity.Publisher;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "books")
public class Book extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Integer id;

    @Column(name = "isbn", length = 20)
    private String isbn;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "subtitle", length = 500)
    private String subtitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    @Column(name = "publish_year")
    private Integer publishYear;

    @Column(name = "language_code", length = 10)
    private String languageCode;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "description", columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "keywords", columnDefinition = "nvarchar(max)")
    private String keywords;

    @Column(name = "stock_total", nullable = false)
    private Integer stockTotal = 0;

    @Column(name = "stock_available", nullable = false)
    private Integer stockAvailable = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BookStatus status = BookStatus.ACTIVE;
}