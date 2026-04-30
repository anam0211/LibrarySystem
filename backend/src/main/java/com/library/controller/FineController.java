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

import com.library.common.response.ApiResponse;
import com.library.dto.request.FineRequest;
import com.library.entity.Fine;
import com.library.service.FineService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> listAll() {
        return ApiResponse.success(fineService.listAll().stream().map(this::toResponse).toList());
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<List<Map<String, Object>>> listByUser(@PathVariable Integer userId) {
        return ApiResponse.success(fineService.listByUser(userId).stream().map(this::toResponse).toList());
    }

    @GetMapping("/unpaid")
    public ApiResponse<List<Map<String, Object>>> listUnpaid() {
        return ApiResponse.success(fineService.listUnpaid().stream().map(this::toResponse).toList());
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody FineRequest request) {
        Fine fine = fineService.create(request.getUserId(), request.getLoanId(), request.getAmount(), request.getReason());
        return ApiResponse.success(toResponse(fine));
    }

    @PutMapping("/{fineId}/paid")
    public ApiResponse<Map<String, Object>> markPaid(@PathVariable Integer fineId) {
        return ApiResponse.success(toResponse(fineService.markPaid(fineId)));
    }

    private Map<String, Object> toResponse(Fine fine) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", fine.getId());
        result.put("userId", fine.getUser() != null ? fine.getUser().getId() : null);
        result.put("userName", fine.getUser() != null ? fine.getUser().getFullName() : null);
        result.put("loanId", fine.getLoan() != null ? fine.getLoan().getId() : null);
        result.put("amount", fine.getAmount());
        result.put("reason", fine.getReason());
        result.put("status", fine.getStatus());
        result.put("createdAt", fine.getCreatedAt());
        result.put("paidAt", fine.getPaidAt());
        return result;
    }
}
