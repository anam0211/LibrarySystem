package com.library.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum CategoryErrorCode implements AppErrorCode {
    CATEGORY_NOT_FOUND(1001, "Khong tim thay danh muc.", HttpStatus.NOT_FOUND),
    CATEGORY_PARENT_NOT_FOUND(1002, "Khong tim thay danh muc cha.", HttpStatus.NOT_FOUND),
    CATEGORY_INVALID(1003, "Danh muc cha khong hop le.", HttpStatus.BAD_REQUEST),
    CATEGORY_HAS_CHILDREN(1004, "The loai dang co nhom con, chua the xoa.", HttpStatus.BAD_REQUEST),
    CATEGORY_LINKED_BOOK(1005, "The loai dang duoc gan voi sach, chua the xoa.", HttpStatus.CONFLICT);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
    
    CategoryErrorCode(int code, String message, HttpStatus httpStatus) {
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
