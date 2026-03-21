package com.library.module.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

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
}