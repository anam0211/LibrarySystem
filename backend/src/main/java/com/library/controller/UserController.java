package com.library.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.entity.UserStatus;
import com.library.entity.VerificationStatus;
import com.library.repository.UserRepository;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Lấy email user
        String currentEmail = authentication.getName(); 
        
        // Lấy dữ liệu thật từ Database
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        // Đóng gói thành dạng JSON
        java.util.Map<String, Object> userData = new java.util.HashMap<>();
        userData.put("id", user.getId());
        userData.put("fullName", user.getFullName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("verificationEmail", firstNonBlank(user.getVerificationEmail(), user.getEmail()));
        userData.put("verificationPhone", firstNonBlank(user.getVerificationPhone(), user.getPhone()));
        userData.put("verificationAddress", user.getVerificationAddress());
        userData.put("verificationStatus", user.getVerificationStatus().name());
        userData.put("idCardNumber", user.getIdCardNumber());
        userData.put("idCardImageUrl", user.getIdCardImageUrl());
        
        // Thêm thông tin Gói hội viên
        if (user.getMembership() != null) {
            userData.put("membershipCode", user.getMembership().getCode());
            userData.put("membershipName", user.getMembership().getName());
        }
        userData.put("premiumValidUntil", user.getPremiumValidUntil());

        // Trả về Role (String)
        userData.put("role", user.getRole().name()); // Thêm .name() nếu Role của bạn là Enum
        
        return ResponseEntity.ok(userData);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        // Tránh trả về trực tiếp Entity User để không bị lỗi Infinite Recursion (Vòng lặp vô hạn) của Jackson
        List<User> users = userRepository.findAll();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        
        for (User user : users) {
            java.util.Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("id", user.getId());
            userData.put("fullName", user.getFullName());
            userData.put("email", user.getEmail());
            userData.put("phone", user.getPhone());
            
            if (user.getRole() != null) userData.put("role", user.getRole().name());
            if (user.getStatus() != null) userData.put("status", user.getStatus().name());
            if (user.getVerificationStatus() != null) {
                userData.put("verificationStatus", user.getVerificationStatus().name());
            }
            
            if (user.getMembership() != null) {
                userData.put("membershipCode", user.getMembership().getCode());
                userData.put("membershipName", user.getMembership().getName());
            }
            userData.put("premiumValidUntil", user.getPremiumValidUntil());
            
            // Sử dụng Reflection để lấy createdAt an toàn tránh lỗi biên dịch nếu User.java không có hàm này
            try {
                userData.put("createdAt", user.getClass().getMethod("getCreatedAt").invoke(user));
            } catch (Exception e) {
                // Bỏ qua nếu không có
            }
            
            result.add(userData);
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        userRepository.delete(user);
        return ResponseEntity.ok("Đã xóa tài khoản người dùng thành công!");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody User request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null) user.setRole(request.getRole());
        
        if (request.getMembership() != null) {
            user.setMembership(request.getMembership());
        }

        userRepository.save(user);
        
        return ResponseEntity.ok("Đã cập nhật thông tin người dùng thành công!");
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        user.setStatus(UserStatus.SUSPENDED); 
        userRepository.save(user);

        return ResponseEntity.ok("Đã khóa tài khoản người dùng thành công!");
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return ResponseEntity.ok("Đã mở khóa tài khoản người dùng thành công!");
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
