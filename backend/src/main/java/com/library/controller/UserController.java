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

import com.library.dto.request.VerificationRequest;
import com.library.entity.User;
import com.library.entity.UserStatus;
import com.library.entity.VerificationStatus;
import com.library.repository.UserRepository;

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
        
        // Trả về Role (String)
        userData.put("role", user.getRole().name()); // Thêm .name() nếu Role của bạn là Enum
        
        return ResponseEntity.ok(userData);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        // Lấy toàn bộ dữ liệu trong bảng users (SELECT * FROM users)
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        userRepository.delete(user);
        return ResponseEntity.ok("Đã xóa tài khoản người dùng thành công!");
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        user.setStatus(UserStatus.SUSPENDED); 
        userRepository.save(user);

        return ResponseEntity.ok("Đã khóa tài khoản người dùng thành công!");
    }
    @PutMapping("/{id}/verification/request")
    public ResponseEntity<?> requestVerification(@PathVariable Integer id, @RequestBody VerificationRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung."));

        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            return ResponseEntity.badRequest().body("Hồ sơ đã được xác thực, bạn đọc không thể chỉnh sửa thông tin.");
        }

        if (request == null) {
            return ResponseEntity.badRequest().body("Dữ liệu xác thực không được để trống.");
        }

        String nextImageUrl = firstNonBlank(normalize(request.getIdCardImageUrl()), user.getIdCardImageUrl());
        if (normalize(nextImageUrl) == null) {
            return ResponseEntity.badRequest().body("Ảnh CCCD là bắt buộc.");
        }

        user.setVerificationEmail(firstNonBlank(normalize(request.getEmail()), user.getVerificationEmail(), user.getEmail()));
        user.setVerificationPhone(firstNonBlank(normalize(request.getPhone()), user.getVerificationPhone(), user.getPhone()));
        user.setVerificationAddress(firstNonBlank(normalize(request.getAddress()), user.getVerificationAddress()));
        user.setIdCardNumber(firstNonBlank(normalize(request.getIdCardNumber()), user.getIdCardNumber()));
        user.setIdCardImageUrl(nextImageUrl);
        user.setVerificationStatus(VerificationStatus.PENDING);
        userRepository.save(user);

        return ResponseEntity.ok("Đã lưu hồ sơ xác thực thành công.");
    }

    @PutMapping("/{id}/verification/approve")
    public ResponseEntity<?> approveVerification(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung."));

        if (normalize(user.getIdCardImageUrl()) == null) {
            return ResponseEntity.badRequest().body("Người dùng chưa gửi ảnh CCCD.");
        }

        user.setVerificationStatus(VerificationStatus.VERIFIED);
        userRepository.save(user);

        return ResponseEntity.ok("Đã duyệt hồ sơ xác thực.");
    }

    @PutMapping("/{id}/verification/reject")
    public ResponseEntity<?> rejectVerification(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung."));

        user.setVerificationStatus(VerificationStatus.UNVERIFIED);
        userRepository.save(user);

        return ResponseEntity.ok("Da tu choi ho so xac thuc.");
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
