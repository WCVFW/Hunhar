package com.theunoia.payment.service;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.payment.client.ProjectClient;
import com.theunoia.payment.domain.DirectPayment;
import com.theunoia.payment.domain.Wallet;
import com.theunoia.payment.repository.PaymentRepositories.CommissionRepository;
import com.theunoia.payment.repository.PaymentRepositories.DirectPaymentRepository;
import com.theunoia.payment.repository.PaymentRepositories.EscrowRepository;
import com.theunoia.payment.repository.PaymentRepositories.PaymentOrderRepository;
import com.theunoia.payment.repository.PaymentRepositories.WalletRepository;
import com.theunoia.payment.repository.PaymentRepositories.WithdrawalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository wallets;
    private final EscrowRepository escrows;
    private final WithdrawalRepository withdrawals;
    private final PaymentOrderRepository orders;
    private final CommissionRepository commissions;
    private final DirectPaymentRepository directPayments;
    private final ProjectClient projectClient;
    private final EventPublisher events;

    /** Freelancer: earnings / pending payments / withdrawals. Client: escrow balance and spend. */
    @Transactional(readOnly = true)
    public Map<String, Object> wallet(AuthUser user) {
        Wallet w = wallets.findById(user.id()).orElse(new Wallet(user.id()));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("userId", user.id());
        r.put("availableBalance", w.getAvailableBalance());
        if (user.isClient()) {
            r.put("fundsInEscrow", escrows.heldByClient(user.id()));
            r.put("totalSpent", orders.totalSpentByClient(user.id()));
        } else {
            r.put("totalEarned", w.getTotalEarned());
            r.put("totalWithdrawn", w.getTotalWithdrawn());
            r.put("pendingPayments", escrows.heldForFreelancer(user.id()));
            r.put("pendingWithdrawals", withdrawals.pendingForUser(user.id()));
        }
        return r;
    }

    // ------------------------------------------------------------------ direct payments

    @Transactional
    public DirectPayment recordDirect(AuthUser client, UUID projectId, BigDecimal amount, String method, String reference, String note) {
        EventData p = EventData.of(projectClient.project(projectId));
        if (!client.id().equals(p.uuid("clientId"))) throw ApiException.forbidden("Only the project owner can record payments");
        if (p.uuid("freelancerId") == null) throw ApiException.unprocessable("NOT_AWARDED", "Project has no hired freelancer yet");
        DirectPayment d = new DirectPayment();
        d.setProjectId(projectId);
        d.setClientId(client.id());
        d.setFreelancerId(p.uuid("freelancerId"));
        d.setAmount(amount);
        d.setMethod(method);
        d.setReference(reference);
        d.setNote(note);
        directPayments.save(d);
        events.publish("direct_payment.recorded", Map.of("directPaymentId", d.getId(), "projectId", projectId,
                "clientId", client.id(), "freelancerId", d.getFreelancerId(), "amount", amount));
        return d;
    }

    @Transactional
    public DirectPayment confirmDirect(AuthUser freelancer, UUID id, boolean received) {
        DirectPayment d = directPayments.findById(id).orElseThrow(() -> ApiException.notFound("Direct payment"));
        if (!d.getFreelancerId().equals(freelancer.id())) throw ApiException.forbidden("Not your payment");
        if (d.getStatus() != DirectPayment.Status.RECORDED) throw ApiException.unprocessable("INVALID_STATE", "Already answered");
        d.setStatus(received ? DirectPayment.Status.CONFIRMED : DirectPayment.Status.DISPUTED);
        d.setConfirmedAt(Instant.now());
        if (received) {
            events.publish("direct_payment.confirmed", Map.of("directPaymentId", id, "projectId", d.getProjectId(),
                    "clientId", d.getClientId(), "freelancerId", d.getFreelancerId(), "amount", d.getAmount()));
        }
        return d;
    }

    @Transactional(readOnly = true)
    public List<DirectPayment> directForProject(AuthUser user, UUID projectId) {
        List<DirectPayment> list = directPayments.findByProjectIdOrderByCreatedAtDesc(projectId);
        if (!user.isAdmin() && list.stream().anyMatch(d -> !d.getClientId().equals(user.id()) && !d.getFreelancerId().equals(user.id()))) {
            throw ApiException.forbidden("Not a participant of this project");
        }
        return list;
    }

    // ------------------------------------------------------------------ platform summary (admin / analytics)

    @Transactional(readOnly = true)
    public Map<String, Object> platformSummary() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalPaymentsCaptured", orders.totalCaptured());
        s.put("commissionEarnings", commissions.totalCommission());
        s.put("gstCollected", commissions.totalGst());
        s.put("pendingPaymentsInEscrow", escrows.totalHeld());
        s.put("pendingWithdrawals", withdrawals.totalPending());
        return s;
    }
}
