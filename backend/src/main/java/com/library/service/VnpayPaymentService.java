package com.library.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.config.VnpayProperties;
import com.library.entity.Membership;
import com.library.entity.MembershipType;
import com.library.entity.User;
import com.library.entity.VnpayPayment;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;
import com.library.repository.VnpayPaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VnpayPaymentService {
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnpayProperties vnpayProperties;
    private final VnpayPaymentRepository vnpayPaymentRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final MembershipService membershipService;

    @Transactional
    public Map<String, Object> createPremiumPayment(String userEmail, String clientIp, String frontendReturnUrl) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Membership premiumPlan = membershipRepository.findByCode(MembershipType.PREMIUM)
                .orElseThrow(() -> new BadRequestException("Goi Premium chua duoc cau hinh."));

        long amountVnd = resolveAmountVnd(premiumPlan);
        String txnRef = buildTxnRef(user.getId());
        String orderInfo = "Nang cap Premium cho user " + user.getId();

        VnpayPayment payment = new VnpayPayment();
        payment.setTxnRef(txnRef);
        payment.setUser(user);
        payment.setAmountVnd(amountVnd);
        payment.setOrderInfo(orderInfo);
        payment.setFrontendReturnUrl(resolveFrontendReturnUrl(frontendReturnUrl));
        vnpayPaymentRepository.save(payment);

        String paymentUrl = buildPaymentUrl(payment, clientIp);
        return Map.of(
                "paymentUrl", paymentUrl,
                "txnRef", txnRef,
                "amount", amountVnd,
                "provider", "VNPAY");
    }

    @Transactional
    public PaymentResult handleReturn(Map<String, String> params) {
        if (!isValidSignature(params)) {
            return PaymentResult.failed("invalid-signature", "Chu ky VNPay khong hop le.");
        }

        return updatePaymentFromVnpay(params, false);
    }

    @Transactional
    public IpnResult handleIpn(Map<String, String> params) {
        if (!isValidSignature(params)) {
            return new IpnResult("97", "Invalid Checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        Optional<VnpayPayment> paymentOptional = vnpayPaymentRepository.findByTxnRef(txnRef);
        if (paymentOptional.isEmpty()) {
            return new IpnResult("01", "Order not Found");
        }

        VnpayPayment payment = paymentOptional.get();
        if (!isAmountMatching(payment, params.get("vnp_Amount"))) {
            return new IpnResult("04", "Invalid Amount");
        }

        if (!"PENDING".equals(payment.getStatus())) {
            return new IpnResult("02", "Order already confirmed");
        }

        updatePaymentFromVnpay(params, true);
        return new IpnResult("00", "Confirm Success");
    }

    public String buildFrontendRedirectUrl(PaymentResult result) {
        return UriComponentsBuilder.fromUriString(resolveFrontendReturnUrlForTxn(result.txnRef()))
                .queryParam("vnpay", result.success() ? "success" : "failed")
                .queryParam("txnRef", result.txnRef())
                .queryParam("message", result.message())
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private PaymentResult updatePaymentFromVnpay(Map<String, String> params, boolean fromIpn) {
        String txnRef = params.get("vnp_TxnRef");
        VnpayPayment payment = vnpayPaymentRepository.findByTxnRef(txnRef)
                .orElse(null);
        if (payment == null) {
            return PaymentResult.failed(txnRef, "Khong tim thay giao dich.");
        }

        if (!isAmountMatching(payment, params.get("vnp_Amount"))) {
            payment.setStatus("FAILED");
            payment.setVnpResponseCode(params.get("vnp_ResponseCode"));
            payment.setVnpTransactionStatus(params.get("vnp_TransactionStatus"));
            return PaymentResult.failed(txnRef, "So tien thanh toan khong hop le.");
        }

        if ("SUCCESS".equals(payment.getStatus())) {
            return PaymentResult.success(txnRef, "Giao dich da duoc xac nhan truoc do.");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        payment.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        payment.setVnpResponseCode(responseCode);
        payment.setVnpTransactionStatus(transactionStatus);

        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            membershipService.upgradeToPremium(payment.getUser().getId());
            payment.setStatus("SUCCESS");
            payment.setPaidAt(LocalDateTime.now(VIETNAM_ZONE));
            return PaymentResult.success(txnRef, fromIpn ? "Confirm Success" : "Thanh toan thanh cong.");
        }

        payment.setStatus("FAILED");
        return PaymentResult.failed(txnRef, "Thanh toan khong thanh cong.");
    }

    private String buildPaymentUrl(VnpayPayment payment, String clientIp) {
        ensureVnpayConfigured();

        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayProperties.getTmnCode());
        params.put("vnp_Amount", String.valueOf(payment.getAmountVnd() * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_OrderInfo", payment.getOrderInfo());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayProperties.getReturnUrl());
        params.put("vnp_IpAddr", normalizeClientIp(clientIp));
        params.put("vnp_CreateDate", now.format(VNPAY_DATE_FORMAT));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(VNPAY_DATE_FORMAT));

        String hashData = buildHashData(params);
        String secureHash = hmacSha512(vnpayProperties.getHashSecret(), hashData);
        String queryString = buildQueryString(params);
        return vnpayProperties.getPayUrl() + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }

    public boolean isValidSignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (!StringUtils.hasText(receivedHash)) {
            return false;
        }

        Map<String, String> signedParams = params.entrySet()
                .stream()
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        String expectedHash = hmacSha512(vnpayProperties.getHashSecret(), buildHashData(signedParams));
        return expectedHash.equalsIgnoreCase(receivedHash);
    }

    private String buildHashData(Map<String, String> params) {
        return sortedParams(params).entrySet()
                .stream()
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .map(entry -> entry.getKey() + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String buildQueryString(Map<String, String> params) {
        return sortedParams(params).entrySet()
                .stream()
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private Map<String, String> sortedParams(Map<String, String> params) {
        return params.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                result.append(String.format("%02x", value));
            }
            return result.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Khong the tao chu ky VNPay.", exception);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private boolean isAmountMatching(VnpayPayment payment, String vnpAmount) {
        try {
            return Long.parseLong(vnpAmount) == payment.getAmountVnd() * 100;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private long resolveAmountVnd(Membership premiumPlan) {
        BigDecimal price = BigDecimal.valueOf(premiumPlan.getPricePerMonth());
        return price.setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private String buildTxnRef(Integer userId) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "PREM" + userId + System.currentTimeMillis() + suffix;
    }

    private String normalizeClientIp(String clientIp) {
        if (!StringUtils.hasText(clientIp)) {
            return "127.0.0.1";
        }
        String firstIp = clientIp.split(",")[0].trim();
        return firstIp.isBlank() ? "127.0.0.1" : firstIp;
    }

    private String resolveFrontendReturnUrl(String requestedReturnUrl) {
        if (StringUtils.hasText(requestedReturnUrl)) {
            return requestedReturnUrl;
        }
        return vnpayProperties.getFrontendReturnUrl();
    }

    private String resolveFrontendReturnUrlForTxn(String txnRef) {
        return vnpayPaymentRepository.findByTxnRef(txnRef)
                .map(VnpayPayment::getFrontendReturnUrl)
                .filter(StringUtils::hasText)
                .orElse(vnpayProperties.getFrontendReturnUrl());
    }

    private void ensureVnpayConfigured() {
        if (!StringUtils.hasText(vnpayProperties.getTmnCode())
                || !StringUtils.hasText(vnpayProperties.getHashSecret())) {
            throw new BadRequestException("Chua cau hinh VNPAY_TMN_CODE va VNPAY_HASH_SECRET.");
        }
    }

    public record PaymentResult(boolean success, String txnRef, String message) {
        public static PaymentResult success(String txnRef, String message) {
            return new PaymentResult(true, txnRef, message);
        }

        public static PaymentResult failed(String txnRef, String message) {
            return new PaymentResult(false, txnRef, message);
        }
    }

    public record IpnResult(String rspCode, String message) {
    }
}
