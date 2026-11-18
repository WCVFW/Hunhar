package com.theunoia.billing.service;

import com.theunoia.common.internal.InternalClient;
import com.theunoia.common.internal.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Weekly automatic withdrawals: every Monday 10:00 IST, each freelancer who turned on "Auto-withdraw earnings
 * weekly" gets a withdrawal request for their whole available balance (when it is at least the minimum payout
 * and they have no request waiting). Requests go through the same checks as a manual withdrawal (KYC, payout
 * details) and wait for admin approval like any other.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoWithdrawJob {

    private final WalletService walletService;
    private final PlatformSettingsService settings;
    private final InternalClient internalClient;
    private final NotificationPublisher notifications;

    @Scheduled(cron = "${theunoia.payouts.auto-withdraw-cron:0 0 10 * * MON}", zone = "Asia/Kolkata")
    public void run() {
        List<UUID> ids;
        try {
            ids = internalClient.get(internalClient.identity() + "/internal/freelancers/auto-withdraw",
                    new ParameterizedTypeReference<List<UUID>>() {});
        } catch (Exception e) {
            log.warn("Auto-withdraw skipped: could not load freelancers ({})", e.getMessage());
            return;
        }
        if (ids == null || ids.isEmpty()) return;
        BigDecimal min = BigDecimal.valueOf(settings.getInt(PlatformSettingsService.MIN_PAYOUT));
        int created = 0;
        for (UUID id : ids) {
            try {
                BigDecimal amount = walletService.availableBalance(id).setScale(0, RoundingMode.DOWN);
                if (amount.compareTo(min) < 0 || walletService.hasPendingPayout(id)) continue;
                Map<String, Object> payout = walletService.savedPayoutDetails(id);
                if (payout == null || !Boolean.TRUE.equals(payout.get("configured")) || !Boolean.TRUE.equals(payout.get("autoWithdrawal"))) continue;
                walletService.requestPayout(id, amount, String.valueOf(payout.get("method")), String.valueOf(payout.get("details")));
                notifications.notify(id, "PAYOUT_REQUESTED", "Weekly withdrawal requested",
                        "We requested a withdrawal of \u20b9" + amount.toPlainString() + " to your saved payout account. "
                                + "It usually arrives within 1-2 business days.", "/freelancer/wallet");
                created++;
            } catch (Exception e) {
                // e.g. KYC not verified or invalid payout details: tell the freelancer why nothing was withdrawn
                log.info("Auto-withdraw for {} not created: {}", id, e.getMessage());
                notifications.notify(id, "PAYOUT_REJECTED", "Weekly withdrawal not created",
                        e.getMessage() == null ? "Please check your payout settings." : e.getMessage(), "/freelancer/settings");
            }
        }
        log.info("Auto-withdraw: {} withdrawal request(s) created for {} freelancer(s) with auto-withdraw on", created, ids.size());
    }
}
