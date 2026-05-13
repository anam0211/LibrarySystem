package com.library.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.response.PendingKycUserResponseDTO;
import com.library.dto.response.UserKycResponseDTO;
import com.library.entity.NotificationType;
import com.library.service.NotificationService;
import com.library.service.UserKycService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/users")
@CrossOrigin("*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LIBRARIAN')")
public class AdminUserKycController {

    private final UserKycService userKycService;
    private final NotificationService notificationService;

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
        UserKycResponseDTO response = userKycService.approveKyc(userId);
        
        notificationService.createInApp(
                userId,
                NotificationType.GENERIC,
                "Xác thực hồ sơ thành công",
                "Hồ sơ e-KYC của bạn đã được duyệt. Chúc mừng bạn đã trở thành độc giả chính thức của thư viện.",
                null,
                null
        );
        
        return ApiResponse.success(response);
    }

    @PostMapping("/{userId}/reject-kyc")
    public ApiResponse<UserKycResponseDTO> rejectKyc(@PathVariable Integer userId) {
        UserKycResponseDTO response = userKycService.rejectKyc(userId);
        
        notificationService.createInApp(
                userId,
                NotificationType.GENERIC,
                "Hồ sơ xác thực bị từ chối",
                "Hồ sơ e-KYC của bạn không hợp lệ hoặc thiếu thông tin. Vui lòng vào trang Hồ sơ để cập nhật lại.",
                null,
                null
        );
        
        return ApiResponse.success(response);
    }
}
