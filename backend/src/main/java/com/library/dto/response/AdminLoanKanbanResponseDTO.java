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
    private LocalDateTime loanedAt;
    private LocalDateTime dueAt;
    private LocalDateTime returnRequestedAt;
    private String borrowerCardCode;
    private String borrowerStudentCode;
    private String borrowerMembershipCode;
    private String borrowerMembershipName;
    private Boolean priorityProcessing;
    private String note;
    private List<LoanTrackingItemResponseDTO> items;
}
