package com.theunoia.identity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.theunoia.identity.domain.KycStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Freelancer profile view. Contact, payout and preference fields are only filled for the owner.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FreelancerProfileDto {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private KycStatus kycStatus;
    private boolean emailVerified;
    private Instant memberSince;

    private String professionalTitle;
    private String bio;
    private List<String> skills;
    private String location;
    private String availability;
    private BigDecimal hourlyRate;
    private Integer experienceYears;
    private String collegeUniversity;
    private Integer graduationYear;
    private String degreeField;
    private String portfolioUrl;
    private String githubUrl;

    private int completedProjects;
    private double rating;
    private BigDecimal revenueGenerated;
    private double responseRate;
    private double projectSuccessRate;
    private double leaderboardScore;
    private Integer rank;

    private List<PortfolioItemDto> portfolio;
    private int profileCompletion;
    private List<String> profileMissing;

    // Owner-only fields
    private String email;
    private String mobile;
    private PayoutDetailsDto payout;
    private Map<String, Boolean> notificationPrefs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayoutDetailsDto {
        private String method;
        private String upiId;
        private String accountHolder;
        private String bankName;
        private String accountNumberMasked;
        private String ifscCode;
        private String panMasked;
        private boolean autoWithdrawal;
    }
}
