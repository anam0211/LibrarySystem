package com.library.module.circulation.dto.request;

import lombok.Data;

@Data
public class ReservationRequestDTO {
    private Integer bookId;
    private String pickupDate;
}