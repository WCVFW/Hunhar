package com.theunoia.project.domain;

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
@Table(name = "bids")
public class Bid extends BaseEntity {

    public enum Status { SUBMITTED, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN }

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    /** Proposed cost. */
    @Column(nullable = false)
    private BigDecimal amount;

    /** Delivery timeline in days. */
    @Column(name = "delivery_days", nullable = false)
    private int deliveryDays;

    /** Proposal message. */
    @Column(nullable = false)
    private String proposal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SUBMITTED;

    @Column(name = "credits_spent", nullable = false)
    private int creditsSpent;

    @Column(name = "shortlisted_at")
    private Instant shortlistedAt;

    @Version
    private long version;

    public boolean isOpen() {
        return status == Status.SUBMITTED || status == Status.SHORTLISTED;
    }
}
