package com.theunoia.billing.web;

import com.theunoia.billing.domain.CreditPackage;
import com.theunoia.billing.domain.PayoutStatus;
import com.theunoia.billing.domain.TransactionType;
import com.theunoia.billing.service.BillingAdminService;
import com.theunoia.billing.service.CreditService;
import com.theunoia.billing.service.PlatformSettingsService;
import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Platform settings (readable by every signed-in user) and admin-only money management. */
@RestController
@RequiredArgsConstructor
public class BillingAdminController {

    private final PlatformSettingsService settingsService;
    private final BillingAdminService adminService;
    private final CreditService creditService;

    @GetMapping("/api/v1/payments/settings")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSettings(@CurrentUser AuthUser user) {
        requireUser(user);
        return ResponseEntity.ok(ApiResponse.ok(settingsService.getAll()));
    }

    @PutMapping("/api/v1/payments/settings")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateSettings(@CurrentUser AuthUser user, @RequestBody Map<String, Object> changes) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok("Settings saved", settingsService.update(changes)));
    }

    @GetMapping("/api/v1/payments/admin/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(@CurrentUser AuthUser user) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok(adminService.stats()));
    }

    @GetMapping("/api/v1/payments/admin/transactions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> transactions(
            @CurrentUser AuthUser user, @RequestParam(required = false) TransactionType type) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok(adminService.transactions(type)));
    }

    @GetMapping("/api/v1/wallets/admin/payouts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> payouts(
            @CurrentUser AuthUser user, @RequestParam(required = false) PayoutStatus status) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok(adminService.payouts(status)));
    }

    @GetMapping("/api/v1/credits/admin/packages")
    public ResponseEntity<ApiResponse<List<CreditPackage>>> packages(@CurrentUser AuthUser user) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok(creditService.getAllPackages()));
    }

    @PostMapping("/api/v1/credits/admin/packages")
    public ResponseEntity<ApiResponse<CreditPackage>> createPackage(@CurrentUser AuthUser user, @RequestBody PackageRequest req) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok("Package created",
                creditService.savePackage(null, req.getName(), req.getCredits(), req.getPriceInInr(), req.isActive())));
    }

    @PutMapping("/api/v1/credits/admin/packages/{id}")
    public ResponseEntity<ApiResponse<CreditPackage>> updatePackage(@CurrentUser AuthUser user, @PathVariable UUID id, @RequestBody PackageRequest req) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok("Package updated",
                creditService.savePackage(id, req.getName(), req.getCredits(), req.getPriceInInr(), req.isActive())));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    private static void requireAdmin(AuthUser user) {
        if (!requireUser(user).hasRole("ADMIN")) throw new ForbiddenException("Admin access required");
    }

    @Data
    public static class PackageRequest {
        private String name;
        private int credits;
        private BigDecimal priceInInr;
        private boolean active = true;
    }
}
