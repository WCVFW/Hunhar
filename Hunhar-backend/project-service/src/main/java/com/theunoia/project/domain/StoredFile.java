package com.theunoia.project.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "stored_files", indexes = @Index(name = "idx_stored_files_project", columnList = "projectId"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredFile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID ownerId;

    /** Set when the file belongs to a project workspace (shown in its Files tab). */
    private UUID projectId;

    @Column(nullable = false, length = 255)
    private String originalName;

    @Column(nullable = false, length = 120)
    private String contentType;

    private long sizeBytes;

    /** Path relative to the uploads directory. */
    @JsonIgnore
    @Column(nullable = false, length = 300)
    private String storagePath;

    @Transient
    private String ownerName;

    public String getUrl() {
        return "/api/v1/projects/files/" + id;
    }
}
