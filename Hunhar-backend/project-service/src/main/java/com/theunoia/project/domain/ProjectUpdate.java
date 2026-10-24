package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Progress tracking / status updates posted in the project workspace. */
@Getter
@Setter
@Entity
@Table(name = "project_updates")
public class ProjectUpdate extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(nullable = false)
    private String message;

    @Column(name = "progress_percent")
    private Short progressPercent;
}
