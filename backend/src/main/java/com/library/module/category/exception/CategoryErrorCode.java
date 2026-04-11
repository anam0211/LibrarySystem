package com.library.module.category.exception;

import com.library.common.exception.AppErrorCode;


public enum CategoryErrorCode implements AppErrorCode {
    CATEGORY_NOT_FOUND(1001,"CATEGORY NOT FOUND"),
    CATEGORY_PARENT_NOT_FOUND(1001,"CATEGORY PARENT NOT FOUND"),
    CATEGORY_INVALID(1002,"CATEGORY INVALID")
    ;

    private int code;
    private String message;
    
    private CategoryErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
    public int getCode() {
        return code;
    }
    public String getMessage() {
        return message;
    }

    
   
    
}
