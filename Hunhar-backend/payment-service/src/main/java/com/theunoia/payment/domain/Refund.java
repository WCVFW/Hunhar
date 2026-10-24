package com.theunoia.payment.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "refunds")
public class Refund extends BaseEntity {

    public enum Status { REQUESTED, PROCESSED, REJECTED, FAILED }

    @Column(name = "escrow_id", nullable = false)
    private UUID escrowId;

    @Column(name = "payment_order_id", nullable = false)
    private UUID paymentOrderId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REQUESTED;

    @Column(name = "provider_refund_id")
    private String providerRefundId;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "processed_at")
    private Instant processedAt;
}
