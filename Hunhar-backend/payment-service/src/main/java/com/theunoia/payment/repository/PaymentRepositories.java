package com.theunoia.payment.repository;

import com.theunoia.payment.domain.Commission;
import com.theunoia.payment.domain.DirectPayment;
import com.theunoia.payment.domain.EscrowHolding;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Refund;
import com.theunoia.payment.domain.Wallet;
import com.theunoia.payment.domain.Withdrawal;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class PaymentRepositories {

    private PaymentRepositories() {
    }

    public interface WalletRepository extends JpaRepository<Wallet, UUID> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
        Optional<Wallet> findForUpdate(@Param("userId") UUID userId);
    }

    public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, UUID> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT o FROM PaymentOrder o WHERE o.providerOrderId = :providerOrderId")
        Optional<PaymentOrder> findByProviderOrderIdForUpdate(@Param("providerOrderId") String providerOrderId);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT o FROM PaymentOrder o WHERE o.id = :id")
        Optional<PaymentOrder> findByIdForUpdate(@Param("id") UUID id);

        boolean existsByReferenceIdAndPurposeAndStatusIn(UUID referenceId, PaymentOrder.Purpose purpose, List<PaymentOrder.Status> statuses);

        Page<PaymentOrder> findByUserId(UUID userId, Pageable pageable);

        Page<PaymentOrder> findByStatus(PaymentOrder.Status status, Pageable pageable);

        @Query("SELECT COALESCE(SUM(o.amount), 0) FROM PaymentOrder o WHERE o.status IN ('CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED')")
        BigDecimal totalCaptured();

        @Query("SELECT COALESCE(SUM(o.amount), 0) FROM PaymentOrder o WHERE o.userId = :userId AND o.purpose = 'PROJECT_PAYMENT' AND o.status = 'CAPTURED'")
        BigDecimal totalSpentByClient(@Param("userId") UUID userId);
    }

    public interface EscrowRepository extends JpaRepository<EscrowHolding, UUID> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT e FROM EscrowHolding e WHERE e.milestoneId = :milestoneId")
        Optional<EscrowHolding> findByMilestoneIdForUpdate(@Param("milestoneId") UUID milestoneId);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT e FROM EscrowHolding e WHERE e.id = :id")
        Optional<EscrowHolding> findByIdForUpdate(@Param("id") UUID id);

        @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowHolding e WHERE e.freelancerId = :userId AND e.status = 'HELD'")
        BigDecimal heldForFreelancer(@Param("userId") UUID userId);

        @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowHolding e WHERE e.clientId = :userId AND e.status = 'HELD'")
        BigDecimal heldByClient(@Param("userId") UUID userId);

        @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowHolding e WHERE e.status = 'HELD'")
        BigDecimal totalHeld();

        Page<EscrowHolding> findByStatus(EscrowHolding.Status status, Pageable pageable);

        List<EscrowHolding> findByClientIdAndStatus(UUID clientId, EscrowHolding.Status status);
    }

    public interface CommissionRepository extends JpaRepository<Commission, UUID> {
        @Query("SELECT COALESCE(SUM(c.commissionAmount), 0) FROM Commission c")
        BigDecimal totalCommission();

        @Query("SELECT COALESCE(SUM(c.gstAmount), 0) FROM Commission c")
        BigDecimal totalGst();
    }

    public interface PayoutAccountRepository extends JpaRepository<PayoutAccount, UUID> {
        List<PayoutAccount> findByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId);

        Optional<PayoutAccount> findByIdAndUserId(UUID id, UUID userId);
    }

    public interface WithdrawalRepository extends JpaRepository<Withdrawal, UUID> {
        Page<Withdrawal> findByUserId(UUID userId, Pageable pageable);

        Page<Withdrawal> findByStatus(Withdrawal.Status status, Pageable pageable);

        Optional<Withdrawal> findByProviderPayoutId(String providerPayoutId);

        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.userId = :userId AND w.status IN ('REQUESTED', 'PROCESSING')")
        BigDecimal pendingForUser(@Param("userId") UUID userId);

        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.status IN ('REQUESTED', 'PROCESSING')")
        BigDecimal totalPending();
    }

    public interface RefundRepository extends JpaRepository<Refund, UUID> {
        Page<Refund> findByStatus(Refund.Status status, Pageable pageable);
    }

    public interface DirectPaymentRepository extends JpaRepository<DirectPayment, UUID> {
        List<DirectPayment> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    }

    public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
        Page<Invoice> findByUserId(UUID userId, Pageable pageable);

        Optional<Invoice> findByTypeAndReferenceIdAndUserId(Invoice.Type type, UUID referenceId, UUID userId);
    }
}
