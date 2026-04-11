package com.library.module.category.service;
import java.util.List;
import org.springframework.stereotype.Service;

import com.library.common.exception.BadRequestException;
import com.library.module.category.dto.request.CategoryRequestDTO;
import com.library.module.category.dto.response.CategoryResponseDTO;
import com.library.module.book.repository.BookCategoryRepository;
import com.library.module.category.entity.Category;

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
            throw new BadRequestException("The loai dang co nhom con, chua the xoa.");
        }

        if (bookCategoryRepository.countByCategory_Id(id) > 0) {
            throw new BadRequestException("The loai dang duoc gan voi sach, chua the xoa.");
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
