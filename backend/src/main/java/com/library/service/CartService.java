package com.library.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.entity.Book;
import com.library.entity.Cart;
import com.library.entity.CartItem;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.CartItemRepository;
import com.library.repository.CartRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public List<CartItem> getItems(Integer userId) {
        return cartItemRepository.findByCart_User_IdOrderByAddedAtDesc(userId);
    }

    @Transactional
    public CartItem addBook(Integer userId, Integer bookId) {
        Cart cart = getOrCreateCart(userId);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found."));

        return cartItemRepository.findByCart_IdAndBook_Id(cart.getId(), bookId)
                .orElseGet(() -> {
                    CartItem item = new CartItem();
                    item.setCart(cart);
                    item.setBook(book);
                    return cartItemRepository.save(item);
                });
    }

    @Transactional
    public void removeBook(Integer userId, Integer bookId) {
        cartItemRepository.deleteByCart_User_IdAndBook_Id(userId, bookId);
    }

    @Transactional
    public void clear(Integer userId) {
        cartItemRepository.deleteByCart_User_Id(userId);
    }

    private Cart getOrCreateCart(Integer userId) {
        return cartRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found."));
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }
}
