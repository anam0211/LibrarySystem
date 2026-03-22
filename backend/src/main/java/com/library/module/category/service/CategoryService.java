package com.library.module.category.service;
import java.util.List;
import org.springframework.stereotype.Service;

import com.library.common.exception.AppException;
import com.library.module.category.dto.request.CategoryRequestDTO;
import com.library.module.category.dto.response.CategoryResponseDTO;
import com.library.module.category.entity.Category;
import com.library.module.category.exception.CategoryErrorCode;
import com.library.module.category.mapper.CategoryMapper;
import com.library.module.category.repository.CategoryRepository;
import com.library.module.category.validator.CategoryValidator;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {
    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    CategoryValidator categoryValidator;
    public List<CategoryResponseDTO> getAll(){
        List<Category> categories= categoryRepository.findAll();
        return categoryMapper.toCategoryResponseDTOList(categories);
    }
    public CategoryResponseDTO getCategory(Integer id){
        Category category=categoryValidator.getCategoryId(id);
        return categoryMapper.toCategoryResponse(category);
    }

    public CategoryResponseDTO updateCategory(CategoryRequestDTO categoryRequestDTO, Integer id){
        Category category= categoryValidator.getCategoryId(id);
        category.setName(categoryRequestDTO.getName());
        category.setParent(categoryValidator.resolveParent(categoryRequestDTO.getParentId(), id));
        return categoryMapper.toCategoryResponse(categoryRepository.save(category));
    }

    public CategoryResponseDTO createCategory(CategoryRequestDTO categoryRequestDTO){
        Category category= categoryMapper.toCategory(categoryRequestDTO);
        category.setParent(categoryValidator.resolveParent(categoryRequestDTO.getParentId(), null));
        return categoryMapper.toCategoryResponse(categoryRepository.save(category));
    }
}
