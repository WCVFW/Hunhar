package com.theunoia.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.util.CryptoUtil;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.PaymentOrder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Cashfree Payment Gateway (PG v2023-08-01): create order -> payment_session_id for the JS SDK.
 * Webhook signature: base64(HMAC_SHA256(x-webhook-timestamp + rawBody, clientSecret)).
 */
@Slf4j
public class CashfreeGateway implements PaymentGateway {

    private final PaymentProperties.Cashfree cfg;
    private final RestClient client;
    private final ObjectMapper mapper;

    public CashfreeGateway(PaymentProperties props, ObjectMapper mapper) {
        this.cfg = props.getCashfree();
        this.mapper = mapper;
        this.client = RestClient.builder().baseUrl(cfg.getBaseUrl())
                .defaultHeader("x-client-id", cfg.getClientId())
                .defaultHeader("x-client-secret", cfg.getClientSecret())
                .defaultHeader("x-api-version", cfg.getApiVersion())
                .build();
    }

    @Override
    public String name() {
        return "CASHFREE";
    }

    @Override
    public CheckoutOrder createOrder(PaymentOrder order) {
        String orderId = "tnu_" + order.getId().toString().replace("-", "");
        try {
            JsonNode res = client.post().uri("/orders").contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("order_id", orderId,
                            "order_amount", order.getAmount(),
                            "order_currency", order.getCurrency(),
                            "order_note", order.getDescription() == null ? "" : order.getDescription(),
                            "customer_details", Map.of("customer_id", order.getUserId().toString(),
                                    "customer_phone", cfg.getDefaultCustomerPhone())))
                    .retrieve().body(JsonNode.class);
            return new CheckoutOrder(orderId, Map.of("provider", "CASHFREE", "providerOrderId", orderId,
                    "paymentSessionId", res == null ? "" : res.path("payment_session_id").asText(),
                    "amount", order.getAmount(), "currency", order.getCurrency()));
        } catch (RestClientException e) {
            log.error("Cashfree create order failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Payment provider is unavailable, please retry");
        }
    }

    @Override
    public boolean verifyWebhook(String rawBody, Map<String, String> headers) {
        String signature = headers.get("x-webhook-signature");
        String timestamp = headers.get("x-webhook-timestamp");
        return signature != null && timestamp != null
                && CryptoUtil.safeEquals(CryptoUtil.hmacSha256Base64(cfg.getClientSecret(), timestamp + rawBody), signature);
    }

    @Override
    public WebhookEvent parseWebhook(String rawBody, Map<String, String> headers) {
        try {
            JsonNode root = mapper.readTree(rawBody);
            String type = root.path("type").asText();
            JsonNode data = root.path("data");
            String orderId = data.path("order").path("order_id").asText(null);
            String paymentId = data.path("payment").path("cf_payment_id").asText(null);
            String eventId = type + ":" + orderId + ":" + paymentId;
            return switch (type) {
                case "PAYMENT_SUCCESS_WEBHOOK" -> new WebhookEvent(eventId, type, EventKind.PAYMENT_CAPTURED, orderId, paymentId, null, null);
                case "PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK" -> new WebhookEvent(eventId, type,
                        EventKind.PAYMENT_FAILED, orderId, paymentId, null, data.path("payment").path("payment_message").asText("Payment failed"));
                case "REFUND_STATUS_WEBHOOK" -> new WebhookEvent(eventId, type, EventKind.REFUND_PROCESSED, orderId, paymentId, null, null);
                default -> new WebhookEvent(eventId, type, EventKind.IGNORED, orderId, paymentId, null, null);
            };
        } catch (Exception e) {
            throw ApiException.badRequest("Malformed Cashfree webhook");
        }
    }

    @Override
    public String refund(PaymentOrder order, BigDecimal amount, String refundReference) {
        try {
            JsonNode res = client.post().uri("/orders/{id}/refunds", order.getProviderOrderId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("refund_amount", amount, "refund_id", refundReference))
                    .retrieve().body(JsonNode.class);
            return res == null ? refundReference : res.path("cf_refund_id").asText(refundReference);
        } catch (RestClientException e) {
            log.error("Cashfree refund failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Refund could not be initiated");
        }
    }
}
