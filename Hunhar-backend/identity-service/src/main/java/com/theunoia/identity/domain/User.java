package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 20)
    private String mobile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private KycStatus kycStatus = KycStatus.NOT_SUBMITTED;

    @Column(length = 100)
    private String aadhaarRefId;

    @Column(length = 4)
    private String aadhaarLast4;

    /** Full Aadhaar number, AES-GCM encrypted. Only the last 4 digits are ever shown. */
    @Column(length = 512)
    private String aadhaarNumberEnc;

    @Column(length = 500)
    private String kycDocumentUrl;

    private java.time.Instant kycSubmittedAt;

    private java.time.Instant kycReviewedAt;

    @Column(length = 500)
    private String kycRejectionReason;

    private boolean emailVerified;

    private boolean mobileVerified;

    private String avatarUrl;

    /** Google account id ("sub") for users who signed up or linked with Google. */
    @Column(length = 64, unique = true)
    private String googleId;
}
