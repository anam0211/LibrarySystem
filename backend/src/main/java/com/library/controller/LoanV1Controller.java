package com.library.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.request.LoanCheckoutRequestDTO;
import com.library.dto.response.LoanTrackingResponseDTO;
import com.library.entity.Loan;
import com.library.service.LoanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanV1Controller {

    private final LoanService loanService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/checkout")
    public ApiResponse<Integer> checkout(@RequestBody LoanCheckoutRequestDTO request) {
        Loan loan = loanService.checkoutForCurrentUser(request, currentUserEmail());
        return ApiResponse.success(loan.getId());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my-tracking")
    public ApiResponse<List<LoanTrackingResponseDTO>> myTracking() {
        return ApiResponse.success(loanService.getMyTracking(currentUserEmail()));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/request-return")
    public ApiResponse<Integer> requestReturn(@PathVariable Integer id) {
        Loan loan = loanService.requestReturn(id, currentUserEmail());
        return ApiResponse.success(loan.getId());
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
