package com.library.module.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.module.user.entity.Role;
import com.library.module.user.entity.User;
import com.library.module.user.entity.UserStatus;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    long countByRole(Role role);
}
