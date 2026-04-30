package com.library.service;

import org.springframework.stereotype.Service;

import com.library.dto.response.OperationOverviewResponseDTO;
import com.library.entity.Role;
import com.library.entity.UserStatus;
import com.library.repository.UserRepository;

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
