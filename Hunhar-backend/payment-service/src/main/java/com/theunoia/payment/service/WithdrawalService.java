package com.theunoia.payment.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.util.CryptoUtil;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Wallet;
import com.theunoia.payment.domain.Withdrawal;
import com.theunoia.payment.gateway.GatewayConfig.GatewayRegistry;
import com.theunoia.payment.gateway.PayoutGateway;
import com.theunoia.payment.repository.PaymentRepositories.PayoutAccountRepository;
import com.theunoia.payment.repository.PaymentRepositories.WalletRepository;
import com.theunoia.payment.repository.PaymentRepositories.WithdrawalRepository;
import com.theunoia.payment.service.LedgerService.Account;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Wallet withdrawals (Bank Transfer / UPI via RazorpayX Payouts) with admin payout approval. */
@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final WithdrawalRepository withdrawals;
    private final PayoutAccountRepository accounts;
    private final WalletRepository wallets;
    private final GatewayRegistry gateways;
    private final LedgerService ledger;
    private final InvoiceService invoices;
    private final EventPublisher events;
    private final PaymentProperties props;

    public record PayoutAccountRequest(PayoutAccount.Type type, String accountHolderName, String accountNumber, String ifsc,
                                       String upiId, boolean makeDefault) {
    }

    @Transactional
    public PayoutAccount addAccount(AuthUser user, PayoutAccountRequest req) {
        PayoutAccount a = new PayoutAccount();
        a.setUserId(user.id());
        a.setType(req.type());
        a.setAccountHolderName(req.accountHolderName().trim());
        if (req.type() == PayoutAccount.Type.BANK) {
            if (req.accountNumber() == null || !req.accountNumber().matches("^\\d{9,18}$")) {
                throw ApiException.badRequest("Account number must be 9-18 digits");
            }
            if (req.ifsc() == null || !req.ifsc().toUpperCase().matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
                throw ApiException.badRequest("Invalid IFSC code");
            }
            a.setAccountNumberEncrypted(CryptoUtil.encrypt(req.accountNumber(), props.getEncryptionKey()));
            a.setAccountLast4(req.accountNumber().substring(req.accountNumber().length() - 4));
            a.setIfsc(req.ifsc().toUpperCase());
        } else {
            if (req.upiId() == null || !req.upiId().matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$")) {
                throw ApiException.badRequest("Invalid UPI ID");
            }
            a.setUpiId(req.upiId());
        }
        List<PayoutAccount> existing = accounts.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.id());
        if (req.makeDefault() || existing.isEmpty()) {
            existing.forEach(x -> x.setDefaultAccount(false));
            a.setDefaultAccount(true);
        }
        return accounts.save(a);
    }

    @Transactional(readOnly = true)
    public List<PayoutAccount> myAccounts(AuthUser user) {
        return accounts.findByUserIdAndActiveTrueOrderByCreatedAtDesc(user.id());
    }

    @Transactional
    public void removeAccount(AuthUser user, UUID accountId) {
        accounts.findByIdAndUserId(accountId, user.id()).orElseThrow(() -> ApiException.notFound("Payout account")).setActive(false);
    }

    /** Funds are reserved immediately (moved out of available balance) so they cannot be spent twice. */
    @Transactional
    public Withdrawal request(AuthUser user, UUID payoutAccountId, BigDecimal amount) {
        if (amount.compareTo(props.getMinWithdrawal()) < 0) {
            throw ApiException.badRequest("Minimum withdrawal amount is INR " + props.getMinWithdrawal());
        }
        PayoutAccount account = accounts.findByIdAndUserId(payoutAccountId, user.id()).filter(PayoutAccount::isActive)
                .orElseThrow(() -> ApiException.notFound("Payout account"));
        Wallet wallet = wallets.findForUpdate(user.id()).orElseThrow(() -> ApiException.unprocessable("INSUFFICIENT_BALANCE", "No wallet balance"));
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw ApiException.unprocessable("INSUFFICIENT_BALANCE", "Withdrawal exceeds available balance");
        }
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        Withdrawal w = new Withdrawal();
        w.setUserId(user.id());
        w.setPayoutAccountId(account.getId());
        w.setAmount(amount);
        withdrawals.save(w);
        ledger.debit(user.id(), Account.WALLET, "WITHDRAWAL_RESERVED", amount, wallet.getAvailableBalance(), "WITHDRAWAL", w.getId(),
                "Withdrawal requested");
        ledger.credit(user.id(), Account.PAYOUT_PENDING, "WITHDRAWAL_RESERVED", amount, null, "WITHDRAWAL", w.getId(), "Awaiting payout");
        events.publish("withdrawal.requested", Map.of("withdrawalId", w.getId(), "userId", user.id(), "amount", amount));
        return w;
    }

    /** Admin "Payout Approval": sends money through the payout rail. */
    @Transactional
    public Withdrawal approve(AuthUser admin, UUID withdrawalId) {
        Withdrawal w = withdrawals.findById(withdrawalId).orElseThrow(() -> ApiException.notFound("Withdrawal"));
        if (w.getStatus() != Withdrawal.Status.REQUESTED) throw ApiException.unprocessable("INVALID_STATE", "Withdrawal already reviewed");
        PayoutAccount account = accounts.findById(w.getPayoutAccountId()).orElseThrow(() -> ApiException.notFound("Payout account"));
        PayoutGateway payouts = gateways.payouts();
        if (account.getProviderFundAccountId() == null) {
            String plain = account.getAccountNumberEncrypted() == null ? null
                    : CryptoUtil.decrypt(account.getAccountNumberEncrypted(), props.getEncryptionKey());
            PayoutGateway.FundAccount fa = payouts.register(account, plain, null);
            account.setProviderContactId(fa.contactId());
            account.setProviderFundAccountId(fa.fundAccountId());
        }
        w.setReviewedBy(admin.id());
        w.setReviewedAt(Instant.now());
        PayoutGateway.PayoutResult result = payouts.payout(w, account);
        w.setProviderPayoutId(result.payoutId());
        switch (result.status()) {
            case PROCESSED -> complete(w);
            case FAILED -> fail(w, result.failureReason());
            default -> w.setStatus(Withdrawal.Status.PROCESSING);
        }
        return w;
    }

    @Transactional
    public Withdrawal reject(AuthUser admin, UUID withdrawalId, String reason) {
        Withdrawal w = withdrawals.findById(withdrawalId).orElseThrow(() -> ApiException.notFound("Withdrawal"));
        if (w.getStatus() != Withdrawal.Status.REQUESTED) throw ApiException.unprocessable("INVALID_STATE", "Withdrawal already reviewed");
        w.setReviewedBy(admin.id());
        w.setReviewedAt(Instant.now());
        returnFunds(w, Withdrawal.Status.REJECTED, reason);
        return w;
    }

    /** Payout webhooks (payout.processed / payout.failed / payout.reversed). */
    @Transactional
    public void onPayoutWebhook(String payoutId, boolean success, String reason) {
        withdrawals.findByProviderPayoutId(payoutId).ifPresent(w -> {
            if (w.getStatus() != Withdrawal.Status.PROCESSING) return;
            if (success) complete(w);
            else fail(w, reason);
        });
    }

    private void complete(Withdrawal w) {
        w.setStatus(Withdrawal.Status.COMPLETED);
        w.setProcessedAt(Instant.now());
        Wallet wallet = wallets.findForUpdate(w.getUserId()).orElseThrow();
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(w.getAmount()));
        ledger.debit(w.getUserId(), Account.PAYOUT_PENDING, "PAYOUT_SENT", w.getAmount(), null, "WITHDRAWAL", w.getId(), "Paid out");
        ledger.credit(w.getUserId(), Account.EXTERNAL, "PAYOUT_SENT", w.getAmount(), null, "WITHDRAWAL", w.getId(), "Bank/UPI transfer");
        invoices.issue(Invoice.Type.WITHDRAWAL, w.getUserId(), "WITHDRAWAL", w.getId(), "Wallet withdrawal payout",
                w.getAmount(), BigDecimal.ZERO);
        events.publish("withdrawal.completed", Map.of("withdrawalId", w.getId(), "userId", w.getUserId(), "amount", w.getAmount()));
    }

    private void fail(Withdrawal w, String reason) {
        returnFunds(w, Withdrawal.Status.FAILED, reason);
    }

    private void returnFunds(Withdrawal w, Withdrawal.Status status, String reason) {
        w.setStatus(status);
        w.setFailureReason(reason);
        w.setProcessedAt(Instant.now());
        Wallet wallet = wallets.findForUpdate(w.getUserId()).orElseThrow();
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(w.getAmount()));
        ledger.debit(w.getUserId(), Account.PAYOUT_PENDING, "WITHDRAWAL_REVERSED", w.getAmount(), null, "WITHDRAWAL", w.getId(), reason);
        ledger.credit(w.getUserId(), Account.WALLET, "WITHDRAWAL_REVERSED", w.getAmount(), wallet.getAvailableBalance(), "WITHDRAWAL",
                w.getId(), "Funds returned to wallet");
        events.publish("withdrawal." + status.name().toLowerCase(), Map.of("withdrawalId", w.getId(), "userId", w.getUserId(),
                "amount", w.getAmount(), "reason", reason == null ? "" : reason));
    }

    @Transactional(readOnly = true)
    public PageResponse<Withdrawal> mine(AuthUser user, int page, int size) {
        return PageResponse.of(withdrawals.findByUserId(user.id(), Pagination.newestFirst(page, size)), w -> w);
    }

    @Transactional(readOnly = true)
    public PageResponse<Withdrawal> list(Withdrawal.Status status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? withdrawals.findAll(pageable) : withdrawals.findByStatus(status, pageable), w -> w);
    }
}
