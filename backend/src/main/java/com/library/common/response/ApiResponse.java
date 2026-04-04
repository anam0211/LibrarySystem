package com.library.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // Ẩn các field null (VD: lỗi thì không hiện result)
public class ApiResponse<T> {
    
    @Builder.Default
    int code = 1000; // 1000 là code thành công mặc định
    
    String message;
    
    T result; // Dữ liệu thật trả về (UserResponse, Token, List...)
}