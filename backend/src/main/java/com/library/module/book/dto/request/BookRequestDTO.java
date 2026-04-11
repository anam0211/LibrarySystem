package com.library.module.book.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookRequestDTO {
    String isbn;
    String title;
    String subtitle;
    Integer publisherId;
    Integer publishYear;
    String languageCode;
    Integer pageCount;
    String description;
    String keywords;
    Integer stockTotal;
    Integer stockAvailable;
    String status;
    List<Integer> authorIds;
    List<Integer> categoryIds;
}
