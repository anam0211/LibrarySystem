package com.library.module.circulation.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.library.module.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "loans")
public class Loan { // <-- Đã bỏ extends BaseAuditEntity

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id", nullable = false)
    private User borrower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LoanStatus status = LoanStatus.OPEN;

    @Builder.Default
    @Column(name = "loaned_at", nullable = false)
    private LocalDateTime loanedAt = LocalDateTime.now();

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "note", length = 255)
    private String note;

    // Thêm thủ công cột created_at để khớp chính xác với SQL Server
    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LoanItem> loanItems = new ArrayList<>();

    public void addLoanItem(LoanItem item) {
        loanItems.add(item);
        item.setLoan(this);
    }
}