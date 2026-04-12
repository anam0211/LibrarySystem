package com.library.common.exception;

import com.library.common.response.ApiResponse;
import com.library.module.book.exception.BookErrorCode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException exception) {
        ApiResponse<Object> response = ApiResponse.<Object>builder()
                .code(4040)
                .message(exception.getMessage())
                .build();

        return ResponseEntity.status(404).body(response);
    }

    @ExceptionHandler(value = BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(BadRequestException exception) {
        ApiResponse<Object> response = ApiResponse.<Object>builder()
                .code(4000)
                .message(exception.getMessage())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        AppErrorCode errorCode = exception.getErrorCode();
        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handlingValidation(MethodArgumentNotValidException exception) {
        String enumKey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        try {
            errorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException ignored) {
        }

        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        if (containsBookLoanConstraint(exception)) {
            ApiResponse<Void> apiResponse = new ApiResponse<>();
            apiResponse.setCode(BookErrorCode.BOOK_LINKED_LOAN.getCode());
            apiResponse.setMessage(BookErrorCode.BOOK_LINKED_LOAN.getMessage());
            return ResponseEntity.status(BookErrorCode.BOOK_LINKED_LOAN.getHttpStatus()).body(apiResponse);
        }

        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setCode(4090);
        apiResponse.setMessage("Khong the thuc hien thao tac vi du lieu dang duoc tham chieu.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiResponse);
    }

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<Void>> handlingRuntimeException(Exception exception) {
        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        exception.printStackTrace();

        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getHttpStatus()).body(apiResponse);
    }

    private boolean containsBookLoanConstraint(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String normalizedMessage = message.toLowerCase();
                if (normalizedMessage.contains("fk__loan_item__book")
                        || (normalizedMessage.contains("loan_items") && normalizedMessage.contains("book_id"))) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
