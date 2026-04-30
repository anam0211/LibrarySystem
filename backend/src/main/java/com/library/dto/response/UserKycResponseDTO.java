package com.library.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserKycResponseDTO {
    private Integer userId;
    private String fullName;
    private String accountEmail;
    private String email;
    private String phone;
    private String address;
    private String idCardNumber;
    private String verificationStatus;
    private String idCardImageUrl;
    private Boolean canEdit;
    private Boolean canResubmit;
    private Boolean adminApprovalEnabled;
    private LocalDateTime updatedAt;
}
