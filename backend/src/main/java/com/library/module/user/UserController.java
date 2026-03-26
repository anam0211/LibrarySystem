package com.library.module.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        UserEntity user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        // Đóng gói thành dạng JSON
        java.util.Map<String, Object> userData = new java.util.HashMap<>();
        userData.put("fullName", user.getFullName());
        userData.put("email", user.getEmail());
        
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
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        userRepository.delete(user);
        return ResponseEntity.ok("Đã xóa tài khoản người dùng thành công!");
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        user.setStatus(UserStatus.SUSPENDED); 
        userRepository.save(user);

        return ResponseEntity.ok("Đã khóa tài khoản người dùng thành công!");
    }
}