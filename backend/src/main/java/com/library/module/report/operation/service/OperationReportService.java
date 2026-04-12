package com.library.module.report.operation.service;

import org.springframework.stereotype.Service;

import com.library.module.report.operation.dto.OperationOverviewResponseDTO;
import com.library.module.user.entity.Role;
import com.library.module.user.entity.UserStatus;
import com.library.module.user.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationReportService {
    UserRepository userRepository;

    public OperationOverviewResponseDTO getOverview() {
        return OperationOverviewResponseDTO.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus(UserStatus.ACTIVE))
                .suspendedUsers(userRepository.countByStatus(UserStatus.SUSPENDED))
                .adminUsers(userRepository.countByRole(Role.ADMIN))
                .librarianUsers(userRepository.countByRole(Role.LIBRARIAN))
                .readerUsers(userRepository.countByRole(Role.READER))
                .borrowingRecords(0)
                .overdueRecords(0)
                .returnedToday(0)
                .build();
    }
}
