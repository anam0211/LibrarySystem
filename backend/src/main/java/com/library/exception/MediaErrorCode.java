package com.library.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum MediaErrorCode implements AppErrorCode {
    FILE_REQUIRED(1301, "Vui long chon file de upload.", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED(1302, "File vuot qua gioi han 10MB.", HttpStatus.BAD_REQUEST),
    UNSUPPORTED_FILE_FORMAT(1303, "Dinh dang file khong duoc ho tro.", HttpStatus.BAD_REQUEST),
    FILE_SAVE_ERROR(1304, "Khong the luu file upload.", HttpStatus.INTERNAL_SERVER_ERROR),
    MEDIA_NOT_FOUND(1305, "Khong tim thay tai nguyen.", HttpStatus.NOT_FOUND),
    FILE_NOT_FOUND(1306, "Khong tim thay file.", HttpStatus.NOT_FOUND),
    STORAGE_NOT_CONFIGURED(1307, "Chua cau hinh duong dan luu media trong application.yaml.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_FILE_EXTENSION(1308, "File khong co phan mo rong hop le.", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    MediaErrorCode(int code, String message, HttpStatus httpStatus) {
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
