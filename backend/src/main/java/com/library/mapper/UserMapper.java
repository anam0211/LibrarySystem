package com.library.mapper;

import org.springframework.stereotype.Component;

import com.library.dto.request.UserUpdateRequest;
import com.library.dto.response.UserResponse;
import com.library.entity.User;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId() != null ? user.getId().longValue() : null)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .build();
    }

    public void updateUser(User user, UserUpdateRequest request) {
        if (user == null || request == null) {
            return;
        }

        user.setFullName(request.getFullName());
    }
}
