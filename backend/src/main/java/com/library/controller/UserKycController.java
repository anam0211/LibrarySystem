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
import com.library.entity.Notification;
import com.library.entity.NotificationChannel;
import com.library.entity.NotificationType;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.entity.VerificationStatus;
import com.library.repository.NotificationRepository;
import com.library.repository.UserRepository;
import com.library.service.UserKycService;

import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserKycController {

    private final UserKycService userKycService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

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
        
        User user = userRepository.findByEmail(userEmail).orElse(null);
        VerificationStatus oldStatus = user != null ? user.getVerificationStatus() : null;

        UserKycResponseDTO response = userKycService.submitMyKyc(userEmail, request);

        // Cập nhật trạng thái người dùng sang PENDING để Admin có thể duyệt
        if (user != null && user.getVerificationStatus() != VerificationStatus.PENDING) {
            user.setVerificationStatus(VerificationStatus.PENDING);
            userRepository.save(user);
        }

        // Chỉ gửi thông báo nếu trạng thái cũ KHÔNG phải là PENDING
        if (user != null && oldStatus != VerificationStatus.PENDING) {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                Notification notif = new Notification();
                notif.setUserId(admin.getId());
                notif.setSubject("Yêu cầu xác thực e-KYC");
                notif.setBody("Bạn đọc " + user.getFullName() + " vừa gửi yêu cầu xác thực hồ sơ KYC. Vui lòng kiểm tra.");
                notif.setType(NotificationType.GENERIC);
                notif.setChannel(NotificationChannel.INAPP);
                notif.setScheduledAt(LocalDateTime.now());
                notificationRepository.save(notif);
            }
        }

        return ApiResponse.success(
                "Đã gửi hồ sơ xác thực thành công.",
                response
        );
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/kyc")
    public ApiResponse<UserKycResponseDTO> updateMyKyc(@RequestBody UserKycRequestDTO request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        
        User user = userRepository.findByEmail(userEmail).orElse(null);
        VerificationStatus oldStatus = user != null ? user.getVerificationStatus() : null;

        UserKycResponseDTO response = userKycService.submitMyKyc(userEmail, request);

        // Cập nhật trạng thái người dùng sang PENDING để Admin có thể duyệt
        if (user != null && user.getVerificationStatus() != VerificationStatus.PENDING) {
            user.setVerificationStatus(VerificationStatus.PENDING);
            userRepository.save(user);
        }

        // Gửi thông báo cho lần gửi lại sau khi bị hủy (Cancel)
        if (user != null && oldStatus != VerificationStatus.PENDING) {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                Notification notif = new Notification();
                notif.setUserId(admin.getId());
                notif.setSubject("Yêu cầu xác thực e-KYC");
                notif.setBody("Bạn đọc " + user.getFullName() + " vừa cập nhật và gửi yêu cầu xác thực KYC. Vui lòng kiểm tra.");
                notif.setType(NotificationType.GENERIC);
                notif.setChannel(NotificationChannel.INAPP);
                notif.setScheduledAt(LocalDateTime.now());
                notificationRepository.save(notif);
            }
        }

        return ApiResponse.success(
                "Đã cập nhật hồ sơ xác thực thành công.",
                response
        );
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/kyc/cancel")
    public ApiResponse<String> cancelMyKyc() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        user.setVerificationStatus(VerificationStatus.UNVERIFIED);
        userRepository.save(user);
        return ApiResponse.success("Đã hủy xác thực hồ sơ.");
    }
}
