package com.library.module.report.operation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.module.report.operation.dto.OperationOverviewResponseDTO;
import com.library.module.report.operation.service.OperationReportService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/reports/operations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationReportController {
    OperationReportService operationReportService;

    @GetMapping("/overview")
    public ApiResponse<OperationOverviewResponseDTO> getOverview() {
        return ApiResponse.success(operationReportService.getOverview());
    }
}
