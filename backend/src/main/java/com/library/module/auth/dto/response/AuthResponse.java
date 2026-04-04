package com.library.module.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor

public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private String email;
    private String fullName;
    private String role;
}