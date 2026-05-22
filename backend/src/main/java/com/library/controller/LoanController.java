package com.library.controller;

import com.library.common.response.ApiResponse;
import com.library.service.CurrentUserService;
import com.library.service.LoanService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/circulation")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;
    private final CurrentUserService currentUserService;

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ApiResponse<List<Map<String, Object>>> getRecent() {
        return ApiResponse.success(loanService.getRecentTransactions());
    }

    @GetMapping("/history/me")
    public ApiResponse<List<Map<String, Object>>> getMyHistory() {
        return ApiResponse.success(loanService.getMyBorrowHistory(currentUserService.getCurrentUserId()));
    }
}
