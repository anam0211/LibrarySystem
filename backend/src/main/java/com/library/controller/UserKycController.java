package com.library.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.library.common.response.ApiResponse;
import com.library.dto.request.UserKycRequestDTO;
import com.library.dto.response.UserKycResponseDTO;
import com.library.service.UserKycService;

import lombok.RequiredArgsConstructor;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserKycController {

    private final UserKycService userKycService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/kyc")
    public ApiResponse<UserKycResponseDTO> getMyKyc() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.success("Đã lấy thông tin xác thực.", userKycService.getMyKyc(userEmail));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/kyc")
    public ApiResponse<UserKycResponseDTO> submitMyKyc(@RequestBody UserKycRequestDTO request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.success(
                "Đã gửi hồ sơ xác thực thành công.",
                userKycService.submitMyKyc(userEmail, request)
        );
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/kyc")
    public ApiResponse<UserKycResponseDTO> updateMyKyc(@RequestBody UserKycRequestDTO request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.success(
                "Đã cập nhật hồ sơ xác thực thành công.",
                userKycService.submitMyKyc(userEmail, request)
        );
    }
}
