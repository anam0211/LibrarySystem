package com.library.module.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    
    // Tìm user theo email (Dùng cho chức năng Đăng nhập)
    Optional<UserEntity> findByEmail(String email);
    
    // Kiểm tra email tồn tại (Dùng cho chức năng Đăng ký)
    boolean existsByEmail(String email);
}