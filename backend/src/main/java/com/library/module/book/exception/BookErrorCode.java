package com.library.module.book.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum BookErrorCode implements AppErrorCode {
    BOOK_LINKED_LOAN(1201, "Khong the xoa sach vi sach dang co lich su muon/tra.");

    private final int code;
    private final String message;

    BookErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
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
        return HttpStatus.CONFLICT;
    }
}
