package com.library.dto.request;

import lombok.Data;

@Data
public class ReservationRequestDTO {
    private Integer bookId;
    private String pickupDate;
    private String deliveryMethod;
    private String deliveryAddress;
    private String deliveryPhone;
}
