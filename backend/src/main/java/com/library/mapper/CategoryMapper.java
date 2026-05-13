package com.library.mapper;



import java.util.List;

import org.springframework.stereotype.Component;

import com.library.dto.request.CategoryRequestDTO;
import com.library.dto.response.CategoryResponseDTO;
import com.library.entity.Category;

@Component
public class CategoryMapper {

    public Category toCategory(CategoryRequestDTO categoryRequestDTO) {
        if (categoryRequestDTO == null) {
            return null;
        }

        Category category = new Category();
        category.setName(categoryRequestDTO.getName());
        if (categoryRequestDTO.getParentId() != null) {
            Category parent = new Category();
            parent.setId(categoryRequestDTO.getParentId());
            category.setParent(parent);
        }
        return category;
    }
   
    //dto.set(Parent.getId())
    public CategoryResponseDTO toCategoryResponse(Category category) {
        if (category == null) {
            return null;
        }

        CategoryResponseDTO response = new CategoryResponseDTO();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setParentId(category.getParent() != null ? category.getParent().getId() : null);
        response.setParentName(category.getParent() != null ? category.getParent().getName() : null);
        response.setCreatedAt(category.getCreatedAt());
        return response;
    }

    public List<CategoryResponseDTO> toCategoryResponseDTOList(List<Category> category) {
        if (category == null) {
            return List.of();
        }

        return category.stream().map(this::toCategoryResponse).toList();
    }

    public void updateCategoty(Category category, CategoryRequestDTO categoryRequestDTO) {
        if (category == null || categoryRequestDTO == null) {
            return;
        }

        category.setName(categoryRequestDTO.getName());
        if (categoryRequestDTO.getParentId() == null) {
            category.setParent(null);
            return;
        }

        Category parent = new Category();
        parent.setId(categoryRequestDTO.getParentId());
        category.setParent(parent);
    }
    
} 
