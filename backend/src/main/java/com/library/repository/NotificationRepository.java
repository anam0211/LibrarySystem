package com.library.repository;

import com.library.entity.Notification;
import com.library.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    
    List<Notification> findByUserIdAndReadAtIsNull(Integer userId);

    boolean existsByUserIdAndTypeAndRelatedLoanId(Integer userId, NotificationType type, Integer relatedLoanId);
}
