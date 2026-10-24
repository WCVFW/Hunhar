package com.theunoia.credit.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.InternalClientFactory;
import com.theunoia.credit.domain.CreditPackage;
import com.theunoia.credit.domain.CreditPurchase;
import com.theunoia.credit.repository.CreditRepositories.CreditPackageRepository;
import com.theunoia.credit.repository.CreditRepositories.CreditPurchaseRepository;
import com.theunoia.credit.repository.LedgerRepository;
import com.theunoia.credit.repository.LedgerRepository.Applied;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Credit System (MVP logic):
 *  - freelancer receives starter credits during registration
 *  - credits are consumed while bidding (debited by project-service through /internal)
 *  - additional credits can be purchased (payment-service checkout)
 *  - admin can manually allocate (or deduct) credits
 */
@Slf4j
@Service
public class CreditService {

    private final LedgerRepository ledger;
    private final CreditPackageRepository packages;
    private final CreditPurchaseRepository purchases;
    private final EventPublisher events;
    private final RestClient paymentClient;
    private final int starterCredits;

    public CreditService(LedgerRepository ledger, CreditPackageRepository packages, CreditPurchaseRepository purchases,
                         EventPublisher events, InternalClientFactory clients,
                         @Value("${theunoia.services.payment}") String paymentUrl,
                         @Value("${theunoia.credits.starter-credits:20}") int starterCredits) {
        this.ledger = ledger;
        this.packages = packages;
        this.purchases = purchases;
        this.events = events;
        this.paymentClient = clients.create(paymentUrl);
        this.starterCredits = starterCredits;
    }

    @Transactional
    public Applied debitForBid(UUID userId, int amount, String key, String reference, String description) {
        if (amount <= 0) throw ApiException.badRequest("Debit amount must be positive");
        Applied applied = ledger.apply(userId, -amount, "BID_DEBIT", key, reference, description, null);
        if (!applied.duplicate()) {
            events.publish("credits.debited", Map.of("userId", userId, "amount", amount, "balance", applied.balance(),
                    "reference", reference == null ? "" : reference));
        }
        return applied;
    }

    @Transactional
    public Applied refundBid(UUID userId, int amount, String key, String reference, String description) {
        if (amount <= 0) throw ApiException.badRequest("Refund amount must be positive");
        return ledger.apply(userId, amount, "BID_REFUND", key, reference, description, null);
    }

    @Transactional
    public void grantStarterCredits(UUID userId) {
        if (starterCredits <= 0) return;
        Applied applied = ledger.apply(userId, starterCredits, "STARTER_GRANT", "starter:" + userId, "REGISTRATION",
                "Welcome bonus credits", null);
        if (!applied.duplicate()) {
            events.publish("credits.allocated", Map.of("userId", userId, "amount", starterCredits,
                    "balance", applied.balance(), "reason", "STARTER_GRANT"));
        }
    }

    @Transactional
    public Applied adminAdjust(UUID adminId, UUID userId, int amount, String note) {
        if (amount == 0) throw ApiException.badRequest("Amount must be non-zero");
        String type = amount > 0 ? "ADMIN_ALLOCATION" : "ADMIN_DEDUCTION";
        Applied applied = ledger.apply(userId, amount, type, "admin:" + UUID.randomUUID(), "ADMIN:" + adminId, note, adminId);
        events.publish("credits.allocated", Map.of("userId", userId, "amount", amount, "balance", applied.balance(),
                "reason", type, "adminId", adminId));
        return applied;
    }

    // ------------------------------------------------------------------ purchase flow

    /** Creates a pending purchase and a payment order; credits are added when payment.captured arrives. */
    @Transactional
    public Map<String, Object> startPurchase(UUID userId, UUID packageId) {
        CreditPackage pkg = packages.findById(packageId).filter(CreditPackage::isActive)
                .orElseThrow(() -> ApiException.notFound("Credit package"));
        CreditPurchase purchase = new CreditPurchase();
        purchase.setUserId(userId);
        purchase.setPackageId(pkg.getId());
        purchase.setCredits(pkg.totalCredits());
        purchase.setPrice(pkg.getPrice());
        purchases.saveAndFlush(purchase);

        Map<String, Object> order = paymentClient.post().uri("/internal/payments/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("userId", userId, "purpose", "CREDIT_PURCHASE", "referenceId", purchase.getId(),
                        "amount", pkg.getPrice(), "description", pkg.getName() + " - " + pkg.totalCredits() + " credits"))
                .retrieve().body(new ParameterizedTypeReference<>() {
                });
        if (order != null && order.get("orderId") != null) {
            purchase.setPaymentOrderId(UUID.fromString(order.get("orderId").toString()));
        }
        Map<String, Object> result = new HashMap<>();
        result.put("purchaseId", purchase.getId());
        result.put("credits", purchase.getCredits());
        result.put("price", purchase.getPrice());
        result.put("payment", order);
        return result;
    }

    @Transactional
    public void completePurchase(UUID purchaseId, UUID paymentOrderId) {
        CreditPurchase purchase = purchases.findById(purchaseId).orElse(null);
        if (purchase == null) {
            log.warn("Payment captured for unknown credit purchase {}", purchaseId);
            return;
        }
        if (purchase.getStatus() == CreditPurchase.Status.COMPLETED) return;
        Applied applied = ledger.apply(purchase.getUserId(), purchase.getCredits(), "PURCHASE", "purchase:" + purchaseId,
                "PAYMENT:" + paymentOrderId, "Credit package purchase", null);
        purchase.setStatus(CreditPurchase.Status.COMPLETED);
        purchase.setCompletedAt(Instant.now());
        events.publish("credits.purchased", Map.of("userId", purchase.getUserId(), "credits", purchase.getCredits(),
                "price", purchase.getPrice(), "balance", applied.balance(), "purchaseId", purchaseId));
    }

    @Transactional
    public void failPurchase(UUID purchaseId) {
        purchases.findById(purchaseId).filter(p -> p.getStatus() == CreditPurchase.Status.PENDING)
                .ifPresent(p -> p.setStatus(CreditPurchase.Status.FAILED));
    }

    @Transactional(readOnly = true)
    public List<CreditPackage> activePackages() {
        return packages.findByActiveTrueOrderByPositionAsc();
    }
}
