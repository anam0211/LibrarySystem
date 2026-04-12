package com.library.module.report.operation.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OperationOverviewResponseDTO {
    long totalUsers;
    long activeUsers;
    long suspendedUsers;
    long adminUsers;
    long librarianUsers;
    long readerUsers;
    long borrowingRecords;
    long overdueRecords;
    long returnedToday;
}
