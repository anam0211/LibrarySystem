package com.library.entity;

public enum VerificationStatus {
    /** Chưa nộp hồ sơ KYC */
    UNVERIFIED,
    /** Đã nộp, đang chờ admin duyệt */
    PENDING,
    /** Admin đã duyệt */
    VERIFIED,
    /** Admin đã từ chối – có thể nộp lại */
    REJECTED
}
