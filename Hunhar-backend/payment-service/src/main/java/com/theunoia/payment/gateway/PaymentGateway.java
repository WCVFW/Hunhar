package com.theunoia.payment.gateway;

import com.theunoia.payment.domain.PaymentOrder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/** Payment-gateway abstraction: Razorpay, Cashfree or a local mock are selected by configuration. */
public interface PaymentGateway {

    String name();

    /** Creates the order at the provider; returns its id plus what the frontend checkout widget needs. */
    CheckoutOrder createOrder(PaymentOrder order);

    /** Verifies the webhook signature against the raw request body. */
    boolean verifyWebhook(String rawBody, Map<String, String> headers);

    /** Normalises a provider webhook into a provider-independent event. */
    WebhookEvent parseWebhook(String rawBody, Map<String, String> headers);

    /** Refunds (part of) a captured payment. */
    String refund(PaymentOrder order, BigDecimal amount, String refundReference);

    /** Optional client-side checkout signature verification (Razorpay handler callback). */
    default boolean verifyCheckoutSignature(String providerOrderId, String providerPaymentId, String signature) {
        return false;
    }

    record CheckoutOrder(String providerOrderId, Map<String, Object> checkout) {
    }

    enum EventKind { PAYMENT_CAPTURED, PAYMENT_FAILED, REFUND_PROCESSED, PAYOUT_PROCESSED, PAYOUT_FAILED, IGNORED }

    record WebhookEvent(String eventId, String rawType, EventKind kind, String providerOrderId, String providerPaymentId,
                        String payoutId, String failureReason) {
    }

    static long toPaise(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    }
}
