package com.library.service;

import com.library.entity.Membership;
import com.library.entity.MembershipType;
import com.library.entity.User;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipService {

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    @Transactional
    public User upgradeToPremium(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Membership premiumPlan = membershipRepository.findByCode(MembershipType.PREMIUM)
                .orElseThrow(() -> new RuntimeException("Gói Premium chưa được cấu hình"));

        user.setMembership(premiumPlan);
        
        // Gia hạn thêm 30 ngày từ hôm nay (hoặc cộng dồn nếu đang còn hạn)
        if (user.getPremiumValidUntil() != null && user.getPremiumValidUntil().isAfter(LocalDate.now())) {
            user.setPremiumValidUntil(user.getPremiumValidUntil().plusDays(30));
        } else {
            user.setPremiumValidUntil(LocalDate.now().plusDays(30));
        }

        return userRepository.save(user);
    }

    @Scheduled(cron = "0 0 0 * * ?") // Tự động chạy ngầm vào 00:00 mỗi ngày
    @Transactional
    public void downgradeExpiredPremiumUsers() {
        List<User> expiredUsers = userRepository.findByMembership_CodeAndPremiumValidUntilBefore(
                MembershipType.PREMIUM, LocalDate.now());
        
        if (!expiredUsers.isEmpty()) {
            Membership freePlan = membershipRepository.findByCode(MembershipType.FREE)
                    .orElseThrow(() -> new RuntimeException("Gói Free chưa được cấu hình"));
            
            for (User user : expiredUsers) {
                user.setMembership(freePlan);
                user.setPremiumValidUntil(null);
            }
            userRepository.saveAll(expiredUsers);
            log.info("Đã hạ cấp {} tài khoản hết hạn Premium về gói Free.", expiredUsers.size());
        }
    }
}