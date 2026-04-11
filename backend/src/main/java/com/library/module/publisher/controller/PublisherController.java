package com.library.module.publisher.controller;

import com.library.common.response.ApiResponse;
import com.library.module.publisher.dto.request.PublisherRequestDTO;
import com.library.module.publisher.dto.response.PublisherResponseDTO;
import com.library.module.publisher.service.PublisherService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publishers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PublisherController {
    PublisherService publisherService;

    @GetMapping
    public ApiResponse<List<PublisherResponseDTO>> getAll() {
        return ApiResponse.success(publisherService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<PublisherResponseDTO> getById(@PathVariable Integer id) {
        return ApiResponse.success(publisherService.findById(id));
    }

    @PostMapping
    public ApiResponse<PublisherResponseDTO> create(@RequestBody PublisherRequestDTO requestDTO) {
        return ApiResponse.success(publisherService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ApiResponse<PublisherResponseDTO> update(@PathVariable Integer id, @RequestBody PublisherRequestDTO requestDTO) {
        return ApiResponse.success(publisherService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        publisherService.delete(id);
        return ApiResponse.success(null);
    }
}
