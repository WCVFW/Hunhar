package com.theunoia.billing.web;

import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.domain.PaymentOrder;
import com.theunoia.billing.service.PaymentService;
import com.theunoia.billing.service.WalletService;
import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final WalletService walletService;

    /** Step 1: create a gateway order for a credit package or a wallet top-up. */
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @CurrentUser AuthUser currentUser,
            @Valid @RequestBody CreateOrderRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Order created",
                paymentService.createOrder(requireUser(currentUser).id(), req.getPurpose(), req.getPackageId(), req.getAmount())));
    }

    /** Step 2: after checkout succeeds, verify the gateway signature and deliver what was bought. */
    @PostMapping("/orders/{orderId}/verify")
    public ResponseEntity<ApiResponse<PaymentOrder>> verifyOrder(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID orderId,
            @Valid @RequestBody VerifyPaymentRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Payment successful",
                paymentService.verifyAndFulfill(requireUser(currentUser).id(), orderId, req.getPaymentId(), req.getSignature())));
    }

    @PostMapping("/escrow/lock")
    public ResponseEntity<ApiResponse<Void>> lockEscrow(
            @CurrentUser AuthUser currentUser,
            @RequestBody LockEscrowRequest req
    ) {
        walletService.lockEscrow(requireUser(currentUser).id(), req.getAmount(), req.getProjectId(), req.getMilestoneId());
        return ResponseEntity.ok(ApiResponse.ok("Funds held in escrow for milestone", null));
    }

    @PostMapping("/escrow/release")
    public ResponseEntity<ApiResponse<Invoice>> releaseEscrow(
            @CurrentUser AuthUser currentUser,
            @RequestBody ReleaseEscrowRequest req
    ) {
        Invoice invoice = walletService.releaseEscrowToFreelancer(
                requireUser(currentUser).id(),
                req.getFreelancerId(),
                req.getAmount(),
                req.getProjectId(),
                req.getMilestoneId(),
                req.getMilestoneTitle() != null ? req.getMilestoneTitle() : "Project Milestone"
        );
        return ResponseEntity.ok(ApiResponse.ok("Escrow released and invoice generated", invoice));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    @Data
    public static class CreateOrderRequest {
        @NotNull(message = "Payment purpose is required")
        private PaymentOrder.Purpose purpose;
        private UUID packageId;
        private BigDecimal amount;
    }

    @Data
    public static class VerifyPaymentRequest {
        @NotBlank(message = "Payment id is required")
        private String paymentId;
        @NotBlank(message = "Payment signature is required")
        private String signature;
    }

    @Data
    public static class LockEscrowRequest {
        private UUID projectId;
        private UUID milestoneId;
        private BigDecimal amount;
    }

    @Data
    public static class ReleaseEscrowRequest {
        private UUID freelancerId;
        private UUID projectId;
        private UUID milestoneId;
        private String milestoneTitle;
        private BigDecimal amount;
    }
}
