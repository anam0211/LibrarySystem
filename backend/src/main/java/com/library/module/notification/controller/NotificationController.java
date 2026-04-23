package com.library.module.notification.controller;

import com.library.common.response.ApiResponse;
import com.library.module.notification.dto.response.NotificationResponseDTO;
import com.library.module.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ApiResponse<List<NotificationResponseDTO>> getUserNotifications(@PathVariable Integer userId) {
        List<NotificationResponseDTO> notifications = notificationService.getUserNotifications(userId);
        return ApiResponse.success(notifications);
    }

    @GetMapping("/user/{userId}/unread")
    public ApiResponse<List<NotificationResponseDTO>> getUnreadNotifications(@PathVariable Integer userId) {
        List<NotificationResponseDTO> unreadNotifications = notificationService.getUnreadNotifications(userId);
        return ApiResponse.success(unreadNotifications);
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Integer notificationId) {
        notificationService.markAsRead(notificationId);
        return ApiResponse.success(null);
    }
}