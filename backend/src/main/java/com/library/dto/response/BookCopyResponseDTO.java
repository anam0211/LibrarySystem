package com.library.dto.response;

import com.library.entity.BookCopyCondition;
import com.library.entity.BookCopyStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookCopyResponseDTO {
    private Integer id;
    private Integer bookId;
    private String bookTitle;
    private String barcode;
    private BookCopyStatus status;
    private BookCopyCondition condition;
    private LocalDateTime createdAt;
}
