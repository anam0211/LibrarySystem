package com.library.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.security.access.prepost.PreAuthorize;

import com.library.common.response.ApiResponse;
import com.library.dto.request.FineRequest;
import com.library.entity.Fine;
import com.library.entity.NotificationType;
import com.library.service.FineService;
import com.library.service.CurrentUserService;
import com.library.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fines")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ApiResponse<List<Map<String, Object>>> listAll() {
        return ApiResponse.success(fineService.listAll().stream().map(this::toResponse).toList());
    }

    @GetMapping("/me")
    public ApiResponse<List<Map<String, Object>>> listMine() {
        return ApiResponse.success(fineService.listByUser(currentUserService.getCurrentUserId()).stream().map(this::toResponse).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ApiResponse<Map<String, Object>> create(@RequestBody FineRequest request) {
        Fine fine = fineService.create(request.getUserId(), request.getLoanId(), request.getAmount(), request.getReason());

        // Định dạng tiền tệ có dấu phẩy cho đẹp (vd: 50,000)
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,###");
        String formattedAmount = df.format(fine.getAmount());
        
        notificationService.createInApp(
                fine.getUser() != null ? fine.getUser().getId() : request.getUserId(),
                NotificationType.FINE_CREATED,
                "Thông báo phiếu phạt mới",
                "Bạn vừa nhận được một phiếu phạt mới với số tiền " + formattedAmount + " VNĐ. Vui lòng vào mục Nợ phạt để xem chi tiết và thanh toán.",
                fine.getLoan() != null ? fine.getLoan().getId() : request.getLoanId(),
                null
        );
        
        return ApiResponse.success(toResponse(fine));
    }

    @PutMapping("/{fineId}/paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ApiResponse<Map<String, Object>> markPaid(@PathVariable Integer fineId) {
        return ApiResponse.success(toResponse(fineService.markPaid(fineId)));
    }

    private Map<String, Object> toResponse(Fine fine) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", fine.getId());
        result.put("userId", fine.getUser() != null ? fine.getUser().getId() : null);
        result.put("userName", fine.getUser() != null ? fine.getUser().getFullName() : null);
        result.put("loanId", fine.getLoan() != null ? fine.getLoan().getId() : null);
        result.put("loanItemId", fine.getLoanItem() != null ? fine.getLoanItem().getId() : null);
        result.put("bookId", fine.getLoanItem() != null && fine.getLoanItem().getBookCopy() != null
                ? fine.getLoanItem().getBookCopy().getBook().getId()
                : null);
        result.put("bookTitle", fine.getLoanItem() != null && fine.getLoanItem().getBookCopy() != null
                ? fine.getLoanItem().getBookCopy().getBook().getTitle()
                : null);
        result.put("copyId", fine.getLoanItem() != null && fine.getLoanItem().getBookCopy() != null
                ? fine.getLoanItem().getBookCopy().getId()
                : null);
        result.put("copyBarcode", fine.getLoanItem() != null && fine.getLoanItem().getBookCopy() != null
                ? fine.getLoanItem().getBookCopy().getBarcode()
                : null);
        result.put("amount", fine.getAmount());
        result.put("reason", fine.getReason());
        result.put("status", fine.getStatus());
        result.put("createdAt", fine.getCreatedAt());
        result.put("paidAt", fine.getPaidAt());
        return result;
    }
}
