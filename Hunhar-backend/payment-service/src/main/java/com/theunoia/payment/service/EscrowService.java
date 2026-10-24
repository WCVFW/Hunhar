package com.theunoia.payment.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.Commission;
import com.theunoia.payment.domain.EscrowHolding;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.Refund;
import com.theunoia.payment.domain.Wallet;
import com.theunoia.payment.gateway.GatewayConfig.GatewayRegistry;
import com.theunoia.payment.repository.PaymentRepositories.CommissionRepository;
import com.theunoia.payment.repository.PaymentRepositories.EscrowRepository;
import com.theunoia.payment.repository.PaymentRepositories.PaymentOrderRepository;
import com.theunoia.payment.repository.PaymentRepositories.RefundRepository;
import com.theunoia.payment.repository.PaymentRepositories.WalletRepository;
import com.theunoia.payment.service.CommissionCalculator.Breakdown;
import com.theunoia.payment.service.LedgerService.Account;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Escrow settlement: release (minus commission + GST) to the freelancer wallet, refund to client, or split. */
@Slf4j
@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowRepository escrows;
    private final PaymentOrderRepository orders;
    private final WalletRepository wallets;
    private final CommissionRepository commissions;
    private final RefundRepository refunds;
    private final GatewayRegistry gateways;
    private final LedgerService ledger;
    private final InvoiceService invoices;
    private final EventPublisher events;
    private final PaymentProperties props;

    /** milestone.approved -> release full escrow. No-op if not funded or already settled (idempotent). */
    @Transactional
    public void releaseForMilestone(UUID milestoneId) {
        escrows.findByMilestoneIdForUpdate(milestoneId)
                .filter(e -> e.getStatus() == EscrowHolding.Status.HELD)
                .ifPresent(e -> {
                    release(e, e.getAmount());
                    e.setStatus(EscrowHolding.Status.RELEASED);
                    e.setSettledAt(Instant.now());
                });
    }

    /** dispute.resolved -> money movements decided by the admin. */
    @Transactional
    public void settleDispute(UUID milestoneId, String resolution, Integer freelancerSharePercent, UUID disputeId) {
        if (milestoneId == null) return;
        EscrowHolding e = escrows.findByMilestoneIdForUpdate(milestoneId).orElse(null);
        if (e == null || e.getStatus() != EscrowHolding.Status.HELD) return;
        switch (resolution) {
            case "RELEASE_TO_FREELANCER" -> {
                release(e, e.getAmount());
                e.setStatus(EscrowHolding.Status.RELEASED);
            }
            case "REFUND_CLIENT" -> {
                refundToClient(e, e.getAmount(), "Dispute " + disputeId + " resolved in client's favour", null);
                e.setStatus(EscrowHolding.Status.REFUNDED);
            }
            case "SPLIT" -> {
                int share = freelancerSharePercent == null ? 50 : freelancerSharePercent;
                BigDecimal toFreelancer = e.getAmount().multiply(BigDecimal.valueOf(share))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal toClient = e.getAmount().subtract(toFreelancer);
                if (toFreelancer.signum() > 0) release(e, toFreelancer);
                if (toClient.signum() > 0) refundToClient(e, toClient, "Dispute " + disputeId + " split settlement", null);
                e.setStatus(EscrowHolding.Status.SPLIT);
            }
            default -> {
                return; // NO_ACTION: funds stay in escrow
            }
        }
        e.setSettledAt(Instant.now());
    }

    private void release(EscrowHolding e, BigDecimal gross) {
        Breakdown b = CommissionCalculator.compute(gross, props.getCommissionRate(), props.getGstRate());
        Wallet wallet = wallets.findForUpdate(e.getFreelancerId()).orElseGet(() -> wallets.save(new Wallet(e.getFreelancerId())));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(b.net()));
        wallet.setTotalEarned(wallet.getTotalEarned().add(b.net()));
        e.setReleasedAmount(e.getReleasedAmount().add(gross));

        Commission c = new Commission();
        c.setEscrowId(e.getId());
        c.setProjectId(e.getProjectId());
        c.setFreelancerId(e.getFreelancerId());
        c.setGrossAmount(b.gross());
        c.setRate(props.getCommissionRate());
        c.setCommissionAmount(b.commission());
        c.setGstAmount(b.gst());
        c.setNetAmount(b.net());
        commissions.save(c);

        ledger.debit(e.getClientId(), Account.ESCROW, "ESCROW_RELEASE", gross, null, "ESCROW", e.getId(), "Escrow released to freelancer");
        ledger.credit(e.getFreelancerId(), Account.WALLET, "EARNING", b.net(), wallet.getAvailableBalance(), "ESCROW", e.getId(),
                "Milestone payment (net of commission)");
        ledger.credit(null, Account.PLATFORM_REVENUE, "COMMISSION", b.commission(), null, "COMMISSION", c.getId(), "Platform commission");
        ledger.credit(null, Account.TAX_PAYABLE, "GST_ON_COMMISSION", b.gst(), null, "COMMISSION", c.getId(), "GST on commission");
        invoices.issue(Invoice.Type.COMMISSION, e.getFreelancerId(), "COMMISSION", c.getId(),
                "Platform commission @ " + props.getCommissionRate().movePointRight(2).stripTrailingZeros().toPlainString()
                        + "% on milestone payment of INR " + b.gross().toPlainString(), b.commission(), props.getGstRate());

        Map<String, Object> data = new HashMap<>();
        data.put("escrowId", e.getId());
        data.put("milestoneId", e.getMilestoneId());
        data.put("projectId", e.getProjectId());
        data.put("clientId", e.getClientId());
        data.put("freelancerId", e.getFreelancerId());
        data.put("grossAmount", b.gross());
        data.put("commission", b.commission());
        data.put("gst", b.gst());
        data.put("netAmount", b.net());
        events.publish("escrow.released", data);
    }

    private void refundToClient(EscrowHolding e, BigDecimal amount, String reason, Refund existing) {
        PaymentOrder order = orders.findByIdForUpdate(e.getPaymentOrderId()).orElseThrow(() -> ApiException.notFound("Payment order"));
        Refund refund = existing != null ? existing : new Refund();
        refund.setEscrowId(e.getId());
        refund.setPaymentOrderId(order.getId());
        refund.setAmount(amount);
        refund.setReason(reason);
        if (refund.getRequestedBy() == null) refund.setRequestedBy(e.getClientId());
        refunds.saveAndFlush(refund);
        String providerRefundId = gateways.byProvider(order.getProvider()).refund(order, amount, "rfnd_" + refund.getId());
        refund.setProviderRefundId(providerRefundId);
        refund.setStatus(Refund.Status.PROCESSED);
        refund.setProcessedAt(Instant.now());

        e.setRefundedAmount(e.getRefundedAmount().add(amount));
        order.setStatus(e.getRefundedAmount().compareTo(order.getAmount()) >= 0
                ? PaymentOrder.Status.REFUNDED : PaymentOrder.Status.PARTIALLY_REFUNDED);
        ledger.debit(e.getClientId(), Account.ESCROW, "ESCROW_REFUND", amount, null, "REFUND", refund.getId(), reason);
        ledger.credit(e.getClientId(), Account.EXTERNAL, "REFUND", amount, null, "REFUND", refund.getId(), "Refund to original payment method");
        events.publish("escrow.refunded", Map.of("escrowId", e.getId(), "milestoneId", e.getMilestoneId(),
                "projectId", e.getProjectId(), "clientId", e.getClientId(), "freelancerId", e.getFreelancerId(),
                "amount", amount, "refundId", refund.getId()));
    }

    // ------------------------------------------------------------------ refund requests (Refund Tracking)

    @Transactional
    public Refund requestRefund(AuthUser client, UUID escrowId, String reason) {
        EscrowHolding e = escrows.findById(escrowId).orElseThrow(() -> ApiException.notFound("Escrow"));
        if (!e.getClientId().equals(client.id())) throw ApiException.forbidden("Not your escrow");
        if (e.getStatus() != EscrowHolding.Status.HELD) throw ApiException.unprocessable("ESCROW_SETTLED", "Funds are no longer in escrow");
        Refund r = new Refund();
        r.setEscrowId(escrowId);
        r.setPaymentOrderId(e.getPaymentOrderId());
        r.setAmount(e.getAmount());
        r.setReason(reason);
        r.setRequestedBy(client.id());
        refunds.save(r);
        events.publish("refund.requested", Map.of("refundId", r.getId(), "escrowId", escrowId, "clientId", client.id(),
                "freelancerId", e.getFreelancerId(), "amount", e.getAmount()));
        return r;
    }

    @Transactional
    public Refund approveRefund(AuthUser admin, UUID refundId) {
        Refund r = refunds.findById(refundId).orElseThrow(() -> ApiException.notFound("Refund"));
        if (r.getStatus() != Refund.Status.REQUESTED) throw ApiException.unprocessable("INVALID_STATE", "Refund already reviewed");
        EscrowHolding e = escrows.findByIdForUpdate(r.getEscrowId()).orElseThrow(() -> ApiException.notFound("Escrow"));
        if (e.getStatus() != EscrowHolding.Status.HELD) throw ApiException.unprocessable("ESCROW_SETTLED", "Funds are no longer in escrow");
        r.setReviewedBy(admin.id());
        r.setReviewedAt(Instant.now());
        refundToClient(e, r.getAmount(), r.getReason(), r);
        e.setStatus(EscrowHolding.Status.REFUNDED);
        e.setSettledAt(Instant.now());
        return r;
    }

    @Transactional
    public Refund rejectRefund(AuthUser admin, UUID refundId, String note) {
        Refund r = refunds.findById(refundId).orElseThrow(() -> ApiException.notFound("Refund"));
        if (r.getStatus() != Refund.Status.REQUESTED) throw ApiException.unprocessable("INVALID_STATE", "Refund already reviewed");
        r.setStatus(Refund.Status.REJECTED);
        r.setReviewedBy(admin.id());
        r.setReviewedAt(Instant.now());
        r.setReason(r.getReason() + " | Rejected: " + (note == null ? "" : note));
        return r;
    }

    @Transactional(readOnly = true)
    public PageResponse<Refund> listRefunds(Refund.Status status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? refunds.findAll(pageable) : refunds.findByStatus(status, pageable), r -> r);
    }

    @Transactional(readOnly = true)
    public PageResponse<EscrowHolding> listEscrows(EscrowHolding.Status status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? escrows.findAll(pageable) : escrows.findByStatus(status, pageable), e -> e);
    }
}
