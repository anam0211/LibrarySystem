package com.library.dto.request;

import lombok.Data;

@Data
public class LoanStatusUpdateRequestDTO {
    private String newStatus;
    private String trackingCode;
}
