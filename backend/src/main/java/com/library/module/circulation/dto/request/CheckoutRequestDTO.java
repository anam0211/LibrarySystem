package com.library.module.circulation.dto.request;

import java.util.List;
import lombok.Data;

@Data
public class CheckoutRequestDTO {
    private Integer borrowerId; 
    private Integer dueDays;    
    private List<CheckoutItem> items; 

    @Data
    public static class CheckoutItem {
        private Integer bookId;
        private Integer qty;
    }
}