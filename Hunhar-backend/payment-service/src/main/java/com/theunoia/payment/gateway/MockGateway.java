package com.theunoia.payment.gateway;

import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Withdrawal;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Local development gateway: orders are "paid" by calling
 * POST /api/v1/payments/mock/{orderId}/capture, payouts succeed instantly.
 */
public class MockGateway implements PaymentGateway, PayoutGateway {

    @Override
    public String name() {
        return "MOCK";
    }

    @Override
    public CheckoutOrder createOrder(PaymentOrder order) {
        String id = "mock_order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        return new CheckoutOrder(id, Map.of("provider", "MOCK", "providerOrderId", id,
                "amountPaise", PaymentGateway.toPaise(order.getAmount()), "currency", order.getCurrency(),
                "captureUrl", "/api/v1/payments/mock/" + order.getId() + "/capture"));
    }

    @Override
    public boolean verifyWebhook(String rawBody, Map<String, String> headers) {
        return true;
    }

    @Override
    public WebhookEvent parseWebhook(String rawBody, Map<String, String> headers) {
        return new WebhookEvent(UUID.randomUUID().toString(), "mock", EventKind.IGNORED, null, null, null, null);
    }

    @Override
    public String refund(PaymentOrder order, BigDecimal amount, String refundReference) {
        return "mock_rfnd_" + UUID.randomUUID().toString().substring(0, 12);
    }

    @Override
    public FundAccount register(PayoutAccount account, String plainAccountNumber, String userEmail) {
        return new FundAccount("mock_cont_" + account.getId(), "mock_fa_" + account.getId());
    }

    @Override
    public PayoutResult payout(Withdrawal withdrawal, PayoutAccount account) {
        return new PayoutResult("mock_pout_" + withdrawal.getId(), PayoutStatus.PROCESSED, null);
    }
}
