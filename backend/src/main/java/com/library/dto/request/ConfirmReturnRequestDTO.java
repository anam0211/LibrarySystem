package com.library.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class ConfirmReturnRequestDTO {
    private List<String> bookConditions;
}
