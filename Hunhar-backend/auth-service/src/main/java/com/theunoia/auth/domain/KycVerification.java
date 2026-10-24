package com.theunoia.auth.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "kyc_verifications")
public class KycVerification extends BaseEntity {

    public enum Status { INITIATED, VERIFIED, FAILED, EXPIRED, MANUAL }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String provider;

    @Column(name = "provider_reference", nullable = false)
    private String providerReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "redirect_url")
    private String redirectUrl;

    @Column(name = "aadhaar_last4")
    private String aadhaarLast4;

    @Column(name = "name_on_document")
    private String nameOnDocument;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "completed_at")
    private Instant completedAt;
}
