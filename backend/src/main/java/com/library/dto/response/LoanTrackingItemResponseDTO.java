package com.library.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoanTrackingItemResponseDTO {
    private Integer loanItemId;
    private Integer bookId;
    private String bookTitle;
    private Integer quantity;
    private String status;
}
