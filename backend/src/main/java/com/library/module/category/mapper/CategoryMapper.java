package com.library.module.category.mapper;



import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.library.module.category.dto.request.CategoryRequestDTO;
import com.library.module.category.dto.response.CategoryResponseDTO;
import com.library.module.category.entity.Category;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parent.id", source = "parentId")
    Category toCategory(CategoryRequestDTO categoryRequestDTO);
   
    //dto.set(Parent.getId())
    @Mapping(target = "parentId", source = "parent.id")
    CategoryResponseDTO toCategoryResponse(Category category);

    List<CategoryResponseDTO> toCategoryResponseDTOList(List<Category> category);

    void updateCategoty(@MappingTarget Category category, CategoryRequestDTO categoryRequestDTO);
    
} 