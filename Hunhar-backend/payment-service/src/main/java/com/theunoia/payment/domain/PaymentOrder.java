package com.theunoia.payment.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payment_orders")
public class PaymentOrder extends BaseEntity {

    public enum Purpose { PROJECT_PAYMENT, CREDIT_PURCHASE }

    public enum Status { CREATED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Purpose purpose;

    /** milestoneId for PROJECT_PAYMENT, creditPurchaseId for CREDIT_PURCHASE. */
    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "payee_id")
    private UUID payeeId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "INR";

    @Column(nullable = false)
    private String provider;

    @Column(name = "provider_order_id")
    private String providerOrderId;

    @Column(name = "provider_payment_id")
    private String providerPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.CREATED;

    private String description;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "captured_at")
    private Instant capturedAt;

    @Version
    private long version;
}
