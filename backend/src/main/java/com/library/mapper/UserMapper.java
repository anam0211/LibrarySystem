package com.library.mapper;

import com.library.dto.request.UserUpdateRequest;
import com.library.dto.response.UserResponse;
import com.library.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    // Chuyển từ Entity -> DTO trả về cho Client
    UserResponse toUserResponse(User user);

    // Copy dữ liệu từ Request đắp đè lên Entity cũ để Update
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}