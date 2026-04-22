package com.library.module.circulation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.module.circulation.dto.request.CheckoutRequestDTO;
import com.library.module.circulation.dto.request.ReservationRequestDTO;
import com.library.module.circulation.entity.Loan;
import com.library.module.circulation.service.LoanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/circulation")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // API: Tạo phiếu mượn (Librarian xác nhận)
    @PostMapping("/checkout")
    public ApiResponse<Integer> checkout(
            @RequestBody CheckoutRequestDTO request,
            @RequestParam("processorId") Integer processorId) {
        
        // Ghi chú: Thực tế processorId sẽ được lấy từ JWT Token của người đang đăng nhập.
        // Ở đây truyền qua param tạm để bạn dễ test trước khi ghép Spring Security.
        Loan savedLoan = loanService.checkoutBooks(request, processorId);
        return ApiResponse.success(savedLoan.getId());
    }

    // API: Trả sách
    @PostMapping("/return/{loanId}/book/{bookId}")
    public ApiResponse<String> returnBook(
            @PathVariable Integer loanId,
            @PathVariable Integer bookId) {
        
        loanService.returnBook(loanId, bookId);
        return ApiResponse.success("Đã trả sách thành công và cập nhật lại kho.");
    }

    @GetMapping("/recent")
    public ApiResponse<List<Map<String, Object>>> getRecent() {
        return ApiResponse.success(loanService.getRecentTransactions());
    }

    @GetMapping("/history/{userId}")
    public ApiResponse<List<Map<String, Object>>> getMyHistory(@PathVariable Integer userId) {
        return ApiResponse.success(loanService.getMyBorrowHistory(userId));
    }

    @PostMapping("/reserve")
    public ApiResponse<Integer> reserveBook(@RequestBody ReservationRequestDTO request) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Loan savedLoan = loanService.reserveBook(currentEmail, request.getBookId(), request.getPickupDate());
        
        return ApiResponse.success(savedLoan.getId());
    }

    @GetMapping("/reservations/pending")
    public ApiResponse<List<Loan>> getPendingReservations() {
        return ApiResponse.success(loanService.getPendingReservations());
    }

    @PutMapping("/reservations/{id}/confirm")
    public ApiResponse<String> confirmReservation(@PathVariable Integer id) {
        String librarianEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        loanService.confirmReservation(id, librarianEmail);
        return ApiResponse.success("Đã xác nhận phiếu mượn thành công!");
    }

    @PutMapping("/reservations/{id}/cancel")
    public ApiResponse<String> cancelReservation(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String librarianEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        String reason = body.getOrDefault("reason", "Không có lý do");
        
        loanService.cancelReservation(id, librarianEmail, reason);
        return ApiResponse.success("Đã hủy phiếu mượn thành công và hoàn trả sách vào kho!");
    }
}