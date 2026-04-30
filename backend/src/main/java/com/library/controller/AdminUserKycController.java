package com.library.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.response.PendingKycUserResponseDTO;
import com.library.dto.response.UserKycResponseDTO;
import com.library.service.UserKycService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class AdminUserKycController {

    private final UserKycService userKycService;

    @GetMapping("/kyc")
    public ApiResponse<List<PendingKycUserResponseDTO>> getKycUsers() {
        return ApiResponse.success(userKycService.getKycUsers());
    }

    @GetMapping("/pending-kyc")
    public ApiResponse<List<PendingKycUserResponseDTO>> getPendingKycUsers() {
        return ApiResponse.success(userKycService.getPendingKycUsers());
    }

    @PostMapping("/{userId}/approve-kyc")
    public ApiResponse<UserKycResponseDTO> approveKyc(@PathVariable Integer userId) {
        return ApiResponse.success(userKycService.approveKyc(userId));
    }

    @PostMapping("/{userId}/reject-kyc")
    public ApiResponse<UserKycResponseDTO> rejectKyc(@PathVariable Integer userId) {
        return ApiResponse.success(userKycService.rejectKyc(userId));
    }
}
