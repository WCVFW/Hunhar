package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * The verification steps a user submits for KYC: identity document (Aadhaar), college ID, and skills with a work
 * sample. Each step has its own status; the overall result stays on {@link User#getKycStatus()}.
 */
@Entity
@Table(name = "kyc_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycVerification extends BaseEntity {

    public enum Step { NOT_STARTED, UNDER_REVIEW, VERIFIED, REJECTED }

    @Id
    private UUID userId;

    @Column(length = 300)
    private String aadhaarDocUrl;
    @Column(length = 255)
    private String aadhaarDocName;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Step aadhaarStatus;

    @Column(length = 300)
    private String collegeDocUrl;
    @Column(length = 255)
    private String collegeDocName;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Step collegeStatus;

    @Column(columnDefinition = "TEXT")
    private String skills;
    @Column(length = 300)
    private String workSampleUrl;
    @Column(length = 255)
    private String workSampleName;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Step skillsStatus;

    private Instant submittedAt;
}
