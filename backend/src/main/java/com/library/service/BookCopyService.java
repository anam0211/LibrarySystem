package com.library.service;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.dto.request.BookCopyRequestDTO;
import com.library.dto.response.BookCopyResponseDTO;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.BookCopyCondition;
import com.library.entity.BookCopyStatus;
import com.library.entity.LoanItem;
import com.library.entity.LoanItemStatus;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.LoanItemRepository;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookCopyService {
    private static final Set<LoanItemStatus> ACTIVE_LOAN_ITEM_STATUSES = EnumSet.of(
            LoanItemStatus.PENDING,
            LoanItemStatus.BORROWED,
            LoanItemStatus.RETURNING);

    private final BookCopyRepository bookCopyRepository;
    private final BookRepository bookRepository;
    private final LoanItemRepository loanItemRepository;

    @Transactional(readOnly = true)
    public List<BookCopyResponseDTO> getCopiesByBook(Integer bookId) {
        return bookCopyRepository.findByBook_IdOrderByCreatedAtDesc(bookId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookCopyResponseDTO createCopy(Integer bookId, BookCopyRequestDTO request) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay sach."));

        String barcode = requireBarcode(request);
        if (bookCopyRepository.existsByBarcode(barcode)) {
            throw new BadRequestException("Ma vach ban sao da ton tai.");
        }

        BookCopy copy = new BookCopy();
        copy.setBook(book);
        copy.setBarcode(barcode);
        BookCopyStatus requestedStatus = request.getStatus() == null ? BookCopyStatus.AVAILABLE : request.getStatus();
        rejectWorkflowOnlyStatus(requestedStatus);
        copy.setStatus(requestedStatus);
        copy.setCondition(request.getCondition() == null ? BookCopyCondition.GOOD : request.getCondition());

        BookCopy savedCopy = bookCopyRepository.save(copy);
        syncBookStock(book);
        return toResponse(savedCopy);
    }

    @Transactional
    public BookCopyResponseDTO updateCopy(Integer copyId, BookCopyRequestDTO request) {
        BookCopy copy = findCopy(copyId);
        Optional<LoanItem> activeLoanItem = loanItemRepository.findFirstByBookCopy_IdAndStatusInOrderByIdDesc(
                copyId,
                ACTIVE_LOAN_ITEM_STATUSES);

        String barcode = request == null ? null : trimToNull(request.getBarcode());
        if (barcode != null && !barcode.equals(copy.getBarcode())) {
            if (bookCopyRepository.existsByBarcode(barcode)) {
                throw new BadRequestException("Ma vach ban sao da ton tai.");
            }
            copy.setBarcode(barcode);
        }

        if (activeLoanItem.isPresent()) {
            BookCopyStatus managedStatus = statusForActiveLoanItem(activeLoanItem.get());
            if (request != null && request.getStatus() != null && request.getStatus() != managedStatus) {
                throw new BadRequestException("Ban sao dang nam trong don muon, trang thai duoc cap nhat tu dong.");
            }
            if (request != null && request.getCondition() != null && request.getCondition() != copy.getCondition()) {
                throw new BadRequestException("Chi cap nhat tinh trang ban sao khi xac nhan tra sach.");
            }
            copy.setStatus(managedStatus);
        } else if (request != null && request.getStatus() != null) {
            rejectWorkflowOnlyStatus(request.getStatus());
            copy.setStatus(request.getStatus());
        }
        if (activeLoanItem.isEmpty() && request != null && request.getCondition() != null) {
            copy.setCondition(request.getCondition());
        }

        BookCopy savedCopy = bookCopyRepository.save(copy);
        syncBookStock(savedCopy.getBook());
        return toResponse(savedCopy);
    }

    @Transactional
    public void deleteCopy(Integer copyId) {
        BookCopy copy = findCopy(copyId);
        if (copy.getStatus() == BookCopyStatus.BORROWED || copy.getStatus() == BookCopyStatus.RESERVED) {
            throw new BadRequestException("Ban sao dang duoc muon hoac giu cho, khong the xoa.");
        }
        if (loanItemRepository.existsByBookCopy_Id(copyId)) {
            throw new BadRequestException("Ban sao da co lich su muon, chi nen doi trang thai thay vi xoa.");
        }

        Book book = copy.getBook();
        bookCopyRepository.delete(copy);
        syncBookStockAfterCopyDeleted(book);
    }

    @Transactional
    public BookCopy reserveAvailableCopy(Book book) {
        // Dùng pessimistic write lock để tránh race condition:
        // chỉ một transaction được lấy bản sao này tại một thời điểm.
        List<BookCopy> copies = bookCopyRepository.findAvailableForUpdate(
                book.getId(),
                BookCopyStatus.AVAILABLE);
        if (copies.isEmpty()) {
            return null;
        }

        BookCopy copy = copies.get(0);
        copy.setStatus(BookCopyStatus.RESERVED);
        bookCopyRepository.save(copy);
        syncBookStock(book);
        return copy;
    }

    @Transactional
    public void markBorrowed(BookCopy copy) {
        if (copy == null) {
            return;
        }

        copy.setStatus(BookCopyStatus.BORROWED);
        bookCopyRepository.save(copy);
        syncBookStock(copy.getBook());
    }

    @Transactional
    public void releaseCopy(BookCopy copy) {
        if (copy == null) {
            return;
        }

        copy.setStatus(BookCopyStatus.AVAILABLE);
        copy.setCondition(BookCopyCondition.GOOD);
        bookCopyRepository.save(copy);
        syncBookStock(copy.getBook());
    }

    @Transactional
    public void markReturned(BookCopy copy, BookCopyCondition condition) {
        if (copy == null) {
            return;
        }

        copy.setCondition(condition);
        if (condition == BookCopyCondition.GOOD) {
            copy.setStatus(BookCopyStatus.AVAILABLE);
        } else if (condition == BookCopyCondition.DAMAGED) {
            copy.setStatus(BookCopyStatus.DAMAGED);
        } else {
            copy.setStatus(BookCopyStatus.LOST);
        }
        bookCopyRepository.save(copy);
        syncBookStock(copy.getBook());
    }

    @Transactional
    public void syncBookStock(Book book) {
        if (book == null || book.getId() == null) {
            return;
        }

        long totalCopies = bookCopyRepository.countByBook_Id(book.getId());
        if (totalCopies == 0) {
            return;
        }

        long availableCopies = bookCopyRepository.countByBook_IdAndStatus(book.getId(), BookCopyStatus.AVAILABLE);
        book.setStockTotal(toInt(totalCopies));
        book.setStockAvailable(toInt(availableCopies));
        bookRepository.save(book);
    }

    private void syncBookStockAfterCopyDeleted(Book book) {
        if (book == null || book.getId() == null) {
            return;
        }

        long totalCopies = bookCopyRepository.countByBook_Id(book.getId());
        if (totalCopies == 0) {
            book.setStockTotal(0);
            book.setStockAvailable(0);
            bookRepository.save(book);
            return;
        }

        syncBookStock(book);
    }

    private int toInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }

    private BookCopy findCopy(Integer copyId) {
        return bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ban sao sach."));
    }

    private String requireBarcode(BookCopyRequestDTO request) {
        String barcode = request == null ? null : trimToNull(request.getBarcode());
        if (barcode == null) {
            throw new BadRequestException("Ma vach ban sao khong duoc de trong.");
        }
        return barcode;
    }

    private void rejectWorkflowOnlyStatus(BookCopyStatus status) {
        if (status == BookCopyStatus.RESERVED || status == BookCopyStatus.BORROWED) {
            throw new BadRequestException("Trang thai giu cho hoac dang muon chi duoc tao tu don muon.");
        }
    }

    private BookCopyStatus statusForActiveLoanItem(LoanItem item) {
        return item.getStatus() == LoanItemStatus.PENDING
                ? BookCopyStatus.RESERVED
                : BookCopyStatus.BORROWED;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String text = value.trim();
        return text.isEmpty() ? null : text;
    }

    private BookCopyResponseDTO toResponse(BookCopy copy) {
        Book book = copy.getBook();
        return BookCopyResponseDTO.builder()
                .id(copy.getId())
                .bookId(book != null ? book.getId() : null)
                .bookTitle(book != null ? book.getTitle() : null)
                .barcode(copy.getBarcode())
                .status(copy.getStatus())
                .condition(copy.getCondition())
                .createdAt(copy.getCreatedAt())
                .build();
    }
}
