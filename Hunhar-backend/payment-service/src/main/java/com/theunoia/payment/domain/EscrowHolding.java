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

/** Client money held by the platform for one milestone until approval (release) or refund. */
@Getter
@Setter
@Entity
@Table(name = "escrow_holdings")
public class EscrowHolding extends BaseEntity {

    public enum Status { HELD, RELEASED, REFUNDED, SPLIT }

    @Column(name = "payment_order_id", nullable = false)
    private UUID paymentOrderId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "milestone_id", nullable = false)
    private UUID milestoneId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "released_amount", nullable = false)
    private BigDecimal releasedAmount = BigDecimal.ZERO;

    @Column(name = "refunded_amount", nullable = false)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.HELD;

    @Column(name = "settled_at")
    private Instant settledAt;

    @Version
    private long version;
}
