package com.library.service;

import com.library.entity.Membership;
import com.library.entity.User;
import com.library.config.MembershipProperties;
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
    private final MembershipProperties membershipProperties;

    public List<Membership> getAllMemberships() {
        return membershipRepository.findAll();
    }

    @Transactional
    public Membership createMembership(Membership request) {
        if (membershipRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Mã gói hội viên đã tồn tại!");
        }
        return membershipRepository.save(request);
    }

    @Transactional
    public Membership updateMembership(Integer id, Membership request) {
        Membership existing = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói hội viên!"));
        
        if (!existing.getCode().equals(request.getCode()) && membershipRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Mã gói hội viên mới đã bị trùng với một gói khác!");
        }

        existing.setCode(request.getCode());
        existing.setName(request.getName());
        existing.setPricePerMonth(request.getPricePerMonth());
        existing.setMaxBorrowLimit(request.getMaxBorrowLimit());
        existing.setDeliveryFee(request.getDeliveryFee());
        existing.setPriorityProcessing(request.getPriorityProcessing());
        existing.setBenefitsDescription(request.getBenefitsDescription());

        return membershipRepository.save(existing);
    }

    @Transactional
    public void deleteMembership(Integer id) {
        Membership existing = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói hội viên!"));
        membershipRepository.delete(existing);
    }

    @Transactional
    public User subscribeMembership(Integer userId, Integer membershipId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Membership targetPlan;
        if (membershipId != null) {
            targetPlan = membershipRepository.findById(membershipId)
                    .orElseThrow(() -> new RuntimeException("Gói hội viên không tồn tại"));
        } else {
            String defaultPaidCode = normalizeCode(membershipProperties.getDefaultPaidCode());
            targetPlan = membershipRepository.findByCode(defaultPaidCode)
                    .orElseThrow(() -> new RuntimeException("Gói hội viên mặc định chưa được cấu hình: " + defaultPaidCode));
        }

        user.setMembership(targetPlan);
        
        // Gia hạn thêm 30 ngày từ hôm nay (hoặc cộng dồn nếu đang còn hạn)
        if (user.getPremiumValidUntil() != null && user.getPremiumValidUntil().isAfter(LocalDate.now())) {
            user.setPremiumValidUntil(user.getPremiumValidUntil().plusDays(membershipProperties.getSubscriptionDays()));
        } else {
            user.setPremiumValidUntil(LocalDate.now().plusDays(membershipProperties.getSubscriptionDays()));
        }

        return userRepository.save(user);
    }

    @Scheduled(cron = "0 0 0 * * ?") // Tự động chạy ngầm vào 00:00 mỗi ngày
    @Transactional
    public void downgradeExpiredPremiumUsers() {
        List<User> expiredUsers = userRepository.findByPremiumValidUntilBefore(LocalDate.now());
        
        if (!expiredUsers.isEmpty()) {
            String freeCode = normalizeCode(membershipProperties.getFreeCode());
            Membership freePlan = membershipRepository.findByCode(freeCode)
                    .orElseThrow(() -> new RuntimeException("Gói miễn phí chưa được cấu hình: " + freeCode));
            
            for (User user : expiredUsers) {
                user.setMembership(freePlan);
                user.setPremiumValidUntil(null);
            }
            userRepository.saveAll(expiredUsers);
            log.info("Đã hạ cấp {} tài khoản hết hạn hội viên về gói {}.", expiredUsers.size(), freeCode);
        }
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }
}
