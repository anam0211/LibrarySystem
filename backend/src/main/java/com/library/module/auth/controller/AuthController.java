package com.library.module.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.module.auth.dto.request.LoginRequest;
import com.library.module.auth.dto.request.RegisterRequest;
import com.library.module.auth.dto.response.AuthResponse;
import com.library.module.auth.service.AuthService; // Nhớ import ApiResponse

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            String message = authService.register(request);
            // Gói kết quả vào ApiResponse (code mặc định tự lấy 1000)
            ApiResponse<String> apiResponse = ApiResponse.<String>builder()
                    .message(message)
                    .build();
            return ResponseEntity.ok(apiResponse);
        } catch (RuntimeException e) {
            // Gói lỗi vào ApiResponse để Frontend đọc được message
            ApiResponse<String> errorResponse = ApiResponse.<String>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = authService.login(request);
            // Gói AuthResponse vào biến result của ApiResponse (code mặc định 1000)
            ApiResponse<AuthResponse> apiResponse = ApiResponse.<AuthResponse>builder()
                    .result(authResponse)
                    .build();
            return ResponseEntity.ok(apiResponse);
        } catch (Exception e) {
            // Trả về lỗi 401 kèm message chuẩn xác
            ApiResponse<AuthResponse> errorResponse = ApiResponse.<AuthResponse>builder()
                    .code(401)
                    .message("Sai email hoặc mật khẩu, hoặc tài khoản bị khóa.")
                    .build();
            return ResponseEntity.status(401).body(errorResponse);
        }
    }
}