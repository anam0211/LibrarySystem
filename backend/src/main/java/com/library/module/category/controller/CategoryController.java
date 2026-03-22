package com.library.module.category.controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.module.category.dto.request.CategoryRequestDTO;
import com.library.module.category.dto.response.CategoryResponseDTO;
import com.library.module.category.service.CategoryService;

import lombok.AccessLevel;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;





@RestController
@RequiredArgsConstructor
// @NoArgsConstructor
// @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/categories")
public class CategoryController {
    CategoryService categoryService;
    @GetMapping
    public ApiResponse<List<CategoryResponseDTO>> getAll(){
        return ApiResponse.success(categoryService.getAll());
    }
    @GetMapping("/{id}")
    public ApiResponse<CategoryResponseDTO> getCategory(@PathVariable Integer id) {
        return ApiResponse.success(categoryService.getCategory(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponseDTO> updateCategory(@RequestBody CategoryRequestDTO categoryRequestDTO, @PathVariable Integer id) {
        return ApiResponse.success(categoryService.updateCategory(categoryRequestDTO, id));
    }
    
    @PostMapping
    public ApiResponse<CategoryResponseDTO> createCategory(@RequestBody CategoryRequestDTO categoryRequestDTO) {
        
        return ApiResponse.success(categoryService.createCategory(categoryRequestDTO));
    }
    
    
}
