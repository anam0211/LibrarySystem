package com.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.CartItem;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    @EntityGraph(attributePaths = {"book", "cart", "cart.user"})
    List<CartItem> findByCart_User_IdOrderByAddedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"book", "cart", "cart.user"})
    Optional<CartItem> findByCart_IdAndBook_Id(Integer cartId, Integer bookId);
    void deleteByCart_User_IdAndBook_Id(Integer userId, Integer bookId);
    void deleteByCart_User_Id(Integer userId);
}
