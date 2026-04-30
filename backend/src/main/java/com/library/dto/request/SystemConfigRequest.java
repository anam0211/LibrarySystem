package com.library.dto.request;

import lombok.Data;

@Data
public class SystemConfigRequest {
    private String configValue;
    private String description;
}
