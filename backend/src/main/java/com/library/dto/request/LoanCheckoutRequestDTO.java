package com.library.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class LoanCheckoutRequestDTO {
    private List<Integer> bookIds;
    private List<CheckoutItem> items;
    private String deliveryMethod;
    private String address;
    private String phone;

    @Data
    public static class CheckoutItem {
        private Integer bookId;
        private Integer qty;
    }
}
