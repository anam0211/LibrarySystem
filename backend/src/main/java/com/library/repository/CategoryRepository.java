package com.library.repository;



import org.springframework.data.jpa.repository.JpaRepository;

import com.library.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    long countByParent_Id(Integer parentId);
} 
