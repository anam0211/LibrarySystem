package com.library.module.notification.repository;

import com.library.module.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    
    List<Notification> findByUserIdAndReadAtIsNull(Integer userId);
}