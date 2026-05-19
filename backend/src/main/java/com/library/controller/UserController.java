package com.library.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.entity.User;
import com.library.entity.UserStatus;
import com.library.entity.Role;
import com.library.entity.Membership;
import com.library.repository.UserRepository;
import com.library.repository.MembershipRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    public UserController(UserRepository userRepository, MembershipRepository membershipRepository) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung!"));

        return ResponseEntity.ok(toUserResponse(user));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung voi ID nay!"));

        userRepository.delete(user);
        return ResponseEntity.ok("Da xoa tai khoan nguoi dung thanh cong!");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung voi ID nay!"));

        if (request.get("fullName") != null) {
            user.setFullName((String) request.get("fullName"));
        }
        if (request.get("email") != null) {
            user.setEmail((String) request.get("email"));
        }
        if (request.get("phone") != null) {
            user.setPhone((String) request.get("phone"));
        }
        if (request.get("role") != null) {
            user.setRole(Role.valueOf((String) request.get("role")));
        }
        if (request.containsKey("membershipId") && request.get("membershipId") != null) {
            Integer membershipId = Integer.valueOf(request.get("membershipId").toString());
            Membership membership = membershipRepository.findById(membershipId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay goi hoi vien!"));
            user.setMembership(membership);
        }

        userRepository.save(user);

        return ResponseEntity.ok("Da cap nhat thong tin nguoi dung thanh cong!");
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung voi ID nay!"));

        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        return ResponseEntity.ok("Da khoa tai khoan nguoi dung thanh cong!");
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung voi ID nay!"));

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return ResponseEntity.ok("Da mo khoa tai khoan nguoi dung thanh cong!");
    }

    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("fullName", user.getFullName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("verificationEmail", firstNonBlank(user.getVerificationEmail(), user.getEmail()));
        userData.put("verificationPhone", firstNonBlank(user.getVerificationPhone(), user.getPhone()));
        userData.put("verificationAddress", user.getVerificationAddress());
        userData.put("verificationStatus",
                user.getVerificationStatus() != null ? user.getVerificationStatus().name() : null);
        userData.put("idCardNumber", user.getIdCardNumber());
        userData.put("idCardImageUrl", user.getIdCardImageUrl());
        userData.put("role", user.getRole() != null ? user.getRole().name() : null);
        userData.put("status", user.getStatus() != null ? user.getStatus().name() : null);
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());

        if (user.getMembership() != null) {
            userData.put("membershipCode", user.getMembership().getCode());
            userData.put("membershipName", user.getMembership().getName());
        } else {
            userData.put("membershipCode", "FREE");
            userData.put("membershipName", "Goi mien phi");
        }
        userData.put("premiumValidUntil", user.getPremiumValidUntil());

        if (user.getRole() != null) {
            userData.put("role", user.getRole().name());
        }

        return userData;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalizedValue = normalize(value);
            if (normalizedValue != null) {
                return normalizedValue;
            }
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
