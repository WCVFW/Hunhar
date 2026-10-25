package com.theunoia.billing.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.billing.domain.CreditPackage;
import com.theunoia.billing.domain.PaymentOrder;
import com.theunoia.billing.gateway.MockPaymentGateway;
import com.theunoia.billing.gateway.PaymentGateway;
import com.theunoia.billing.repository.CreditPackageRepository;
import com.theunoia.billing.repository.PaymentOrderRepository;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final BigDecimal MIN_TOPUP = new BigDecimal("100");
    private static final BigDecimal MAX_TOPUP = new BigDecimal("200000");

    private final PaymentGateway paymentGateway;
    private final PaymentOrderRepository orderRepository;
    private final CreditPackageRepository packageRepository;
    private final CreditService creditService;
    private final WalletService walletService;
    private final NotificationPublisher notifications;
    private final ObjectMapper objectMapper;

    /** Starts a payment. The browser then opens the gateway checkout with the returned order id. */
    @Transactional
    public Map<String, Object> createOrder(UUID userId, PaymentOrder.Purpose purpose, UUID packageId, BigDecimal amount) {
        BigDecimal payable;
        String label;
        if (purpose == PaymentOrder.Purpose.CREDIT_PACKAGE) {
            if (packageId == null) throw new BadRequestException("Choose a credit package");
            CreditPackage pkg = packageRepository.findById(packageId)
                    .filter(CreditPackage::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Credit package not found"));
            payable = pkg.getPriceInInr();
            label = pkg.getName() + " — " + pkg.getCredits() + " credits";
        } else {
            if (amount == null || amount.compareTo(MIN_TOPUP) < 0 || amount.compareTo(MAX_TOPUP) > 0) {
                throw new BadRequestException("Top-up amount must be between ₹100 and ₹2,00,000");
            }
            payable = amount.setScale(2, java.math.RoundingMode.HALF_UP);
            label = "Wallet top-up";
        }

        PaymentGateway.GatewayOrder gatewayOrder = paymentGateway.createOrder(payable,
                "hh_" + UUID.randomUUID().toString().substring(0, 18));

        PaymentOrder order = orderRepository.save(PaymentOrder.builder()
                .userId(userId)
                .purpose(purpose)
                .packageId(packageId)
                .amount(payable)
                .gatewayOrderId(gatewayOrder.orderId())
                .build());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", order.getId());
        res.put("gatewayOrderId", gatewayOrder.orderId());
        res.put("keyId", gatewayOrder.keyId());
        res.put("amount", payable);
        res.put("amountPaise", payable.multiply(BigDecimal.valueOf(100)).longValue());
        res.put("currency", "INR");
        res.put("description", label);
        res.put("mock", paymentGateway.isMock());
        if (paymentGateway.isMock()) {
            res.put("mockSignature", MockPaymentGateway.MOCK_SIGNATURE);
        }
        return res;
    }

    /** Called by the browser after checkout succeeds. The signature proves the payment is genuine. */
    @Transactional
    public PaymentOrder verifyAndFulfill(UUID userId, UUID orderId, String paymentId, String signature) {
        PaymentOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (!order.getUserId().equals(userId)) {
            throw new ForbiddenException("This payment belongs to another account");
        }
        if (order.getStatus() == PaymentOrder.Status.PAID) {
            return order; // idempotent: already fulfilled (e.g. by webhook)
        }
        if (!paymentGateway.verifyPayment(order.getGatewayOrderId(), paymentId, signature)) {
            order.setStatus(PaymentOrder.Status.FAILED);
            orderRepository.save(order);
            throw new BadRequestException("Payment verification failed. If money was deducted it will be refunded automatically.");
        }
        return fulfill(order, paymentId);
    }

    /** Razorpay webhook: fulfils captured payments even if the browser closed before verification. */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (!paymentGateway.verifyWebhook(payload, signature)) {
            throw new BadRequestException("Invalid webhook signature");
        }
        try {
            JsonNode root = objectMapper.readTree(payload);
            String event = root.path("event").asText();
            if (!"payment.captured".equals(event) && !"order.paid".equals(event)) return;
            JsonNode payment = root.path("payload").path("payment").path("entity");
            String gatewayOrderId = payment.path("order_id").asText(null);
            String paymentId = payment.path("id").asText(null);
            if (gatewayOrderId == null) return;
            orderRepository.findByGatewayOrderId(gatewayOrderId).ifPresent(order -> {
                if (order.getStatus() != PaymentOrder.Status.PAID) fulfill(order, paymentId);
            });
        } catch (Exception e) {
            log.error("Failed to process payment webhook: {}", e.getMessage());
        }
    }

    private PaymentOrder fulfill(PaymentOrder order, String paymentId) {
        order.setStatus(PaymentOrder.Status.PAID);
        order.setGatewayPaymentId(paymentId);
        orderRepository.saveAndFlush(order); // optimistic lock prevents double fulfilment

        if (order.getPurpose() == PaymentOrder.Purpose.CREDIT_PACKAGE) {
            var wallet = creditService.addPurchasedCredits(order.getUserId(), order.getPackageId(), paymentId);
            notifications.notify(order.getUserId(), "CREDITS_PURCHASED", "Credits added",
                    "Payment of ₹" + order.getAmount().toPlainString() + " received. Your balance is now "
                            + wallet.getBalance() + " credits.", "/freelancer/credits");
        } else {
            walletService.depositFunds(order.getUserId(), order.getAmount(), paymentId);
            notifications.notify(order.getUserId(), "PAYMENT_RECEIVED", "Wallet topped up",
                    "₹" + order.getAmount().toPlainString() + " was added to your wallet.", "/freelancer/wallet");
        }
        return order;
    }
}
