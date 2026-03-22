package com.library.module.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
        // Màng lọc JwtAuthenticationFilter đã kiểm tra Token và lưu thông tin vào SecurityContext
        // Bây giờ chúng ta chỉ cần lôi nó ra dùng:
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Lấy ra email của người đang gửi request
        String currentEmail = authentication.getName(); 
        
        // Trả về một lời chào để chứng minh API đã được gọi thành công
        String message = "Tuyệt vời! " + currentEmail + " đã vượt qua màng lọc bảo mật bằng Token hợp lệ.";
        
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        // 1. Tìm user theo ID
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID này!"));

        // 2. Xóa mềm: Chuyển trạng thái sang INACTIVE (Khóa tài khoản)
        // Lưu ý: Đảm bảo enum UserStatus của bạn có giá trị INACTIVE hoặc BANNED
        user.setStatus(UserStatus.SUSPENDED); 
        userRepository.save(user);

        return ResponseEntity.ok("Đã khóa (xóa mềm) tài khoản người dùng thành công!");
    }
}