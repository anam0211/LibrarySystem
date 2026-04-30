package com.library.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class LoanCheckoutRequestDTO {
    private List<Integer> bookIds;
    private String deliveryMethod;
    private String address;
    private String phone;
}
