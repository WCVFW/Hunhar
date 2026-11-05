package com.theunoia.billing.gateway;

import java.math.BigDecimal;

public interface PaymentGateway {

    /** @param amount amount in rupees */
    GatewayOrder createOrder(BigDecimal amount, String receiptId);

    /** Verifies the checkout signature returned to the browser after a successful payment. */
    boolean verifyPayment(String gatewayOrderId, String paymentId, String signature);

    boolean verifyWebhook(String payload, String signature);

    /** True when no real gateway is configured and payments are simulated (local development only). */
    boolean isMock();

    /** True only for Razorpay live keys (real money). */
    default boolean isLive() {
        return false;
    }

    record GatewayOrder(
            String orderId,
            BigDecimal amount,
            String currency,
            String keyId
    ) {}
}
