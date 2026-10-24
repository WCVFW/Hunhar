package com.theunoia.file.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "stored_files")
public class StoredFile extends BaseEntity {

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String purpose;

    @JsonIgnore
    @Column(nullable = false)
    private String bucket;

    @JsonIgnore
    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "checksum_sha256", nullable = false)
    private String checksumSha256;

    @Column(nullable = false)
    private String visibility = "PRIVATE";

    @JsonIgnore
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
