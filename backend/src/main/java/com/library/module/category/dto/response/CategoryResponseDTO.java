package com.library.module.category.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@NoArgsConstructor
@AllArgsConstructor
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryResponseDTO {
    Integer id;
    String name;
    Integer parentId;
    String parentName;
    Long childCount;
    Long bookCount;
    LocalDateTime createdAt;
}
