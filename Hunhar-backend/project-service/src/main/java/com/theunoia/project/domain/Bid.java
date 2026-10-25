package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "bids")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private UUID freelancerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal proposedCost;

    @Column(nullable = false)
    private Integer deliveryTimelineDays;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String proposalMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BidStatus status = BidStatus.SUBMITTED;

    @Builder.Default
    private boolean isShortlisted = false;

    @Column(columnDefinition = "TEXT")
    private String attachmentUrls; // comma separated file URLs

    // ----- Read-only view fields (not persisted) -----

    @Transient
    private String projectTitle;

    @Transient
    private String projectCategory;

    @Transient
    private ProjectStatus projectStatus;

    @Transient
    private java.math.BigDecimal projectBudget;

    @Transient
    private UUID clientId;

    @Transient
    private String clientName;

    @Transient
    private String freelancerName;

    @Transient
    private String freelancerAvatarUrl;
}
