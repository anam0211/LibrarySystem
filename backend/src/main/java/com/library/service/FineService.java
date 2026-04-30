package com.library.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.entity.Fine;
import com.library.entity.FineReason;
import com.library.entity.FineStatus;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.repository.FineRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;

    @Transactional(readOnly = true)
    public List<Fine> listAll() {
        return fineRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Fine> listByUser(Integer userId) {
        return fineRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Fine> listUnpaid() {
        return fineRepository.findByStatusOrderByCreatedAtDesc(FineStatus.UNPAID);
    }

    @Transactional
    public Fine create(Integer userId, Integer loanId, BigDecimal amount, FineReason reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found."));

        Fine fine = new Fine();
        fine.setUser(user);
        fine.setLoan(loan);
        fine.setAmount(amount);
        fine.setReason(reason);
        fine.setStatus(FineStatus.UNPAID);
        return fineRepository.save(fine);
    }

    @Transactional
    public Fine markPaid(Integer fineId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found."));
        fine.setStatus(FineStatus.PAID);
        fine.setPaidAt(LocalDateTime.now());
        return fineRepository.save(fine);
    }
}
