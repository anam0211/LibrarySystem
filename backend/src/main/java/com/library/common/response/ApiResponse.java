package com.library.common.response;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // khong tra data khi null
public class ApiResponse<T> {
    int code;
    String message;
    T result;
    Instant timestamp;
    public static <T> ApiResponse<T> success(T result){
        return ApiResponse.<T>builder()
        .code(1000)
        .message("Success")
        .timestamp(Instant.now())
        .result(result)
        .build(); 
    }
}
