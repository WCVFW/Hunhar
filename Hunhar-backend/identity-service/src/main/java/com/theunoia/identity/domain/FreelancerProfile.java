package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "freelancer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerProfile extends BaseEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String professionalTitle;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String skills; // Comma separated or JSON string of skills

    @Column(columnDefinition = "TEXT")
    private String portfolioLinks; // JSON string of portfolio links

    private Integer experienceYears;

    @Column(length = 120)
    private String location;

    @Column(length = 120)
    private String availability;

    @Column(length = 160)
    private String collegeUniversity;

    private Integer graduationYear;

    @Column(length = 160)
    private String degreeField;

    @Column(length = 255)
    private String portfolioUrl;

    @Column(length = 255)
    private String githubUrl;

    @Column(length = 500)
    private String coverUrl;

    @Column(columnDefinition = "TEXT")
    private String notificationPrefs; // JSON map of preference key -> enabled

    // Payout details. Account number and PAN are stored AES-GCM encrypted.
    @Column(length = 20)
    private String payoutMethod; // UPI or BANK

    @Column(length = 100)
    private String upiId;

    @Column(length = 120)
    private String accountHolder;

    @Column(length = 120)
    private String bankName;

    @Column(length = 512)
    private String accountNumberEnc;

    @Column(length = 20)
    private String ifscCode;

    @Column(length = 512)
    private String panEnc;

    @Builder.Default
    private boolean autoWithdrawal = false;

    private BigDecimal hourlyRate;

    @Builder.Default
    private int completedProjects = 0;

    // Average client rating; 0 until the first completed project is reviewed
    @Builder.Default
    private double rating = 0.0;

    @Builder.Default
    private BigDecimal revenueGenerated = BigDecimal.ZERO;

    @Builder.Default
    private double responseRate = 100.0; // In percentage

    @Builder.Default
    private double projectSuccessRate = 100.0; // In percentage

    @Builder.Default
    private double leaderboardScore = 0.0;

    public void recalculateLeaderboardScore() {
        // Ranking score formula:
        // (CompletedProjects * 20) + (Rating * 25) + (Revenue / 1000) + (SuccessRate * 0.5)
        double revenueFactor = revenueGenerated != null ? revenueGenerated.doubleValue() / 1000.0 : 0.0;
        this.leaderboardScore = (this.completedProjects * 20.0) + (this.rating * 25.0) + revenueFactor + (this.projectSuccessRate * 0.5);
    }
}
