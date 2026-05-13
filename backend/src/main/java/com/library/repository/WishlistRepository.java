package com.library.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Wishlist;
import com.library.entity.WishlistId;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, WishlistId> {
    @EntityGraph(attributePaths = {"book", "user"})
    List<Wishlist> findByUser_IdOrderByCreatedAtDesc(Integer userId);
    long countByBook_Id(Integer bookId);
    boolean existsByUser_IdAndBook_Id(Integer userId, Integer bookId);
    void deleteByUser_IdAndBook_Id(Integer userId, Integer bookId);
}
