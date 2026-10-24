package com.theunoia.auth.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String mobile;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "aadhaar_verified", nullable = false)
    private boolean aadhaarVerified;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "status_reason")
    private String statusReason;

    @Version
    private long version;

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(Instant.now());
    }

    /** Moves a pending account forward once its verification requirements are satisfied. */
    public void recomputePendingStatus(boolean kycRequired) {
        if (status != UserStatus.PENDING_VERIFICATION && status != UserStatus.PENDING_APPROVAL) {
            return;
        }
        boolean verified = emailVerified && (!kycRequired || aadhaarVerified);
        status = verified ? UserStatus.PENDING_APPROVAL : UserStatus.PENDING_VERIFICATION;
    }
}
