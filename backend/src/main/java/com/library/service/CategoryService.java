package com.library.service;
import java.util.List;
import org.springframework.stereotype.Service;

import com.library.common.exception.AppException;
import com.library.dto.request.CategoryRequestDTO;
import com.library.dto.response.CategoryResponseDTO;
import com.library.repository.BookCategoryRepository;
import com.library.entity.Category;

import com.library.mapper.CategoryMapper;
import com.library.repository.CategoryRepository;
import com.library.validator.CategoryValidator;
import com.library.exception.CategoryErrorCode;

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
    BookCategoryRepository bookCategoryRepository;
    public List<CategoryResponseDTO> getAll(){
        List<Category> categories= categoryRepository.findAll();
        return categories.stream().map(this::toResponse).toList();
    }
    public CategoryResponseDTO getCategory(Integer id){
        Category category=categoryValidator.getCategoryId(id);
        return toResponse(category);
    }

    public CategoryResponseDTO updateCategory(CategoryRequestDTO categoryRequestDTO, Integer id){
        Category category= categoryValidator.getCategoryId(id);
        category.setName(categoryRequestDTO.getName());
        category.setParent(categoryValidator.resolveParent(categoryRequestDTO.getParentId(), id));
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponseDTO createCategory(CategoryRequestDTO categoryRequestDTO){
        Category category= categoryMapper.toCategory(categoryRequestDTO);
        category.setParent(categoryValidator.resolveParent(categoryRequestDTO.getParentId(), null));
        return toResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Integer id) {
        Category category = categoryValidator.getCategoryId(id);

        if (categoryRepository.countByParent_Id(id) > 0) {
            throw new AppException(CategoryErrorCode.CATEGORY_HAS_CHILDREN);
        }

        if (bookCategoryRepository.countByCategory_Id(id) > 0) {
            throw new AppException(CategoryErrorCode.CATEGORY_LINKED_BOOK);
        }

        categoryRepository.delete(category);
    }

    private CategoryResponseDTO toResponse(Category category) {
        CategoryResponseDTO responseDTO = categoryMapper.toCategoryResponse(category);
        responseDTO.setParentName(category.getParent() != null ? category.getParent().getName() : null);
        responseDTO.setChildCount(categoryRepository.countByParent_Id(category.getId()));
        responseDTO.setBookCount(bookCategoryRepository.countByCategory_Id(category.getId()));
        responseDTO.setCreatedAt(category.getCreatedAt());
        return responseDTO;
    }
}
