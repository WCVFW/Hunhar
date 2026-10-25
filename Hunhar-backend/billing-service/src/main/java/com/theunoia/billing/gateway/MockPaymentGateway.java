package com.theunoia.billing.gateway;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Simulated payments for local development when no Razorpay keys are configured.
 * Never enabled when real keys are present (see PaymentGatewayConfig).
 */
public class MockPaymentGateway implements PaymentGateway {

    public static final String MOCK_SIGNATURE = "mock_signature";

    @Override
    public GatewayOrder createOrder(BigDecimal amount, String receiptId) {
        String orderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        return new GatewayOrder(orderId, amount, "INR", "rzp_test_mock");
    }

    @Override
    public boolean verifyPayment(String gatewayOrderId, String paymentId, String signature) {
        return gatewayOrderId.startsWith("order_mock_") && MOCK_SIGNATURE.equals(signature);
    }

    @Override
    public boolean verifyWebhook(String payload, String signature) {
        return false; // no webhooks in mock mode
    }

    @Override
    public boolean isMock() {
        return true;
    }
}
