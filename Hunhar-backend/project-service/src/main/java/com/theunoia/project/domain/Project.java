package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID clientId;

    private UUID awardedFreelancerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budget;

    private Integer timelineDays;

    @Column(columnDefinition = "TEXT")
    private String skills; // comma-separated

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.OPEN;

    @Builder.Default
    private int progressPercentage = 0;

    @Builder.Default
    private int bidCount = 0;

    @Column(columnDefinition = "TEXT")
    private String attachmentUrls;

    private Instant startDate;

    private Instant endDate;

    // ----- Read-only view fields, filled by ProjectViewEnricher (not persisted) -----

    @Transient
    private String clientName;

    @Transient
    private String clientAvatarUrl;

    @Transient
    private String freelancerName;

    /** For the requesting freelancer: status of their bid on this project, if any. */
    @Transient
    private BidStatus myBidStatus;

    /** For the requesting freelancer: OWNER (awarded) or COLLABORATOR. */
    @Transient
    private String myRole;

    /** startDate + timelineDays once the project is active. */
    public Instant getDeadline() {
        if (startDate == null || timelineDays == null) return null;
        return startDate.plusSeconds(timelineDays * 86400L);
    }
}
