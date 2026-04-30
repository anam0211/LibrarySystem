package com.library.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
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
    BigDecimal originalPrice;
    String status;
    List<Integer> authorIds;
    List<Integer> categoryIds;
}
