package com.library.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MediaAssetResponseDTO {
    Integer id;
    Integer bookId;
    String bookTitle;
    String fileName;
    String fileUrl;
    String assetType;
    Boolean primary;
    LocalDateTime createdAt;
}
