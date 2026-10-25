package com.theunoia.billing.web;

import com.theunoia.billing.domain.PayoutRequest;
import com.theunoia.billing.domain.Transaction;
import com.theunoia.billing.domain.Wallet;
import com.theunoia.billing.service.WalletService;
import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Wallet top-ups go through {@code POST /api/v1/payments/orders} (purpose WALLET_TOPUP). */
@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/my-wallet")
    public ResponseEntity<ApiResponse<Wallet>> getMyWallet(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getOrCreateWallet(requireUser(currentUser).id())));
    }

    @PostMapping("/payout")
    public ResponseEntity<ApiResponse<PayoutRequest>> requestPayout(
            @CurrentUser AuthUser currentUser,
            @RequestParam BigDecimal amount,
            @RequestParam String payoutMethod,
            @RequestParam String accountDetails
    ) {
        PayoutRequest req = walletService.requestPayout(requireUser(currentUser).id(), amount, payoutMethod, accountDetails);
        return ResponseEntity.ok(ApiResponse.ok("Withdrawal requested. It is usually processed within 1-2 business days.", req));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getTransactions(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getTransactions(requireUser(currentUser).id())));
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<List<PayoutRequest>>> getPayouts(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getFreelancerPayouts(requireUser(currentUser).id())));
    }

    @PostMapping("/payouts/{payoutId}/process")
    public ResponseEntity<ApiResponse<Void>> processPayout(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID payoutId,
            @RequestParam boolean approve,
            @RequestParam(required = false, defaultValue = "Processed by admin") String notes
    ) {
        if (!requireUser(currentUser).hasRole("ADMIN")) {
            throw new ForbiddenException("Admin access required");
        }
        walletService.processPayout(payoutId, approve, notes);
        return ResponseEntity.ok(ApiResponse.ok("Payout status updated", null));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }
}
