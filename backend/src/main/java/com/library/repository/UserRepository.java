package com.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.entity.UserStatus;
import com.library.entity.VerificationStatus;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    long countByRole(Role role);

    List<User> findByVerificationStatusOrderByCreatedAtAsc(VerificationStatus verificationStatus);

    List<User> findByRole(Role role);

}
