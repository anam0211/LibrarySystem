package com.library.module.category.repository;



import org.springframework.data.jpa.repository.JpaRepository;

import com.library.module.category.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    long countByParent_Id(Integer parentId);
} 
