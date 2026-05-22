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
import com.library.entity.LoanItem;
import com.library.entity.NotificationType;
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
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<Fine> listAll() {
        return fineRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Fine> listByUser(Integer userId) {
        return fineRepository.findByUser_IdOrderByCreatedAtDesc(userId);
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
    public Fine createForLoanItemIfAbsent(LoanItem item, FineReason reason, BigDecimal amount) {
        if (item == null || item.getId() == null || item.getLoan() == null || item.getLoan().getBorrower() == null) {
            return null;
        }
        if (fineRepository.existsByLoanItem_IdAndReason(item.getId(), reason)) {
            return null;
        }

        Fine fine = new Fine();
        fine.setUser(item.getLoan().getBorrower());
        fine.setLoan(item.getLoan());
        fine.setLoanItem(item);
        fine.setAmount(amount);
        fine.setReason(reason);
        fine.setStatus(FineStatus.UNPAID);
        Fine savedFine = fineRepository.save(fine);
        notifyFineCreated(savedFine);
        return savedFine;
    }

    @Transactional
    public Fine markPaid(Integer fineId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found."));
        fine.setStatus(FineStatus.PAID);
        fine.setPaidAt(LocalDateTime.now());
        return fineRepository.save(fine);
    }

    private void notifyFineCreated(Fine fine) {
        if (fine == null || fine.getUser() == null) {
            return;
        }

        notificationService.createInApp(
                fine.getUser().getId(),
                NotificationType.FINE_CREATED,
                "Thong bao phieu phat moi",
                "Ban vua nhan mot phieu phat moi voi so tien " + fine.getAmount() + " VND.",
                fine.getLoan() != null ? fine.getLoan().getId() : null,
                fine.getLoanItem() != null && fine.getLoanItem().getBook() != null ? fine.getLoanItem().getBook().getId() : null
        );
    }
}
