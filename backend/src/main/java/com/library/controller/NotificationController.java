package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.dto.response.NotificationResponseDTO;
import com.library.service.CurrentUserService;
import com.library.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping("/me")
    public ApiResponse<List<NotificationResponseDTO>> getMyNotifications() {
        return ApiResponse.success(notificationService.getUserNotifications(currentUserService.getCurrentUserId()));
    }

    @GetMapping("/me/unread")
    public ApiResponse<List<NotificationResponseDTO>> getMyUnreadNotifications() {
        return ApiResponse.success(notificationService.getUnreadNotifications(currentUserService.getCurrentUserId()));
    }

    @PutMapping("/me/{notificationId}/read")
    public ApiResponse<Void> markMineAsRead(@PathVariable Integer notificationId) {
        notificationService.markAsReadForUser(notificationId, currentUserService.getCurrentUserId());
        return ApiResponse.success(null);
    }
}
