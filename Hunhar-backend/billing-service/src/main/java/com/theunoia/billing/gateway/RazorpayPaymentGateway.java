package com.theunoia.billing.gateway;

import com.theunoia.common.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/** Razorpay Orders API + signature verification (https://razorpay.com/docs/payments/server-integration/java/). */
@Slf4j
public class RazorpayPaymentGateway implements PaymentGateway {

    private static final String ORDERS_URL = "https://api.razorpay.com/v1/orders";

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final RestTemplate restTemplate = new RestTemplate();

    public RazorpayPaymentGateway(String keyId, String keySecret, String webhookSecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
    }

    @Override
    public GatewayOrder createOrder(BigDecimal amount, String receiptId) {
        long paise = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(keyId, keySecret);
        Map<String, Object> body = Map.of("amount", paise, "currency", "INR", "receipt", receiptId);
        try {
            ResponseEntity<Map> res = restTemplate.exchange(ORDERS_URL, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            Object id = res.getBody() == null ? null : res.getBody().get("id");
            if (id == null) throw new IllegalStateException("No order id in Razorpay response");
            return new GatewayOrder(id.toString(), amount, "INR", keyId);
        } catch (Exception e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new ApiException("Payment gateway is unavailable. Please try again.", HttpStatus.BAD_GATEWAY);
        }
    }

    @Override
    public boolean verifyPayment(String gatewayOrderId, String paymentId, String signature) {
        if (paymentId == null || signature == null) return false;
        return constantTimeEquals(hmacSha256(gatewayOrderId + "|" + paymentId, keySecret), signature);
    }

    @Override
    public boolean verifyWebhook(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank() || signature == null) return false;
        return constantTimeEquals(hmacSha256(payload, webhookSecret), signature);
    }

    @Override
    public boolean isLive() {
        return keyId.startsWith("rzp_live_");
    }

    @Override
    public boolean isMock() {
        return false;
    }

    private static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
