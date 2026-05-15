package com.library.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.common.response.ApiResponse;
import com.library.service.VnpayPaymentService;
import com.library.service.VnpayPaymentService.IpnResult;
import com.library.service.VnpayPaymentService.PaymentResult;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class VnpayPaymentController {

    private final VnpayPaymentService vnpayPaymentService;

    @PostMapping("/memberships/premium")
    public ApiResponse<Map<String, Object>> createPremiumPayment(
            Authentication authentication,
            HttpServletRequest request
    ) {
        return ApiResponse.success(vnpayPaymentService.createPremiumPayment(
                authentication.getName(),
                resolveClientIp(request),
                resolveFrontendReturnUrl(request)));
    }

    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(HttpServletRequest request) {
        PaymentResult result = vnpayPaymentService.handleReturn(toSingleValueMap(request));
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(vnpayPaymentService.buildFrontendRedirectUrl(result)));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/ipn")
    public Map<String, String> handleIpn(HttpServletRequest request) {
        IpnResult result = vnpayPaymentService.handleIpn(toSingleValueMap(request));
        return Map.of(
                "RspCode", result.rspCode(),
                "Message", result.message());
    }

    private Map<String, String> toSingleValueMap(HttpServletRequest request) {
        return request.getParameterMap()
                .entrySet()
                .stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> Arrays.stream(entry.getValue()).findFirst().orElse("")));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor;
        }
        return request.getRemoteAddr();
    }

    private String resolveFrontendReturnUrl(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return origin + "/reader/card";
        }

        String referer = request.getHeader("Referer");
        if (referer == null || referer.isBlank()) {
            return null;
        }

        try {
            URI refererUri = new URI(referer);
            return refererUri.getScheme() + "://" + refererUri.getAuthority() + "/reader/card";
        } catch (URISyntaxException exception) {
            return null;
        }
    }
}
