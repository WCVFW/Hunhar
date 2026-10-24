package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "deliverables")
public class Deliverable extends BaseEntity {

    public enum Status { SUBMITTED, APPROVED, REVISION_REQUESTED }

    @Column(name = "milestone_id", nullable = false)
    private UUID milestoneId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "submitted_by", nullable = false)
    private UUID submittedBy;

    private String note;

    /** [{fileId, fileName, url}] - files live in file-service. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> attachments = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SUBMITTED;

    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
