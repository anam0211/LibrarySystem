package com.library.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.dto.request.SystemConfigRequest;
import com.library.entity.SystemConfig;
import com.library.service.SystemConfigService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/system-configs")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    public ApiResponse<List<SystemConfig>> list() {
        return ApiResponse.success(systemConfigService.getAll());
    }

    @PutMapping("/{configKey}")
    public ApiResponse<SystemConfig> upsert(
            @PathVariable String configKey,
            @RequestBody SystemConfigRequest request
    ) {
        return ApiResponse.success(systemConfigService.upsert(
                configKey,
                request.getConfigValue(),
                request.getDescription()
        ));
    }
}
