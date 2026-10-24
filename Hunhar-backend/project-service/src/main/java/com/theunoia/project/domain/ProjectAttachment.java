package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "project_attachments")
public class ProjectAttachment extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "file_id", nullable = false)
    private UUID fileId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String url;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;
}
