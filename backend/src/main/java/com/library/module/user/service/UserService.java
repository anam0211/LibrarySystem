package com.library.module.user.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.library.common.exception.AppException;
import com.library.common.exception.ErrorCode;
import com.library.module.user.dto.request.UserUpdateRequest;
import com.library.module.user.dto.response.UserResponse;
import com.library.module.user.entity.User;
import com.library.module.user.entity.UserStatus;
import com.library.module.user.mapper.UserMapper;
import com.library.module.user.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    public UserService() {
        this.userRepository = null;
        this.userMapper = null;
    }

    UserRepository userRepository;
    UserMapper userMapper;

    // =========================================
    // NHÓM NGHIỆP VỤ CÁ NHÂN (Dành cho Độc giả)
    // =========================================

    // 1. Lấy thông tin chính mình
    public UserResponse getMyInfo() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        return userMapper.toUserResponse(user);
    }

    // 2. Cập nhật thông tin cá nhân (Đổi tên, sđt...)
    public UserResponse updateMyInfo(UserUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        userMapper.updateUser(user, request); // MapStruct tự động đắp dữ liệu
        return userMapper.toUserResponse(userRepository.save(user));
    }

    // =========================================
    // NHÓM NGHIỆP VỤ QUẢN LÝ (Dành cho Admin)
    // =========================================

    // 3. Lấy danh sách TẤT CẢ người dùng
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    // 4. Lấy chi tiết 1 người dùng theo ID
    public UserResponse getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    // 5. Cập nhật người dùng bất kỳ (Admin sửa thông tin user)
    public UserResponse updateUserById(Integer id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        userMapper.updateUser(user, request);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    // 6. Xóa người dùng
    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        userRepository.delete(user);
    }

    public void suspendUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);
    }

    public void activateUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        user.setStatus(UserStatus.ACTIVE); 
        userRepository.save(user);
    }
}