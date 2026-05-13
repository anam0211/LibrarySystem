package com.library.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.request.ConfirmReturnRequestDTO;
import com.library.dto.request.LoanStatusUpdateRequestDTO;
import com.library.dto.response.AdminLoanKanbanResponseDTO;
import com.library.entity.Loan;
import com.library.service.LoanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/loans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LIBRARIAN')")
public class AdminLoanController {

    private final LoanService loanService;

    @GetMapping("/kanban")
    public ApiResponse<List<AdminLoanKanbanResponseDTO>> kanban() {
        return ApiResponse.success(loanService.getKanbanLoans());
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Integer> updateStatus(
            @PathVariable Integer id,
            @RequestBody LoanStatusUpdateRequestDTO request
    ) {
        Loan loan = loanService.updateAdminStatus(id, request, currentUserEmail());
        return ApiResponse.success(loan.getId());
    }

    @PostMapping("/{id}/confirm-return")
    public ApiResponse<Integer> confirmReturn(
            @PathVariable Integer id,
            @RequestBody ConfirmReturnRequestDTO request
    ) {
        Loan loan = loanService.confirmReturn(id, request, currentUserEmail());
        return ApiResponse.success(loan.getId());
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
