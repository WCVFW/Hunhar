package com.theunoia.billing.service;

import com.theunoia.billing.domain.*;
import com.theunoia.billing.repository.PaymentOrderRepository;
import com.theunoia.billing.repository.PayoutRequestRepository;
import com.theunoia.billing.repository.TransactionRepository;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.common.security.EncryptionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Read models for the admin dashboard and platform-wide money stats. */
@Service
@RequiredArgsConstructor
public class BillingAdminService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final TransactionRepository transactionRepository;
    private final PayoutRequestRepository payoutRepository;
    private final PaymentOrderRepository orderRepository;
    private final UserDirectoryClient userDirectory;
    private final EncryptionUtils encryptionUtils;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> transactions(TransactionType type) {
        List<Transaction> list = type == null
                ? transactionRepository.findTop500ByOrderByCreatedAtDesc()
                : transactionRepository.findTop500ByTypeOrderByCreatedAtDesc(type);
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(list.stream().map(Transaction::getUserId).collect(Collectors.toSet()));
        return list.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("userId", t.getUserId());
            UserDirectoryClient.UserInfo u = users.get(t.getUserId());
            m.put("userName", u != null ? u.fullName() : null);
            m.put("userRole", u != null ? u.role() : null);
            m.put("type", t.getType());
            m.put("status", t.getStatus());
            m.put("amount", t.getAmount());
            m.put("description", t.getDescription());
            m.put("projectId", t.getProjectId());
            m.put("gatewayRefId", t.getGatewayRefId());
            m.put("createdAt", t.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    /** Payout requests with decrypted account details — admin only. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> payouts(PayoutStatus status) {
        List<PayoutRequest> list = status == null ? payoutRepository.findTop500ByOrderByCreatedAtDesc()
                : payoutRepository.findByStatusOrderByCreatedAtAsc(status);
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(list.stream().map(PayoutRequest::getFreelancerId).collect(Collectors.toSet()));
        return list.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("freelancerId", p.getFreelancerId());
            UserDirectoryClient.UserInfo u = users.get(p.getFreelancerId());
            m.put("freelancerName", u != null ? u.fullName() : null);
            m.put("amount", p.getAmount());
            m.put("payoutMethod", p.getPayoutMethod());
            String details;
            try {
                details = encryptionUtils.decrypt(p.getAccountDetails());
            } catch (Exception e) {
                details = "(unreadable)";
            }
            m.put("accountDetails", details);
            m.put("status", p.getStatus());
            m.put("adminNotes", p.getAdminNotes());
            m.put("createdAt", p.getCreatedAt());
            m.put("updatedAt", p.getUpdatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * GMV = gross milestone payments released from escrow (ESCROW_RELEASE).
     * Commission = GMV - net credited to freelancers (MILESTONE_EARNING).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> stats() {
        Instant epoch = Instant.EPOCH;
        Instant now = Instant.now().plusSeconds(60);
        Map<String, Object> s = new LinkedHashMap<>();

        BigDecimal gross = transactionRepository.sumByTypeBetween(TransactionType.ESCROW_RELEASE, epoch, now);
        BigDecimal net = transactionRepository.sumByTypeBetween(TransactionType.MILESTONE_EARNING, epoch, now);
        s.put("gmv", gross);
        s.put("commissionEarned", gross.subtract(net).max(BigDecimal.ZERO));
        s.put("escrowHeld", transactionRepository.sumByTypeBetween(TransactionType.ESCROW_HOLD, epoch, now)
                .subtract(gross).subtract(transactionRepository.sumByTypeBetween(TransactionType.REFUND, epoch, now)).max(BigDecimal.ZERO));
        s.put("walletTopups", orderRepository.sumByPurposeAndStatus(PaymentOrder.Purpose.WALLET_TOPUP, PaymentOrder.Status.PAID));
        // Credit packs paid by UPI/card (payment orders) plus those paid from wallet balance
        BigDecimal gatewayCredits = orderRepository.sumByPurposeAndStatus(PaymentOrder.Purpose.CREDIT_PACKAGE, PaymentOrder.Status.PAID);
        BigDecimal walletCredits = transactionRepository.sumByType(TransactionType.CREDIT_PURCHASE);
        s.put("creditSales", (gatewayCredits == null ? BigDecimal.ZERO : gatewayCredits).add(walletCredits == null ? BigDecimal.ZERO : walletCredits));

        List<PayoutRequest> pending = Stream.concat(
                payoutRepository.findByStatus(PayoutStatus.REQUESTED).stream(),
                payoutRepository.findByStatus(PayoutStatus.PROCESSING).stream()).toList();
        s.put("pendingPayoutsCount", pending.size());
        s.put("pendingPayoutsAmount", pending.stream().map(PayoutRequest::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Map<String, Object>> monthly = new ArrayList<>();
        YearMonth current = YearMonth.now(IST);
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            Instant from = ym.atDay(1).atStartOfDay(IST).toInstant();
            Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(IST).toInstant();
            BigDecimal g = transactionRepository.sumByTypeBetween(TransactionType.ESCROW_RELEASE, from, to);
            BigDecimal n = transactionRepository.sumByTypeBetween(TransactionType.MILESTONE_EARNING, from, to);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear());
            m.put("gmv", g);
            m.put("commission", g.subtract(n).max(BigDecimal.ZERO));
            monthly.add(m);
        }
        s.put("monthly", monthly);
        return s;
    }

}
