package com.library.dto.request;

import lombok.Data;

@Data
public class UserAddressRequest {
    private String fullName;
    private String phoneNumber;
    private String addressLine;
    private Boolean defaultAddress;
}
