package com.library.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.vnpay")
public class VnpayProperties {
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String tmnCode;
    private String hashSecret;
    private String returnUrl = "http://localhost:8080/library/api/payments/vnpay/return";
    private String ipnUrl = "http://localhost:8080/library/api/payments/vnpay/ipn";
    private String frontendReturnUrl = "http://localhost:5173/reader/card";
}
