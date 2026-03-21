package com.library.security;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.library.module.user.UserEntity;
import com.library.module.user.UserRepository;
import com.library.module.user.UserStatus;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Tiêm UserRepository vào thông qua Constructor
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Tìm user trong cơ sở dữ liệu bằng email
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        // 2. Chuyển đổi Role của bạn thành Authority của Spring Security
        // Quy tắc chuẩn: Spring Security yêu cầu thêm tiền tố "ROLE_" phía trước tên quyền
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        // 3. Kiểm tra xem tài khoản có đang bị SUSPENDED không
        boolean isActive = user.getStatus() == UserStatus.ACTIVE;

        // 4. Trả về đối tượng UserDetails mặc định của Spring
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail()) // Hệ thống Spring gọi là "username", nhưng ta dùng email
                .password(user.getPasswordHash()) // Cung cấp mật khẩu đã mã hóa từ DB
                .authorities(Collections.singletonList(authority)) // Cấp quyền
                .disabled(!isActive) // Nếu status không phải ACTIVE, Spring sẽ cấm đăng nhập ngay lập tức
                .build();
    }
}