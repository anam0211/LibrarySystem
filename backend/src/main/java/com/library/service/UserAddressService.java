package com.library.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.entity.User;
import com.library.entity.UserAddress;
import com.library.repository.UserAddressRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserAddressService {

    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserAddress> listByUser(Integer userId) {
        return userAddressRepository.findByUser_IdOrderByDefaultAddressDescIdDesc(userId);
    }

    @Transactional
    public UserAddress saveAddress(Integer userId, UserAddress address) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        address.setUser(user);

        if (Boolean.TRUE.equals(address.getDefaultAddress())) {
            clearDefaultAddress(userId);
        }

        return userAddressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(Integer addressId) {
        userAddressRepository.deleteById(addressId);
    }

    private void clearDefaultAddress(Integer userId) {
        userAddressRepository.findByUser_IdOrderByDefaultAddressDescIdDesc(userId)
                .forEach(item -> {
                    item.setDefaultAddress(false);
                    userAddressRepository.save(item);
                });
    }
}
