package com.library.service;

import org.springframework.stereotype.Service;

import com.library.dto.response.OperationOverviewResponseDTO;
import com.library.entity.DeliveryMethod;
import com.library.entity.Role;
import com.library.entity.LoanStatus;
import com.library.entity.UserStatus;
import com.library.repository.FineRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;
import com.library.repository.VnpayPaymentRepository;
import java.math.BigDecimal;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationReportService {
    UserRepository userRepository;
    LoanRepository loanRepository;
    FineRepository fineRepository;
    VnpayPaymentRepository vnpayPaymentRepository;

    public OperationOverviewResponseDTO getOverview() {
        return OperationOverviewResponseDTO.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus(UserStatus.ACTIVE))
                .suspendedUsers(userRepository.countByStatus(UserStatus.SUSPENDED))
                .adminUsers(userRepository.countByRole(Role.ADMIN))
                .librarianUsers(userRepository.countByRole(Role.LIBRARIAN))
                .readerUsers(userRepository.countByRole(Role.READER))
                .borrowingRecords(loanRepository.countByStatus(LoanStatus.OPEN) + loanRepository.countByStatus(LoanStatus.OVERDUE))
                .overdueRecords(loanRepository.countByStatus(LoanStatus.OVERDUE))
                .returnedToday(0)
                .pickupLoans(loanRepository.countByDeliveryMethod(DeliveryMethod.PICKUP))
                .deliveryLoans(loanRepository.countByDeliveryMethod(DeliveryMethod.HOME_DELIVERY))
                .unpaidFineAmount(toLong(fineRepository.sumUnpaidAmount()))
                .membershipRevenue(vnpayPaymentRepository.sumSuccessfulMembershipRevenue())
                .build();
    }

    private long toLong(BigDecimal value) {
        return value == null ? 0 : value.longValue();
    }
}
