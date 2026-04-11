package com.library.common.exception;

import org.springframework.http.HttpStatus;

public interface AppErrorCode {
    int getCode();
    String getMessage();

    default HttpStatus getHttpStatus() {
        return HttpStatus.BAD_REQUEST;
    }
}
