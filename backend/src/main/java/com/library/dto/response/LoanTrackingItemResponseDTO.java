package com.library.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoanTrackingItemResponseDTO {
    private Integer loanItemId;
    private Integer bookId;
    private String bookTitle;
    private Integer copyId;
    private String copyBarcode;
    private String copyStatus;
    private String copyCondition;
    private Integer quantity;
    private String status;
}
