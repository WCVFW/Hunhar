package com.theunoia.billing.web;

import com.theunoia.billing.service.CreditService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Service-to-service endpoints (protected by the internal key, not routed by the gateway). */
@RestController
@RequestMapping("/internal/credits")
@RequiredArgsConstructor
public class InternalBillingController {

    private final CreditService creditService;

    @PostMapping("/consume")
    public Map<String, Object> consumeCredits(@RequestBody ConsumeCreditsRequest req) {
        int amount = Math.max(1, Math.min(req.getCreditsToDeduct(), 50));
        boolean consumed = creditService.consumeCredits(req.getFreelancerId(), req.getProjectId(), amount);
        return Map.of("consumed", consumed);
    }

    @Data
    public static class ConsumeCreditsRequest {
        private UUID freelancerId;
        private UUID projectId;
        private int creditsToDeduct = 2;
    }
}
