package com.theunoia.payment.web;

import com.theunoia.common.exception.ApiException;
import com.theunoia.payment.gateway.GatewayConfig.GatewayRegistry;
import com.theunoia.payment.gateway.PaymentGateway;
import com.theunoia.payment.gateway.PaymentGateway.WebhookEvent;
import com.theunoia.payment.service.PaymentService;
import com.theunoia.payment.service.WithdrawalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Provider webhooks (public through the gateway, authenticated by HMAC signature over the
 * raw body). Deliveries are de-duplicated; processing is idempotent; 2xx is returned once
 * stored so the provider stops retrying.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final GatewayRegistry gateways;
    private final PaymentService payments;
    private final WithdrawalService withdrawals;

    @PostMapping("/{provider}")
    public ResponseEntity<Map<String, Object>> receive(@PathVariable String provider, @RequestBody String rawBody,
                                                       @RequestHeader Map<String, String> headers) {
        Map<String, String> lower = new HashMap<>();
        headers.forEach((k, v) -> lower.put(k.toLowerCase(), v));
        PaymentGateway gateway;
        try {
            gateway = gateways.byProvider(provider);
        } catch (IllegalArgumentException e) {
            throw ApiException.notFound("Webhook provider");
        }
        if (!gateway.verifyWebhook(rawBody, lower)) {
            log.warn("Rejected {} webhook with invalid signature", provider);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_SIGNATURE", "Webhook signature verification failed");
        }
        WebhookEvent event = gateway.parseWebhook(rawBody, lower);
        if (!payments.recordWebhook(provider, event, rawBody)) {
            return ResponseEntity.ok(Map.of("status", "duplicate"));
        }
        switch (event.kind()) {
            case PAYMENT_CAPTURED -> payments.capture(event.providerOrderId(), event.providerPaymentId());
            case PAYMENT_FAILED -> payments.fail(event.providerOrderId(), event.failureReason());
            case PAYOUT_PROCESSED -> withdrawals.onPayoutWebhook(event.payoutId(), true, null);
            case PAYOUT_FAILED -> withdrawals.onPayoutWebhook(event.payoutId(), false, event.failureReason());
            default -> log.debug("Ignoring {} webhook {}", provider, event.rawType());
        }
        return ResponseEntity.ok(Map.of("status", "processed"));
    }
}
