package com.library.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.library.module.user.entity.Role;
import com.library.module.user.entity.User;
import com.library.module.user.entity.UserStatus;
import com.library.module.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DemoAccountInitializer implements ApplicationRunner {

    String defaultDemoPassword = "123456";

    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        List<DemoAccount> demoAccounts = List.of(
                new DemoAccount("admin@library.com", "Admin He Thong", "0900000001", Role.ADMIN),
                new DemoAccount("librarian@library.com", "Thu Thu Chinh", "0900000002", Role.LIBRARIAN),
                new DemoAccount("reader1@library.com", "Nguyen Van A", "0900000003", Role.READER),
                new DemoAccount("reader2@library.com", "Tran Thi B", "0900000004", Role.READER));

        for (DemoAccount demoAccount : demoAccounts) {
            User user = userRepository.findByEmail(demoAccount.email())
                    .orElseGet(() -> userRepository.save(User.builder()
                            .fullName(demoAccount.fullName())
                            .email(demoAccount.email())
                            .phone(demoAccount.phone())
                            .role(demoAccount.role())
                            .status(UserStatus.ACTIVE)
                            .passwordHash(passwordEncoder.encode(defaultDemoPassword))
                            .build()));

            if (needsPasswordMigration(user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(defaultDemoPassword));
            }

            if (user.getRole() == null) {
                user.setRole(demoAccount.role());
            }

            if (user.getStatus() == null) {
                user.setStatus(UserStatus.ACTIVE);
            }
        }
    }

    private boolean needsPasswordMigration(String passwordHash) {
        if (passwordHash == null || passwordHash.isBlank()) {
            return true;
        }

        if (passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$")) {
            return false;
        }

        return passwordHash.startsWith("dummy_hash_") || !passwordHash.startsWith("$2");
    }

    private record DemoAccount(String email, String fullName, String phone, Role role) {
    }
}
