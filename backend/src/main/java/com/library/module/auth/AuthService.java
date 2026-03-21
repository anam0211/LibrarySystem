package com.library.module.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.library.module.user.Role;
import com.library.module.user.UserEntity;
import com.library.module.user.UserRepository;
import com.library.module.user.UserStatus;
import com.library.security.JwtTokenProvider;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(AuthenticationManager authenticationManager, UserRepository userRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // Xử lý Đăng ký
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                // Băm mật khẩu trước khi lưu
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.READER) // Mặc định ai đăng ký cũng là Độc giả
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    // Xử lý Đăng nhập
    public AuthResponse login(LoginRequest request) {
        // 1. Xác thực tài khoản và mật khẩu (Spring Security sẽ tự động gọi CustomUserDetailsService)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Lưu trạng thái xác thực
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Sinh token
        String jwt = jwtTokenProvider.generateToken(request.getEmail());

        // 4. Lấy thông tin user để trả về kèm token
        UserEntity user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}