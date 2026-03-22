package com.library.module.author.exception;

import com.library.common.exception.AppErrorCode;

public enum AuthorErrorCode implements AppErrorCode{
    AUTHOR_NOT_FOUND(1001,"AUTHOR NOT FOUND")
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
    
}
