package com.library.dto.request;

import java.math.BigDecimal;

import com.library.entity.FineReason;

import lombok.Data;

@Data
public class FineRequest {
    private Integer userId;
    private Integer loanId;
    private BigDecimal amount;
    private FineReason reason;
}
