package com.library.module.notification.dto.response;

import com.library.module.notification.entity.NotificationChannel;
import com.library.module.notification.entity.NotificationStatus;
import com.library.module.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDTO {
    private Integer notificationId;
    private NotificationType type;
    private NotificationChannel channel;
    private String subject;
    private String body;
    private Integer relatedLoanId;
    private Integer relatedBookId;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private NotificationStatus status;
    private LocalDateTime createdAt;
}