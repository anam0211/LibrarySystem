package com.library.module.book.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
@Embeddable
public class BookCategoryId implements Serializable {

    @Column(name = "book_id")
    private Integer bookId;

    @Column(name = "category_id")
    private Integer categoryId;
}