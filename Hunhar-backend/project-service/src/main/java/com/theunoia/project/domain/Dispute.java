package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private UUID raisedById;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    private String status = "OPEN"; // OPEN, RESOLVED, DISMISSED

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private java.time.Instant resolvedAt;

    // ----- Read-only view fields (not persisted) -----

    @Transient
    private String projectTitle;

    @Transient
    private String raisedByName;

    @Transient
    private String raisedByRole;

    @Transient
    private UUID clientId;

    @Transient
    private String clientName;

    @Transient
    private UUID freelancerId;

    @Transient
    private String freelancerName;

    @Transient
    private java.math.BigDecimal projectBudget;
}
