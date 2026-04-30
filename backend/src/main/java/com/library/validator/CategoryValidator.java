package com.library.validator;

import org.springframework.stereotype.Component;

import com.library.common.exception.AppException;
import com.library.entity.Category;
import com.library.exception.CategoryErrorCode;
import com.library.repository.CategoryRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Component
public class CategoryValidator {
    CategoryRepository categoryRepository;
    public Category getCategoryId(Integer id){
        return categoryRepository.findById(id).orElseThrow(() -> new AppException(CategoryErrorCode.CATEGORY_NOT_FOUND));
    }
    public Category resolveParent(Integer parentId, Integer currentParent){
        if(parentId== null) return null;
        if(currentParent!= null && currentParent==parentId){
            throw new AppException(CategoryErrorCode.CATEGORY_INVALID);
        }
        return categoryRepository.findById(parentId).orElseThrow(() -> new AppException(CategoryErrorCode.CATEGORY_PARENT_NOT_FOUND));
    }
}
