package com.theunoia.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.util.CryptoUtil;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Withdrawal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Razorpay Orders + Refunds + Webhooks, and RazorpayX Payouts (bank transfer / UPI).
 * Webhook signature: hex(HMAC_SHA256(rawBody, webhookSecret)) in X-Razorpay-Signature.
 * Checkout signature: hex(HMAC_SHA256(order_id|payment_id, keySecret)).
 */
@Slf4j
public class RazorpayGateway implements PaymentGateway, PayoutGateway {

    private final PaymentProperties.Razorpay cfg;
    private final RestClient client;
    private final ObjectMapper mapper;

    public RazorpayGateway(PaymentProperties props, ObjectMapper mapper) {
        this.cfg = props.getRazorpay();
        this.mapper = mapper;
        String basic = Base64.getEncoder().encodeToString((cfg.getKeyId() + ":" + cfg.getKeySecret()).getBytes(StandardCharsets.UTF_8));
        this.client = RestClient.builder().baseUrl(cfg.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .build();
    }

    @Override
    public String name() {
        return "RAZORPAY";
    }

    @Override
    public CheckoutOrder createOrder(PaymentOrder order) {
        long paise = PaymentGateway.toPaise(order.getAmount());
        JsonNode res = call(() -> client.post().uri("/orders").contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("amount", paise, "currency", order.getCurrency(), "receipt", order.getId().toString(),
                        "notes", Map.of("purpose", order.getPurpose().name(), "referenceId", order.getReferenceId().toString())))
                .retrieve().body(JsonNode.class));
        String orderId = res.path("id").asText();
        Map<String, Object> checkout = new HashMap<>();
        checkout.put("provider", "RAZORPAY");
        checkout.put("keyId", cfg.getKeyId());
        checkout.put("providerOrderId", orderId);
        checkout.put("amountPaise", paise);
        checkout.put("currency", order.getCurrency());
        checkout.put("name", "THEUNOiA");
        checkout.put("description", order.getDescription());
        return new CheckoutOrder(orderId, checkout);
    }

    @Override
    public boolean verifyWebhook(String rawBody, Map<String, String> headers) {
        String signature = headers.get("x-razorpay-signature");
        return signature != null && CryptoUtil.safeEquals(CryptoUtil.hmacSha256Hex(cfg.getWebhookSecret(), rawBody), signature);
    }

    @Override
    public boolean verifyCheckoutSignature(String providerOrderId, String providerPaymentId, String signature) {
        return CryptoUtil.safeEquals(CryptoUtil.hmacSha256Hex(cfg.getKeySecret(), providerOrderId + "|" + providerPaymentId), signature);
    }

    @Override
    public WebhookEvent parseWebhook(String rawBody, Map<String, String> headers) {
        try {
            JsonNode root = mapper.readTree(rawBody);
            String type = root.path("event").asText();
            String eventId = headers.getOrDefault("x-razorpay-event-id", type + ":" + root.path("created_at").asText());
            JsonNode payment = root.path("payload").path("payment").path("entity");
            JsonNode payout = root.path("payload").path("payout").path("entity");
            return switch (type) {
                case "payment.captured", "order.paid" -> new WebhookEvent(eventId, type, EventKind.PAYMENT_CAPTURED,
                        payment.path("order_id").asText(null), payment.path("id").asText(null), null, null);
                case "payment.failed" -> new WebhookEvent(eventId, type, EventKind.PAYMENT_FAILED,
                        payment.path("order_id").asText(null), payment.path("id").asText(null), null,
                        payment.path("error_description").asText("Payment failed"));
                case "refund.processed" -> new WebhookEvent(eventId, type, EventKind.REFUND_PROCESSED, null,
                        root.path("payload").path("refund").path("entity").path("payment_id").asText(null), null, null);
                case "payout.processed" -> new WebhookEvent(eventId, type, EventKind.PAYOUT_PROCESSED, null, null,
                        payout.path("id").asText(null), null);
                case "payout.failed", "payout.reversed", "payout.rejected" -> new WebhookEvent(eventId, type,
                        EventKind.PAYOUT_FAILED, null, null, payout.path("id").asText(null),
                        payout.path("status_details").path("description").asText("Payout failed"));
                default -> new WebhookEvent(eventId, type, EventKind.IGNORED, null, null, null, null);
            };
        } catch (Exception e) {
            throw ApiException.badRequest("Malformed Razorpay webhook");
        }
    }

    @Override
    public String refund(PaymentOrder order, BigDecimal amount, String refundReference) {
        JsonNode res = call(() -> client.post().uri("/payments/{id}/refund", order.getProviderPaymentId())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("amount", PaymentGateway.toPaise(amount), "receipt", refundReference, "speed", "normal"))
                .retrieve().body(JsonNode.class));
        return res.path("id").asText();
    }

    // ------------------------------------------------------------------ RazorpayX payouts

    @Override
    public FundAccount register(PayoutAccount account, String plainAccountNumber, String userEmail) {
        JsonNode contact = call(() -> client.post().uri("/contacts").contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("name", account.getAccountHolderName(), "email", userEmail == null ? "" : userEmail,
                        "type", "vendor", "reference_id", account.getUserId().toString()))
                .retrieve().body(JsonNode.class));
        String contactId = contact.path("id").asText();
        Map<String, Object> body = new HashMap<>();
        body.put("contact_id", contactId);
        if (account.getType() == PayoutAccount.Type.BANK) {
            body.put("account_type", "bank_account");
            body.put("bank_account", Map.of("name", account.getAccountHolderName(), "ifsc", account.getIfsc(),
                    "account_number", plainAccountNumber));
        } else {
            body.put("account_type", "vpa");
            body.put("vpa", Map.of("address", account.getUpiId()));
        }
        JsonNode fa = call(() -> client.post().uri("/fund_accounts").contentType(MediaType.APPLICATION_JSON)
                .body(body).retrieve().body(JsonNode.class));
        return new FundAccount(contactId, fa.path("id").asText());
    }

    @Override
    public PayoutResult payout(Withdrawal w, PayoutAccount account) {
        JsonNode res = call(() -> client.post().uri("/payouts").contentType(MediaType.APPLICATION_JSON)
                .header("X-Payout-Idempotency", w.getId().toString())
                .body(Map.of("account_number", cfg.getPayoutAccountNumber(),
                        "fund_account_id", account.getProviderFundAccountId(),
                        "amount", PaymentGateway.toPaise(w.getAmount()),
                        "currency", "INR",
                        "mode", account.getType() == PayoutAccount.Type.UPI ? "UPI" : "IMPS",
                        "purpose", "payout",
                        "queue_if_low_balance", true,
                        "reference_id", w.getId().toString(),
                        "narration", "THEUNOiA payout"))
                .retrieve().body(JsonNode.class));
        String status = res.path("status").asText();
        PayoutStatus s = switch (status) {
            case "processed" -> PayoutStatus.PROCESSED;
            case "failed", "rejected", "reversed", "cancelled" -> PayoutStatus.FAILED;
            default -> PayoutStatus.PROCESSING;
        };
        return new PayoutResult(res.path("id").asText(), s, s == PayoutStatus.FAILED ? status : null);
    }

    private JsonNode call(java.util.function.Supplier<JsonNode> request) {
        try {
            JsonNode node = request.get();
            if (node == null) throw new IllegalStateException("Empty response");
            return node;
        } catch (RestClientException | IllegalStateException e) {
            log.error("Razorpay call failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Payment provider is unavailable, please retry");
        }
    }
}
