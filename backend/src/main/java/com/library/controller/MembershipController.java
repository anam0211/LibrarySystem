package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.entity.User;
import com.library.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @PostMapping("/upgrade/{userId}")
    public ApiResponse<Map<String, Object>> upgradeToPremium(@PathVariable Integer userId) {
        User upgradedUser = membershipService.upgradeToPremium(userId);
        
        return ApiResponse.success(Map.of(
                "message", "Nâng cấp gói Premium thành công!",
                "validUntil", upgradedUser.getPremiumValidUntil()
        ));
    }
}