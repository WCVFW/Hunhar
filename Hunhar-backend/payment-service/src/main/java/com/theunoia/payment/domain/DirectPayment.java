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

/** "Direct Payments" model: client pays the freelancer outside the platform; we only record it. */
@Getter
@Setter
@Entity
@Table(name = "direct_payments")
public class DirectPayment extends BaseEntity {

    public enum Status { RECORDED, CONFIRMED, DISPUTED }

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String method;

    private String reference;
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.RECORDED;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;
}
