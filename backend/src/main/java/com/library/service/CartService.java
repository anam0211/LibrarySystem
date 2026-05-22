package com.library.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.entity.Book;
import com.library.entity.BookStatus;
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
        return cartItemRepository.findByCart_User_IdOrderByAddedAtDesc(userId)
                .stream()
                .filter(item -> item.getBook() != null)
                .filter(item -> item.getBook().getStatus() == null || item.getBook().getStatus() == BookStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    @Transactional
    public CartItem addBook(Integer userId, Integer bookId) {
        Cart cart = getOrCreateCart(userId);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách."));
        ensureBookCanBeBorrowed(book);

        return cartItemRepository.findByCart_IdAndBook_Id(cart.getId(), bookId)
                .orElseGet(() -> {
                    CartItem item = new CartItem();
                    item.setCart(cart);
                    item.setBook(book);
                    return cartItemRepository.save(item);
                });
    }

    @Transactional
    public CartItem updateQuantity(Integer userId, Integer bookId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new BadRequestException("Số lượng sách phải lớn hơn 0.");
        }

        CartItem item = cartItemRepository.findByCart_User_IdAndBook_Id(userId, bookId)
                .orElseThrow(() -> new BadRequestException("Sách không có trong giỏ mượn."));
        Book book = item.getBook();
        ensureBookCanBeBorrowed(book);

        int stockAvailable = book.getStockAvailable() == null ? 0 : book.getStockAvailable();
        if (quantity > stockAvailable) {
            throw new BadRequestException("Số lượng vượt quá số sách còn trong kho.");
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeBook(Integer userId, Integer bookId) {
        cartItemRepository.deleteByCart_User_IdAndBook_Id(userId, bookId);
    }

    @Transactional
    public void clear(Integer userId) {
        cartItemRepository.deleteByCart_User_Id(userId);
    }

    private void ensureBookCanBeBorrowed(Book book) {
        if (book.getStatus() == BookStatus.ARCHIVED) {
            throw new BadRequestException("Sách đã được lưu trữ và không thể mượn.");
        }
    }

    private Cart getOrCreateCart(Integer userId) {
        return cartRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }
}
