package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * The milestone plan of a hired project, agreed before any milestone exists:
 * the freelancer proposes it, the client accepts or edits and sends it back, and so on until one side accepts.
 * Accepting creates the milestones; later rounds add more milestones the same way.
 */
@Entity
@Table(name = "milestone_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MilestonePlan extends BaseEntity {

    public enum Status {
        /** Being written by {@link #draftBy}; not visible to the other side yet */
        DRAFT,
        /** Sent to the client: the client accepts, or edits and sends it back */
        WITH_CLIENT,
        /** Sent back to the freelancer: the freelancer accepts, or edits and sends it again */
        WITH_FREELANCER,
        /** Agreed: the milestones were created */
        ACCEPTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    /** CLIENT or FREELANCER: who is writing the current draft */
    @Column(length = 12)
    private String draftBy;

    /** The proposed milestones as JSON: [{title, description, amount, dueDate}] */
    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    /** Message sent with the last version ("I split the design into two parts", ...) */
    @Column(length = 600)
    private String note;

    /** 1 for the first plan; each later round adds more milestones */
    private int round;

    /** CLIENT or FREELANCER: who changed it last */
    @Column(length = 12)
    private String lastEditedBy;

    private Instant lastEditedAt;

    private Instant acceptedAt;

    /** How many times the plan went back and forth in this round */
    private int revisions;
}
