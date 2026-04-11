package com.library.common.exception;

public class AppException extends RuntimeException {
    private AppErrorCode errorCode;
    
    public AppException(AppErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppErrorCode getErrorCode() {
        return errorCode;
    }

    public void setAppErrorCode(AppErrorCode errorCode) {
        this.errorCode = errorCode;
    }
    
}
