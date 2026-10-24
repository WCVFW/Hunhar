package com.theunoia.credit.domain;

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
@Table(name = "credit_purchases")
public class CreditPurchase extends BaseEntity {

    public enum Status { PENDING, COMPLETED, FAILED }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "package_id", nullable = false)
    private UUID packageId;

    @Column(nullable = false)
    private int credits;

    @Column(nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "payment_order_id")
    private UUID paymentOrderId;

    @Column(name = "completed_at")
    private Instant completedAt;
}
