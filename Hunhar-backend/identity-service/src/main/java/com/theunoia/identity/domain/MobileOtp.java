package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * One pending signup mobile verification per number (10 digits, no country code).
 * Only a BCrypt hash of the OTP is stored. sentToday / sentOn cap SMS per number per day.
 */
@Entity
@Table(name = "mobile_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MobileOtp extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 10)
    private String mobile;

    @Column(nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant lastSentAt;

    private int attempts;

    private boolean verified;

    private Instant verifiedAt;

    private int sentToday;

    private LocalDate sentOn;
}
