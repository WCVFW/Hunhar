package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    public enum Status { DRAFT, OPEN, IN_PROGRESS, DISPUTED, COMPLETED, CANCELLED }

    public enum BudgetType { FIXED, HOURLY }

    /** PLATFORM = escrow through THEUNOiA (commission applies); DIRECT = client pays freelancer directly. */
    public enum PaymentMode { PLATFORM, DIRECT }

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(name = "category_id")
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "budget_type", nullable = false)
    private BudgetType budgetType = BudgetType.FIXED;

    @Column(name = "budget_min", nullable = false)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", nullable = false)
    private BigDecimal budgetMax;

    @Column(nullable = false)
    private String currency = "INR";

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    private PaymentMode paymentMode = PaymentMode.PLATFORM;

    @Column(name = "credit_cost", nullable = false)
    private int creditCost;

    /** Maintained by the trg_bids_count PL/pgSQL trigger - never written by JPA. */
    @Column(name = "bid_count", insertable = false, updatable = false)
    private int bidCount;

    @Column(name = "awarded_bid_id")
    private UUID awardedBidId;

    @Column(name = "freelancer_id")
    private UUID freelancerId;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "awarded_at")
    private Instant awardedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @ElementCollection
    @CollectionTable(name = "project_skills", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "skill")
    private Set<String> skills = new LinkedHashSet<>();

    @Version
    private long version;

    public boolean isOwnedBy(UUID userId) {
        return clientId.equals(userId);
    }

    public boolean isAssignedTo(UUID userId) {
        return freelancerId != null && freelancerId.equals(userId);
    }
}
