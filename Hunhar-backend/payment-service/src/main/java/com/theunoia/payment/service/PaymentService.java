package com.theunoia.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.payment.client.ProjectClient;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.EscrowHolding;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.gateway.GatewayConfig.GatewayRegistry;
import com.theunoia.payment.gateway.PaymentGateway;
import com.theunoia.payment.gateway.PaymentGateway.WebhookEvent;
import com.theunoia.payment.repository.PaymentRepositories.EscrowRepository;
import com.theunoia.payment.repository.PaymentRepositories.PaymentOrderRepository;
import com.theunoia.payment.service.LedgerService.Account;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Platform payments (escrow) and credit purchases: order creation, capture (webhook or
 * checkout callback), failure handling. Capture is idempotent and row-locked.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentOrderRepository orders;
    private final EscrowRepository escrows;
    private final GatewayRegistry gateways;
    private final ProjectClient projectClient;
    private final LedgerService ledger;
    private final InvoiceService invoices;
    private final EventPublisher events;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final PaymentProperties props;

    /** Client funds a milestone into escrow. */
    @Transactional
    public Map<String, Object> createMilestoneOrder(AuthUser client, UUID milestoneId) {
        EventData m = EventData.of(projectClient.milestone(milestoneId));
        if (!client.id().equals(m.uuid("clientId"))) throw ApiException.forbidden("Only the project owner can fund this milestone");
        if (!"PLATFORM".equals(m.str("paymentMode"))) {
            throw ApiException.unprocessable("DIRECT_PAYMENT_PROJECT", "This project uses direct payments; record the payment instead");
        }
        if (!"IN_PROGRESS".equals(m.str("projectStatus")) || !"PENDING".equals(m.str("status"))) {
            throw ApiException.unprocessable("NOT_FUNDABLE", "Milestone cannot be funded in its current state");
        }
        if (orders.existsByReferenceIdAndPurposeAndStatusIn(milestoneId, PaymentOrder.Purpose.PROJECT_PAYMENT,
                List.of(PaymentOrder.Status.CAPTURED))) {
            throw ApiException.conflict("Milestone is already funded");
        }
        PaymentOrder order = new PaymentOrder();
        order.setUserId(client.id());
        order.setPurpose(PaymentOrder.Purpose.PROJECT_PAYMENT);
        order.setReferenceId(milestoneId);
        order.setProjectId(m.uuid("projectId"));
        order.setPayeeId(m.uuid("freelancerId"));
        order.setAmount(m.decimal("amount"));
        order.setDescription("Escrow deposit: " + m.str("projectTitle") + " - " + m.str("title"));
        return createAtProvider(order);
    }

    /** Called by credit-service for credit package purchases. */
    @Transactional
    public Map<String, Object> createInternalOrder(UUID userId, PaymentOrder.Purpose purpose, UUID referenceId,
                                                   BigDecimal amount, String description) {
        PaymentOrder order = new PaymentOrder();
        order.setUserId(userId);
        order.setPurpose(purpose);
        order.setReferenceId(referenceId);
        order.setAmount(amount);
        order.setDescription(description);
        return createAtProvider(order);
    }

    private Map<String, Object> createAtProvider(PaymentOrder order) {
        PaymentGateway gateway = gateways.active();
        order.setProvider(gateway.name());
        orders.saveAndFlush(order);
        PaymentGateway.CheckoutOrder checkout = gateway.createOrder(order);
        order.setProviderOrderId(checkout.providerOrderId());
        Map<String, Object> result = new HashMap<>(checkout.checkout());
        result.put("orderId", order.getId());
        result.put("amount", order.getAmount());
        result.put("status", order.getStatus().name());
        return result;
    }

    // ------------------------------------------------------------------ capture / failure

    /** Razorpay checkout handler callback (signature verified server-side). */
    @Transactional
    public Map<String, Object> verifyCheckout(AuthUser user, UUID orderId, String providerPaymentId, String signature) {
        PaymentOrder order = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Payment order"));
        if (!order.getUserId().equals(user.id())) throw ApiException.forbidden("Not your order");
        PaymentGateway gateway = gateways.byProvider(order.getProvider());
        if (!gateway.verifyCheckoutSignature(order.getProviderOrderId(), providerPaymentId, signature)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE", "Payment signature verification failed");
        }
        PaymentOrder captured = capture(order.getProviderOrderId(), providerPaymentId);
        return Map.of("orderId", captured.getId(), "status", captured.getStatus().name());
    }

    /** Dev-only simulated payment (provider = mock). */
    @Transactional
    public Map<String, Object> mockCapture(AuthUser user, UUID orderId) {
        if (!"mock".equalsIgnoreCase(props.getProvider())) throw ApiException.notFound("Endpoint");
        PaymentOrder order = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Payment order"));
        if (!order.getUserId().equals(user.id()) && !user.isAdmin()) throw ApiException.forbidden("Not your order");
        PaymentOrder captured = capture(order.getProviderOrderId(), "mock_pay_" + UUID.randomUUID().toString().substring(0, 12));
        return Map.of("orderId", captured.getId(), "status", captured.getStatus().name());
    }

    @Transactional
    public PaymentOrder capture(String providerOrderId, String providerPaymentId) {
        PaymentOrder order = orders.findByProviderOrderIdForUpdate(providerOrderId)
                .orElseThrow(() -> ApiException.notFound("Payment order"));
        if (order.getStatus() != PaymentOrder.Status.CREATED) return order; // idempotent

        order.setStatus(PaymentOrder.Status.CAPTURED);
        order.setProviderPaymentId(providerPaymentId);
        order.setCapturedAt(Instant.now());

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("purpose", order.getPurpose().name());
        data.put("referenceId", order.getReferenceId());
        data.put("userId", order.getUserId());
        data.put("amount", order.getAmount());

        if (order.getPurpose() == PaymentOrder.Purpose.PROJECT_PAYMENT) {
            EscrowHolding e = new EscrowHolding();
            e.setPaymentOrderId(order.getId());
            e.setProjectId(order.getProjectId());
            e.setMilestoneId(order.getReferenceId());
            e.setClientId(order.getUserId());
            e.setFreelancerId(order.getPayeeId());
            e.setAmount(order.getAmount());
            escrows.save(e);
            ledger.debit(order.getUserId(), Account.EXTERNAL, "PAYMENT_RECEIVED", order.getAmount(), null, "PAYMENT_ORDER",
                    order.getId(), order.getDescription());
            ledger.credit(order.getUserId(), Account.ESCROW, "ESCROW_HOLD", order.getAmount(), null, "ESCROW", e.getId(),
                    "Funds held in escrow");
            invoices.issue(Invoice.Type.PROJECT_PAYMENT, order.getUserId(), "PAYMENT_ORDER", order.getId(),
                    order.getDescription(), order.getAmount(), BigDecimal.ZERO);
            data.put("milestoneId", order.getReferenceId());
            data.put("projectId", order.getProjectId());
            data.put("freelancerId", order.getPayeeId());
            data.put("escrowId", e.getId());
        } else {
            ledger.debit(order.getUserId(), Account.EXTERNAL, "PAYMENT_RECEIVED", order.getAmount(), null, "PAYMENT_ORDER",
                    order.getId(), order.getDescription());
            ledger.credit(null, Account.PLATFORM_REVENUE, "CREDIT_SALE", order.getAmount(), null, "PAYMENT_ORDER",
                    order.getId(), order.getDescription());
            // price is GST inclusive: invoice splits it into taxable value + GST
            BigDecimal taxable = order.getAmount().divide(BigDecimal.ONE.add(props.getGstRate()), 2, java.math.RoundingMode.HALF_UP);
            invoices.issue(Invoice.Type.CREDIT_PURCHASE, order.getUserId(), "PAYMENT_ORDER", order.getId(),
                    order.getDescription(), taxable, props.getGstRate());
        }
        events.publish("payment.captured", data);
        return order;
    }

    @Transactional
    public void fail(String providerOrderId, String reason) {
        orders.findByProviderOrderIdForUpdate(providerOrderId).ifPresent(order -> {
            if (order.getStatus() != PaymentOrder.Status.CREATED) return;
            order.setStatus(PaymentOrder.Status.FAILED);
            order.setFailureReason(reason);
            events.publish("payment.failed", Map.of("orderId", order.getId(), "purpose", order.getPurpose().name(),
                    "referenceId", order.getReferenceId(), "userId", order.getUserId(), "reason", reason == null ? "" : reason));
        });
    }

    // ------------------------------------------------------------------ webhooks

    /** Returns false when the event was a duplicate delivery. */
    @Transactional
    public boolean recordWebhook(String provider, WebhookEvent event, String rawBody) {
        try {
            mapper.readTree(rawBody); // ensure valid JSON for the jsonb column
        } catch (JsonProcessingException e) {
            throw ApiException.badRequest("Malformed webhook body");
        }
        int inserted = jdbc.update("""
                INSERT INTO webhook_events (provider, event_id, event_type, payload) VALUES (?, ?, ?, CAST(? AS jsonb))
                ON CONFLICT (provider, event_id) DO NOTHING""", provider, event.eventId(), event.rawType(), rawBody);
        return inserted == 1;
    }

    @Transactional(readOnly = true)
    public PaymentOrder get(UUID orderId, AuthUser user) {
        PaymentOrder o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Payment order"));
        if (!user.isAdmin() && !o.getUserId().equals(user.id())) throw ApiException.forbidden("Not your order");
        return o;
    }
}
