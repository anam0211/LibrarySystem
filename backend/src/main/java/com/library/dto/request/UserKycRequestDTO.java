package com.library.dto.request;

import lombok.Data;

@Data
public class UserKycRequestDTO {
    private String email;
    private String phone;
    private String address;
    private String idCardNumber;
    private String idCardImageBase64;
    private String idCardImageUrl;
}
