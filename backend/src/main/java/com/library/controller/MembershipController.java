package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.entity.Membership;
import com.library.entity.User;
import com.library.service.MembershipService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @PostMapping("/subscription/{userId}")
    public ApiResponse<Map<String, Object>> subscribeMembership(
            @PathVariable Integer userId,
            @RequestParam(required = false) Integer membershipId) {
        User upgradedUser = membershipService.subscribeMembership(userId, membershipId);
        
        return ApiResponse.success(Map.of(
                "message", "Đăng ký gói thành công!",
                "validUntil", upgradedUser.getPremiumValidUntil()
        ));
    }

    @GetMapping
    public ResponseEntity<?> getAllMemberships() {
        return ResponseEntity.ok(membershipService.getAllMemberships());
    }

    @PostMapping
    public ResponseEntity<?> createMembership(@RequestBody Membership request) {
        return ResponseEntity.ok(membershipService.createMembership(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMembership(@PathVariable Integer id, @RequestBody Membership request) {
        return ResponseEntity.ok(membershipService.updateMembership(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMembership(@PathVariable Integer id) {
        membershipService.deleteMembership(id);
        return ResponseEntity.ok("Đã xóa gói hội viên thành công!");
    }
}