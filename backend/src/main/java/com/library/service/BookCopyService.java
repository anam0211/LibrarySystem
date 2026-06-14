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

        CopyRequestState requestState = resolveCopyRequestState(request);
        String barcode = requireBarcode(request);
        if (bookCopyRepository.existsByBarcode(barcode)) {
            throw new BadRequestException("Ma vach ban sao da ton tai.");
        }

        BookCopy copy = new BookCopy();
        copy.setBook(book);
        copy.setBarcode(barcode);
        BookCopyStatus requestedStatus = requestState.statusProvided()
                ? requestState.status()
                : statusForCondition(requestState.condition());
        rejectWorkflowOnlyStatus(requestedStatus);
        copy.setStatus(requestedStatus);
        copy.setCondition(requestState.condition());

        BookCopy savedCopy = bookCopyRepository.save(copy);
        syncBookStock(book);
        return toResponse(savedCopy);
    }

    @Transactional
    public BookCopyResponseDTO updateCopy(Integer copyId, BookCopyRequestDTO request) {
        BookCopy copy = findCopy(copyId);
        CopyRequestState requestState = resolveCopyRequestState(request);
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
            if (requestState.statusProvided() && requestState.status() != managedStatus) {
                throw new BadRequestException("Ban sao dang nam trong don muon, trang thai duoc cap nhat tu dong.");
            }
            if (requestState.conditionProvided() && requestState.condition() != copy.getCondition()) {
                throw new BadRequestException("Chi cap nhat tinh trang ban sao khi xac nhan tra sach.");
            }
            copy.setStatus(managedStatus);
        } else {
            if (requestState.statusProvided()) {
                rejectWorkflowOnlyStatus(requestState.status());
                copy.setStatus(requestState.status());
            }
            if (requestState.conditionProvided()) {
                copy.setCondition(requestState.condition());
            }
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
                BookCopyStatus.AVAILABLE,
                BookCopyCondition.GOOD);
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

        if (condition == BookCopyCondition.DAMAGED) {
            copy.setStatus(BookCopyStatus.DAMAGED);
        } else if (condition == BookCopyCondition.LOST) {
            copy.setStatus(BookCopyStatus.LOST);
        } else {
            copy.setStatus(BookCopyStatus.AVAILABLE);
        }
        copy.setCondition(condition == null ? BookCopyCondition.GOOD : condition);
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

        long availableCopies = bookCopyRepository.countByBook_IdAndStatusAndCondition(
                book.getId(),
                BookCopyStatus.AVAILABLE,
                BookCopyCondition.GOOD);
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

    private CopyRequestState resolveCopyRequestState(BookCopyRequestDTO request) {
        if (request == null) {
            return new CopyRequestState(null, false, null, false);
        }

        BookCopyStatus status = request.getStatus();
        BookCopyCondition condition = request.getCondition();

        if (status == null && condition == null) {
            return new CopyRequestState(null, false, BookCopyCondition.GOOD, false);
        }

        if (condition == null) {
            condition = conditionForStatus(status);
        }

        if (status == null) {
            status = statusForCondition(condition);
            return new CopyRequestState(status, true, condition, true);
        }

        BookCopyCondition expectedCondition = conditionForStatus(status);
        if (expectedCondition != null && condition != expectedCondition) {
            if (condition == BookCopyCondition.GOOD || status == BookCopyStatus.AVAILABLE) {
                condition = expectedCondition == BookCopyCondition.GOOD ? condition : expectedCondition;
                status = statusForCondition(condition);
            } else {
                throw new BadRequestException("Trang thai va tinh trang ban sao khong khop.");
            }
        }

        return new CopyRequestState(status, true, condition, true);
    }

    private BookCopyCondition conditionForStatus(BookCopyStatus status) {
        if (status == null) {
            return BookCopyCondition.GOOD;
        }

        return switch (status) {
            case AVAILABLE, RESERVED, BORROWED -> BookCopyCondition.GOOD;
            case DAMAGED -> BookCopyCondition.DAMAGED;
            case LOST -> BookCopyCondition.LOST;
        };
    }

    private BookCopyStatus statusForCondition(BookCopyCondition condition) {
        if (condition == null) {
            return BookCopyStatus.AVAILABLE;
        }

        return switch (condition) {
            case GOOD -> BookCopyStatus.AVAILABLE;
            case DAMAGED -> BookCopyStatus.DAMAGED;
            case LOST -> BookCopyStatus.LOST;
        };
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
                .condition(conditionForResponse(copy.getStatus(), copy.getCondition()))
                .createdAt(copy.getCreatedAt())
                .build();
    }

    private BookCopyCondition conditionForResponse(BookCopyStatus status, BookCopyCondition condition) {
        BookCopyCondition expectedCondition = conditionForStatus(status);
        if ((status == BookCopyStatus.DAMAGED || status == BookCopyStatus.LOST)
                && (condition == null || condition == BookCopyCondition.GOOD)) {
            return expectedCondition;
        }
        return condition;
    }

    private record CopyRequestState(
            BookCopyStatus status,
            boolean statusProvided,
            BookCopyCondition condition,
            boolean conditionProvided) {
    }
}
