package com.theunoia.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "client_profiles")
public class ClientProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    private String website;
    private String industry;

    @Column(name = "company_size")
    private String companySize;

    private String about;

    @Column(name = "logo_url")
    private String logoUrl;

    private String gstin;
    private String location;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "PENDING_VERIFICATION";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
