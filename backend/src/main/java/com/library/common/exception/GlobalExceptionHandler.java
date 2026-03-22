package com.library.common.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.library.common.response.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {

   @ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
    ex.printStackTrace();

    ApiResponse<Object> response = ApiResponse.<Object>builder()
            .code(9999)
            .message(ex.getClass().getSimpleName() + ": " + ex.getMessage())
            .build();

    return ResponseEntity.internalServerError().body(response);
}
    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception){
        AppErrorCode errorCode= exception.getErrorCode();
        ApiResponse apiResponse= new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception){
        String enumKey= exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode=ErrorCode.INVALID_KEY;
        try{
            errorCode= ErrorCode.valueOf(enumKey);
        } catch(IllegalArgumentException e){   
        }
        ApiResponse apiResponse= new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }
}
