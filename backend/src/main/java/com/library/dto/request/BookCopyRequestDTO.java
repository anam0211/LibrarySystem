package com.library.dto.request;

import com.library.entity.BookCopyCondition;
import com.library.entity.BookCopyStatus;
import lombok.Data;

@Data
public class BookCopyRequestDTO {
    private String barcode;
    private BookCopyStatus status;
    private BookCopyCondition condition;
}
