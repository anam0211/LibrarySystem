package com.library.module.report.catalog.controller;

import com.library.common.response.ApiResponse;
import com.library.module.report.catalog.dto.CatalogOverviewResponseDTO;
import com.library.module.report.catalog.service.CatalogReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/catalog")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CatalogReportController {
    CatalogReportService catalogReportService;

    @GetMapping("/overview")
    public ApiResponse<CatalogOverviewResponseDTO> getOverview() {
        return ApiResponse.success(catalogReportService.getOverview());
    }
}
