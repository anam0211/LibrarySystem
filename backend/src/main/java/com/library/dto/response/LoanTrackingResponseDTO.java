package com.library.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoanTrackingResponseDTO {
    private Integer loanId;
    private String status;
    private String deliveryMethod;
    private String address;
    private String phone;
    private String trackingCode;
    private LocalDateTime createdAt;
    private LocalDateTime loanedAt;
    private LocalDateTime dueAt;
    private LocalDateTime returnRequestedAt;
    private LocalDateTime closedAt;
    private List<LoanTrackingItemResponseDTO> items;
}
