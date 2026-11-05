package com.theunoia.billing.web;

import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.service.BillingAdminService;
import com.theunoia.billing.service.CreditService;
import com.theunoia.billing.service.PlatformSettingsService;
import com.theunoia.billing.service.WalletService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/** Service-to-service endpoints (protected by the internal key, not routed by the gateway). */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalBillingController {

    private final CreditService creditService;
    private final WalletService walletService;
    private final PlatformSettingsService settingsService;
    private final BillingAdminService adminService;

    @PostMapping("/credits/consume")
    public Map<String, Object> consumeCredits(@RequestBody ConsumeCreditsRequest req) {
        boolean consumed = creditService.consumeCredits(req.getFreelancerId(), req.getProjectId());
        return Map.of("consumed", consumed);
    }

    /** Client funds a milestone: available balance -> escrow. 400 with message if balance is too low. */
    @PostMapping("/escrow/lock")
    public Map<String, Object> lockEscrow(@RequestBody EscrowRequest req) {
        walletService.lockEscrow(req.getClientId(), req.getAmount(), req.getProjectId(), req.getMilestoneId());
        return Map.of("ok", true);
    }

    /** Client approves payment: escrow -> freelancer (minus commission) and an invoice is generated. */
    @PostMapping("/escrow/release")
    public Map<String, Object> releaseEscrow(@RequestBody EscrowRequest req) {
        Invoice invoice = walletService.releaseEscrowToFreelancer(req.getClientId(), req.getFreelancerId(), req.getAmount(),
                req.getProjectId(), req.getMilestoneId(), req.getTitle() == null ? "Project milestone" : req.getTitle());
        return Map.of("invoiceNumber", invoice.getInvoiceNumber());
    }

    @PostMapping("/escrow/refund")
    public Map<String, Object> refundEscrow(@RequestBody EscrowRequest req) {
        walletService.refundEscrow(req.getClientId(), req.getAmount(), req.getProjectId(), req.getMilestoneId(),
                req.getTitle() == null ? "Project cancelled" : req.getTitle());
        return Map.of("ok", true);
    }

    @GetMapping("/settings")
    public Map<String, String> settings() {
        return settingsService.getAll();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return adminService.stats();
    }

    @Data
    public static class ConsumeCreditsRequest {
        private UUID freelancerId;
        private UUID projectId;
    }

    @Data
    public static class EscrowRequest {
        private UUID clientId;
        private UUID freelancerId;
        private UUID projectId;
        private UUID milestoneId;
        private BigDecimal amount;
        private String title;
    }
}
