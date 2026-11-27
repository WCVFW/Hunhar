package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Milestone extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    private Instant dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    /** True once the client has moved the milestone amount into escrow. */
    private boolean funded;

    private Instant fundedAt;

    private Instant paidAt;

    /** When work was last submitted; used for auto-approval if the client does not respond. */
    private Instant submittedAt;

    @Column(length = 40)
    private String invoiceNumber;

    @Column(columnDefinition = "TEXT")
    private String tasksJson;

    /** Phase number in the project (1, 2, 3 ...). Phases run strictly in this order. */
    private Integer sequence;

    /** The freelancer sent this phase's sub-tasks to the client for approval */
    private Instant tasksSubmittedAt;

    /** The client asked for changes to the sub-tasks (cleared when they are sent again) */
    @Column(length = 500)
    private String tasksChangeNote;
}
