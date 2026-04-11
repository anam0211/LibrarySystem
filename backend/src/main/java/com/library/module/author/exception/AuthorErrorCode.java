package com.library.module.author.exception;

import com.library.common.exception.AppErrorCode;
import org.springframework.http.HttpStatus;

public enum AuthorErrorCode implements AppErrorCode{
    AUTHOR_NOT_FOUND(1001,"AUTHOR NOT FOUND"),
    AUTHOR_LINKED_BOOK(1002,"Author duoc gan voi sach")
    ;
    private AuthorErrorCode(int code, String message){
        this.code=code;
        this.message=message;
    }
    private int code;
    private String message;
    public int getCode() {
        return code;
    }
    public String getMessage() {
        return message;
    }

    @Override
    public HttpStatus getHttpStatus() {
        return switch (this) {
            case AUTHOR_LINKED_BOOK -> HttpStatus.CONFLICT;
            case AUTHOR_NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
    }
    
}
