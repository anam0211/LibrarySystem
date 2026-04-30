package com.library.dto.request;

import lombok.Data;

@Data
public class VerificationRequest {
    private String email;
    private String phone;
    private String address;
    private String idCardNumber;
    private String idCardImageUrl;
}
