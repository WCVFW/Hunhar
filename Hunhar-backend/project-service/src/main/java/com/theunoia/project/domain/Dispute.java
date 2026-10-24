package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "disputes")
public class Dispute extends BaseEntity {

    public enum Status { OPEN, UNDER_REVIEW, RESOLVED }

    public enum Resolution { REFUND_CLIENT, RELEASE_TO_FREELANCER, SPLIT, NO_ACTION }

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "milestone_id")
    private UUID milestoneId;

    @Column(name = "raised_by", nullable = false)
    private UUID raisedBy;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Enumerated(EnumType.STRING)
    private Resolution resolution;

    @Column(name = "freelancer_share_percent")
    private Short freelancerSharePercent;

    @Column(name = "resolution_note")
    private String resolutionNote;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
