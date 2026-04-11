package com.library.module.publisher.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum PublisherErrorCode implements AppErrorCode {
    PUBLISHER_NOT_FOUND(1101, "Khong tim thay nha xuat ban."),
    PUBLISHER_NAME_REQUIRED(1102, "Ten nha xuat ban la bat buoc."),
    PUBLISHER_LINKED_BOOK(1103, "Nha xuat ban dang duoc gan voi sach, chua the xoa.");

    private final int code;
    private final String message;

    PublisherErrorCode(int code, String message) {
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
        return switch (this) {
            case PUBLISHER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case PUBLISHER_LINKED_BOOK -> HttpStatus.CONFLICT;
            case PUBLISHER_NAME_REQUIRED -> HttpStatus.BAD_REQUEST;
        };
    }
}
