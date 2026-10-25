package com.theunoia.engagement.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** A personal planner item: calendar task/meeting/deadline, or an undated to-do. */
@Entity
@Table(name = "calendar_tasks", indexes = {
        @Index(name = "idx_calendar_tasks_user_due", columnList = "userId,dueAt"),
        @Index(name = "idx_calendar_tasks_reminder", columnList = "remindAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarTask extends BaseEntity {

    public enum Type { TASK, MEETING, DEADLINE, MILESTONE, REVIEW }

    public enum Priority { LOW, MEDIUM, HIGH }

    public enum Status { TODO, IN_PROGRESS, DONE }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Type type = Type.TASK;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.TODO;

    /** Null for undated to-dos. */
    private Instant dueAt;

    /** True when only the date matters (no specific time). */
    private boolean allDay;

    private UUID projectId;

    @Column(length = 200)
    private String projectTitle;

    /** Minutes before dueAt to send a reminder; null = no reminder. */
    private Integer reminderMinutes;

    /** Computed from dueAt - reminderMinutes; cleared once the reminder is sent. */
    private Instant remindAt;

    private Instant completedAt;
}
