package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.request.UserAddressRequest;
import com.library.entity.UserAddress;
import com.library.service.UserAddressService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user-addresses")
@RequiredArgsConstructor
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> list(@PathVariable Integer userId) {
        return ApiResponse.success(userAddressService.listByUser(userId).stream().map(this::toResponse).toList());
    }

    @PostMapping("/users/{userId}")
    public ApiResponse<Map<String, Object>> save(
            @PathVariable Integer userId,
            @RequestBody UserAddressRequest request
    ) {
        UserAddress address = new UserAddress();
        address.setFullName(request.getFullName());
        address.setPhoneNumber(request.getPhoneNumber());
        address.setAddressLine(request.getAddressLine());
        address.setDefaultAddress(Boolean.TRUE.equals(request.getDefaultAddress()));
        return ApiResponse.success(toResponse(userAddressService.saveAddress(userId, address)));
    }

    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> delete(@PathVariable Integer addressId) {
        userAddressService.deleteAddress(addressId);
        return ApiResponse.success(null);
    }

    private Map<String, Object> toResponse(UserAddress address) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", address.getId());
        result.put("userId", address.getUser() != null ? address.getUser().getId() : null);
        result.put("fullName", address.getFullName());
        result.put("phoneNumber", address.getPhoneNumber());
        result.put("addressLine", address.getAddressLine());
        result.put("defaultAddress", address.getDefaultAddress());
        return result;
    }
}
