package com.library.common.exception;

public enum ErrorCode {
    USER_NOT_EXISTS(1005,"Username not exists"),
    UNTICATEGORIZE_EXCEPTION(9999,"Uncategorized error"),
    INVALID_KEY(1001, "Invalid message Key"),
    USER_EXISTED(1002,"User existed"),
    USERNAME_INVALID(1003, "Username must be at least 3 characters"),
    INVALID_PASSWORD(1004,"PassWord must be at least 8 characters"),
    UNAUTHENTICATED(1006,"Unauthenticated");
    private ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
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
