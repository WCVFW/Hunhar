package com.theunoia.billing.service;

import com.theunoia.billing.domain.CreditLedger;
import com.theunoia.billing.domain.CreditPackage;
import com.theunoia.billing.domain.CreditWallet;
import com.theunoia.billing.repository.CreditLedgerRepository;
import com.theunoia.billing.repository.CreditPackageRepository;
import com.theunoia.billing.repository.CreditWalletRepository;
import com.theunoia.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreditService {

    public static final int STARTER_CREDITS = 10;

    private final CreditWalletRepository creditWalletRepository;
    private final CreditLedgerRepository creditLedgerRepository;
    private final CreditPackageRepository creditPackageRepository;

    @Transactional
    public CreditWallet getOrCreateWallet(UUID userId) {
        return creditWalletRepository.findById(userId)
                .orElseGet(() -> {
                    CreditWallet wallet = creditWalletRepository.save(CreditWallet.builder()
                            .userId(userId)
                            .balance(STARTER_CREDITS)
                            .totalPurchased(0)
                            .totalConsumed(0)
                            .build());
                    record(userId, STARTER_CREDITS, "Welcome bonus — starter credits", null, wallet.getBalance());
                    return wallet;
                });
    }

    /** Row-locked so two simultaneous bids cannot spend the same credits. */
    @Transactional
    public boolean consumeCredits(UUID userId, UUID projectId, int creditsToDeduct) {
        getOrCreateWallet(userId);
        CreditWallet wallet = creditWalletRepository.findByIdForUpdate(userId).orElseThrow();
        if (wallet.getBalance() < creditsToDeduct) {
            return false;
        }
        wallet.setBalance(wallet.getBalance() - creditsToDeduct);
        wallet.setTotalConsumed(wallet.getTotalConsumed() + creditsToDeduct);
        creditWalletRepository.save(wallet);
        record(userId, -creditsToDeduct, "Proposal submitted", projectId, wallet.getBalance());
        return true;
    }

    /** Only called by PaymentService after a verified payment. */
    @Transactional
    public CreditWallet addPurchasedCredits(UUID userId, UUID packageId, String paymentRef) {
        CreditPackage pkg = creditPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit package not found"));
        getOrCreateWallet(userId);
        CreditWallet wallet = creditWalletRepository.findByIdForUpdate(userId).orElseThrow();
        wallet.setBalance(wallet.getBalance() + pkg.getCredits());
        wallet.setTotalPurchased(wallet.getTotalPurchased() + pkg.getCredits());
        creditWalletRepository.save(wallet);
        record(userId, pkg.getCredits(), "Purchased " + pkg.getName(), null, wallet.getBalance());
        return wallet;
    }

    @Transactional
    public CreditWallet adminAllocateCredits(UUID userId, int credits, String reason) {
        getOrCreateWallet(userId);
        CreditWallet wallet = creditWalletRepository.findByIdForUpdate(userId).orElseThrow();
        wallet.setBalance(Math.max(0, wallet.getBalance() + credits));
        creditWalletRepository.save(wallet);
        record(userId, credits, "Admin adjustment: " + reason, null, wallet.getBalance());
        return wallet;
    }

    public List<CreditLedger> getHistory(UUID userId) {
        return creditLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public List<CreditPackage> getAvailablePackages() {
        List<CreditPackage> packages = creditPackageRepository.findByIsActiveTrue();
        if (packages.isEmpty()) {
            packages = creditPackageRepository.saveAll(List.of(
                    CreditPackage.builder().name("Starter Pack").credits(20).priceInInr(new BigDecimal("199.00")).isActive(true).build(),
                    CreditPackage.builder().name("Pro Freelancer").credits(50).priceInInr(new BigDecimal("449.00")).isActive(true).build(),
                    CreditPackage.builder().name("Agency Pack").credits(120).priceInInr(new BigDecimal("999.00")).isActive(true).build()
            ));
        }
        packages.sort((a, b) -> a.getPriceInInr().compareTo(b.getPriceInInr()));
        return packages;
    }

    private void record(UUID userId, int delta, String reason, UUID projectId, int balanceAfter) {
        creditLedgerRepository.save(CreditLedger.builder()
                .userId(userId)
                .delta(delta)
                .reason(reason.length() > 100 ? reason.substring(0, 100) : reason)
                .projectId(projectId)
                .balanceAfter(balanceAfter)
                .build());
    }
}
