package com.theunoia.billing.service;

import com.theunoia.billing.domain.*;
import com.theunoia.billing.repository.PayoutRequestRepository;
import com.theunoia.billing.repository.TransactionRepository;
import com.theunoia.billing.repository.WalletRepository;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.EncryptionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final BigDecimal MIN_PAYOUT = new BigDecimal("100");

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PayoutRequestRepository payoutRequestRepository;
    private final InvoiceService invoiceService;
    private final EncryptionUtils encryptionUtils;
    private final NotificationPublisher notifications;

    @Transactional
    public Wallet getOrCreateWallet(UUID userId) {
        return walletRepository.findById(userId)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .userId(userId)
                        .availableBalance(BigDecimal.ZERO)
                        .escrowBalance(BigDecimal.ZERO)
                        .totalEarned(BigDecimal.ZERO)
                        .totalWithdrawn(BigDecimal.ZERO)
                        .build()));
    }

    /** Only called by PaymentService after a verified gateway payment. */
    @Transactional
    public Transaction depositFunds(UUID userId, BigDecimal amount, String gatewayRefId) {
        getOrCreateWallet(userId);
        Wallet wallet = walletRepository.findByIdForUpdate(userId).orElseThrow();
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        walletRepository.save(wallet);

        return transactionRepository.save(Transaction.builder()
                .userId(userId)
                .amount(amount)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.COMPLETED)
                .gatewayRefId(gatewayRefId)
                .description("Wallet top-up")
                .build());
    }

    @Transactional
    public void lockEscrow(UUID clientId, BigDecimal amount, UUID projectId, UUID milestoneId) {
        if (amount == null || amount.signum() <= 0) {
            throw new BadRequestException("Escrow amount must be positive");
        }
        getOrCreateWallet(clientId);
        Wallet wallet = walletRepository.findByIdForUpdate(clientId).orElseThrow();
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient wallet balance to fund milestone escrow");
        }

        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        wallet.setEscrowBalance(wallet.getEscrowBalance().add(amount));
        walletRepository.save(wallet);

        transactionRepository.save(Transaction.builder()
                .userId(clientId)
                .amount(amount)
                .type(TransactionType.ESCROW_HOLD)
                .status(TransactionStatus.COMPLETED)
                .projectId(projectId)
                .milestoneId(milestoneId)
                .description("Funds held in escrow for milestone")
                .build());
    }

    @Transactional
    public Invoice releaseEscrowToFreelancer(UUID clientId, UUID freelancerId, BigDecimal amount, UUID projectId, UUID milestoneId, String milestoneTitle) {
        if (amount == null || amount.signum() <= 0 || freelancerId == null) {
            throw new BadRequestException("Freelancer and a positive amount are required");
        }
        getOrCreateWallet(clientId);
        Wallet clientWallet = walletRepository.findByIdForUpdate(clientId).orElseThrow();
        if (clientWallet.getEscrowBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Escrow balance is insufficient");
        }

        clientWallet.setEscrowBalance(clientWallet.getEscrowBalance().subtract(amount));
        walletRepository.save(clientWallet);

        // Platform commission is 10%
        BigDecimal commission = amount.multiply(new BigDecimal("0.10"));
        BigDecimal netToFreelancer = amount.subtract(commission);

        getOrCreateWallet(freelancerId);
        Wallet freelancerWallet = walletRepository.findByIdForUpdate(freelancerId).orElseThrow();
        freelancerWallet.setAvailableBalance(freelancerWallet.getAvailableBalance().add(netToFreelancer));
        freelancerWallet.setTotalEarned(freelancerWallet.getTotalEarned().add(netToFreelancer));
        walletRepository.save(freelancerWallet);

        transactionRepository.save(Transaction.builder()
                .userId(clientId)
                .amount(amount)
                .type(TransactionType.ESCROW_RELEASE)
                .status(TransactionStatus.COMPLETED)
                .projectId(projectId)
                .milestoneId(milestoneId)
                .description("Escrow released to freelancer")
                .build());

        transactionRepository.save(Transaction.builder()
                .userId(freelancerId)
                .amount(netToFreelancer)
                .type(TransactionType.ESCROW_RELEASE)
                .status(TransactionStatus.COMPLETED)
                .projectId(projectId)
                .milestoneId(milestoneId)
                .description("Milestone payment: " + milestoneTitle + " (after 10% platform fee)")
                .build());

        notifications.notify(freelancerId, "PAYMENT_RECEIVED", "Payment received 💰",
                "₹" + netToFreelancer.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                        + " for \"" + milestoneTitle + "\" was added to your wallet.",
                "/freelancer/wallet");

        return invoiceService.generateMilestoneInvoice(clientId, freelancerId, projectId, milestoneId, milestoneTitle, amount);
    }

    @Transactional
    public PayoutRequest requestPayout(UUID freelancerId, BigDecimal amount, String method, String accountDetails) {
        if (amount == null || amount.compareTo(MIN_PAYOUT) < 0) {
            throw new BadRequestException("Minimum withdrawal amount is ₹100");
        }
        if (!"UPI".equals(method) && !"BANK_TRANSFER".equals(method)) {
            throw new BadRequestException("Payout method must be UPI or BANK_TRANSFER");
        }
        if (accountDetails == null || accountDetails.isBlank() || accountDetails.length() > 300) {
            throw new BadRequestException("Please enter your UPI ID or bank account details");
        }
        if ("UPI".equals(method) && !accountDetails.trim().matches("^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$")) {
            throw new BadRequestException("Invalid UPI ID (example: name@okhdfcbank)");
        }

        getOrCreateWallet(freelancerId);
        Wallet wallet = walletRepository.findByIdForUpdate(freelancerId).orElseThrow();
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient available balance for withdrawal");
        }

        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        walletRepository.save(wallet);

        transactionRepository.save(Transaction.builder()
                .userId(freelancerId)
                .amount(amount)
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.PENDING)
                .description("Withdrawal to " + ("UPI".equals(method) ? "UPI" : "bank account"))
                .build());

        return payoutRequestRepository.save(PayoutRequest.builder()
                .freelancerId(freelancerId)
                .amount(amount)
                .payoutMethod(method)
                .accountDetails(encryptionUtils.encrypt(accountDetails.trim()))
                .status(PayoutStatus.REQUESTED)
                .build());
    }

    @Transactional
    public void processPayout(UUID payoutId, boolean approve, String notes) {
        PayoutRequest req = payoutRequestRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout request not found"));
        if (req.getStatus() != PayoutStatus.REQUESTED && req.getStatus() != PayoutStatus.PROCESSING) {
            throw new BadRequestException("This payout was already processed");
        }

        Wallet wallet = walletRepository.findByIdForUpdate(req.getFreelancerId()).orElseThrow();
        if (approve) {
            req.setStatus(PayoutStatus.COMPLETED);
            wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(req.getAmount()));
        } else {
            req.setStatus(PayoutStatus.REJECTED);
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(req.getAmount())); // refund
        }
        walletRepository.save(wallet);
        req.setAdminNotes(notes);
        payoutRequestRepository.save(req);

        notifications.notify(req.getFreelancerId(), approve ? "PAYOUT_COMPLETED" : "PAYOUT_REJECTED",
                approve ? "Withdrawal completed" : "Withdrawal rejected",
                approve ? "₹" + req.getAmount().toPlainString() + " was sent to your account."
                        : "Your withdrawal of ₹" + req.getAmount().toPlainString() + " was refunded to your wallet. " + notes,
                "/freelancer/wallet");
    }

    public List<Transaction> getTransactions(UUID userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** Account details are stored encrypted and never returned to the browser. */
    @Transactional(readOnly = true)
    public List<PayoutRequest> getFreelancerPayouts(UUID freelancerId) {
        List<PayoutRequest> payouts = payoutRequestRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId);
        payouts.forEach(p -> p.setAccountDetails(null));
        return payouts;
    }
}
