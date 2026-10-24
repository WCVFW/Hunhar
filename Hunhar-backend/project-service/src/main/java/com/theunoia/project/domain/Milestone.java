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
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Milestone lifecycle (PLATFORM payments):
 * PENDING -> FUNDED (escrow captured) -> SUBMITTED -> APPROVED -> PAID (escrow released)
 *                                      \-> REVISION_REQUESTED -> SUBMITTED
 * DIRECT payments skip FUNDED/PAID: PENDING -> SUBMITTED -> APPROVED.
 */
@Getter
@Setter
@Entity
@Table(name = "milestones")
public class Milestone extends BaseEntity {

    public enum Status { PENDING, FUNDED, SUBMITTED, REVISION_REQUESTED, APPROVED, PAID, REFUNDED, CANCELLED }

    public static final Set<Status> SETTLED = EnumSet.of(Status.APPROVED, Status.PAID, Status.REFUNDED, Status.CANCELLED);

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private int position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "funded_at")
    private Instant fundedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Version
    private long version;
}
