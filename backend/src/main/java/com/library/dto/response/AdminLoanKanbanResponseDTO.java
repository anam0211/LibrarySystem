package com.library.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminLoanKanbanResponseDTO {
    private Integer loanId;
    private Integer borrowerId;
    private String borrowerName;
    private String borrowerEmail;
    private String status;
    private String deliveryMethod;
    private String address;
    private String phone;
    private String trackingCode;
    private LocalDateTime createdAt;
    private String note;
    private List<LoanTrackingItemResponseDTO> items;
}
