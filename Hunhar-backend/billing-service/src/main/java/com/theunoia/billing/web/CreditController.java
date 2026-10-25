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

    @GetMapping("/my-credits")
    public ResponseEntity<ApiResponse<CreditWallet>> getMyCredits(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(creditService.getOrCreateWallet(requireUser(currentUser).id())));
    }

    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<CreditPackage>>> getAvailablePackages() {
        return ResponseEntity.ok(ApiResponse.ok(creditService.getAvailablePackages()));
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
