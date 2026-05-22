package com.library.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum BookErrorCode implements AppErrorCode {
    BOOK_NOT_FOUND(1200, "Khong tim thay sach.", HttpStatus.NOT_FOUND),
    BOOK_LINKED_LOAN(1201, "Khong the xoa sach vi sach dang co lich su muon/tra.", HttpStatus.CONFLICT),
    BOOK_TITLE_REQUIRED(1202, "Tieu de sach la bat buoc.", HttpStatus.BAD_REQUEST),
    BOOK_PUBLISHER_REQUIRED(1203, "Sach can co nha xuat ban.", HttpStatus.BAD_REQUEST),
    BOOK_PUBLISHER_NOT_FOUND(1204, "Khong tim thay nha xuat ban.", HttpStatus.NOT_FOUND),
    BOOK_AUTHOR_REQUIRED(1205, "Sach can it nhat mot tac gia.", HttpStatus.BAD_REQUEST),
    BOOK_AUTHOR_NOT_FOUND(1206, "Khong tim thay tac gia.", HttpStatus.NOT_FOUND),
    BOOK_CATEGORY_REQUIRED(1207, "Sach can it nhat mot the loai.", HttpStatus.BAD_REQUEST),
    BOOK_CATEGORY_NOT_FOUND(1208, "Khong tim thay the loai.", HttpStatus.NOT_FOUND),
    BOOK_STOCK_INVALID(1209, "Ton kho khong hop le.", HttpStatus.BAD_REQUEST),
    BOOK_STATUS_INVALID(1210, "Trang thai sach khong hop le.", HttpStatus.BAD_REQUEST),
    BOOK_ISBN_DUPLICATED(1211, "ISBN da ton tai.", HttpStatus.CONFLICT);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    BookErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    @Override
    public int getCode() {
        return code;
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
