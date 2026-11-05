package com.theunoia.billing.web;

import com.theunoia.billing.domain.CreditLedger;
import com.theunoia.billing.domain.CreditPackage;
import com.theunoia.billing.domain.CreditWallet;
import com.theunoia.billing.service.CreditService;
import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Credits are bought through {@code POST /api/v1/payments/orders} (purpose CREDIT_PACKAGE) and
 * spent by project-service via the internal API — neither is possible directly from here.
 */
@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;
    private final com.theunoia.billing.service.PaymentService paymentService;

    @GetMapping("/my-credits")
    public ResponseEntity<ApiResponse<CreditWallet>> getMyCredits(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(creditService.getOrCreateWallet(requireUser(currentUser).id())));
    }

    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<CreditPackage>>> getAvailablePackages() {
        return ResponseEntity.ok(ApiResponse.ok(creditService.getAvailablePackages()));
    }

    /** Buy a credit pack using the wallet balance instead of UPI / card. */
    @PostMapping("/buy-with-wallet")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> buyWithWallet(
            @CurrentUser AuthUser currentUser, @RequestBody java.util.Map<String, String> body) {
        UUID userId = requireUser(currentUser).id();
        UUID packageId;
        try {
            packageId = UUID.fromString(String.valueOf(body.get("packageId")));
        } catch (IllegalArgumentException e) {
            throw new com.theunoia.common.exception.BadRequestException("Choose a credit package");
        }
        return ResponseEntity.ok(ApiResponse.ok("Credits added", paymentService.buyCreditsWithWallet(userId, packageId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<CreditLedger>>> getCreditHistory(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(creditService.getHistory(requireUser(currentUser).id())));
    }

    @PostMapping("/admin/allocate")
    public ResponseEntity<ApiResponse<CreditWallet>> adminAllocate(
            @CurrentUser AuthUser currentUser,
            @RequestParam UUID userId,
            @RequestParam int credits,
            @RequestParam String reason
    ) {
        if (!requireUser(currentUser).hasRole("ADMIN")) {
            throw new ForbiddenException("Admin access required");
        }
        return ResponseEntity.ok(ApiResponse.ok(creditService.adminAllocateCredits(userId, credits, reason)));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }
}
