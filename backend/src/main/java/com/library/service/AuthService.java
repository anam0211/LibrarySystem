package com.library.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.library.config.MembershipProperties;
import com.library.dto.request.LoginRequest;
import com.library.dto.request.RegisterRequest;
import com.library.dto.response.AuthResponse;
import com.library.entity.Membership;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.entity.UserStatus;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;
import com.library.security.JwtTokenProvider;


@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final MembershipRepository membershipRepository;
    private final MembershipProperties membershipProperties;

    public AuthService(@Lazy AuthenticationManager authenticationManager, UserRepository userRepository,
                      @Lazy PasswordEncoder passwordEncoder,@Lazy JwtTokenProvider jwtTokenProvider,
                      MembershipRepository membershipRepository,
                      MembershipProperties membershipProperties) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.membershipRepository = membershipRepository;
        this.membershipProperties = membershipProperties;
    }

    // Xử lý Đăng ký
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        String freeCode = normalizeCode(membershipProperties.getFreeCode());
        Membership freePlan = membershipRepository.findByCode(freeCode)
                .orElseThrow(() -> new RuntimeException("Gói miễn phí chưa được cấu hình trong hệ thống: " + freeCode));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                // Băm mật khẩu trước khi lưu
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.READER) // Mặc định ai đăng ký cũng là Độc giả
                .status(UserStatus.ACTIVE)
                .membership(freePlan)
                .build();

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    // Xử lý Đăng nhập
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // 1. Xác thực tài khoản và mật khẩu (Spring Security sẽ tự động gọi CustomUserDetailsService)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Lưu trạng thái xác thực
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Sinh token
        String jwt = jwtTokenProvider.generateToken(request.getEmail());

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }
}
