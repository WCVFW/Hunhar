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

/** REQUESTED -> (admin approval) PROCESSING -> COMPLETED | FAILED ; or REJECTED. Funds are reserved on request. */
@Getter
@Setter
@Entity
@Table(name = "withdrawals")
public class Withdrawal extends BaseEntity {

    public enum Status { REQUESTED, PROCESSING, COMPLETED, REJECTED, FAILED }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "payout_account_id", nullable = false)
    private UUID payoutAccountId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REQUESTED;

    @Column(name = "provider_payout_id")
    private String providerPayoutId;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Version
    private long version;
}
