package com.library.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.entity.Book;
import com.library.entity.User;
import com.library.entity.Wishlist;
import com.library.entity.WishlistId;
import com.library.repository.BookRepository;
import com.library.repository.UserRepository;
import com.library.repository.WishlistRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public List<Wishlist> listByUser(Integer userId) {
        return wishlistRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public boolean toggle(Integer userId, Integer bookId) {
        if (wishlistRepository.existsByUser_IdAndBook_Id(userId, bookId)) {
            wishlistRepository.deleteByUser_IdAndBook_Id(userId, bookId);
            return false;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found."));

        WishlistId id = new WishlistId();
        id.setUserId(userId);
        id.setBookId(bookId);

        Wishlist wishlist = new Wishlist();
        wishlist.setId(id);
        wishlist.setUser(user);
        wishlist.setBook(book);
        wishlistRepository.save(wishlist);
        return true;
    }
}
