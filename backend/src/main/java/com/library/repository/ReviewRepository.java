package com.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    @EntityGraph(attributePaths = {"book", "user"})
    List<Review> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"book", "user"})
    List<Review> findByBook_IdOrderByCreatedAtDesc(Integer bookId);

    @EntityGraph(attributePaths = {"book", "user"})
    List<Review> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"book", "user"})
    Optional<Review> findByUser_IdAndBook_Id(Integer userId, Integer bookId);

    boolean existsByUser_IdAndBook_Id(Integer userId, Integer bookId);

    long countByBook_Id(Integer bookId);
}
