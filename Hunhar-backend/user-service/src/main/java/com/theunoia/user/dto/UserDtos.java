package com.theunoia.user.dto;

import com.theunoia.user.domain.Certification;
import com.theunoia.user.domain.ClientProfile;
import com.theunoia.user.domain.Experience;
import com.theunoia.user.domain.FreelancerProfile;
import com.theunoia.user.domain.PortfolioItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class UserDtos {

    private UserDtos() {
    }

    public record FreelancerProfileUpdate(
            @NotBlank @Size(max = 150) String fullName,
            @Size(max = 200) String headline,
            @Size(max = 5000) String bio,
            @DecimalMin("0") BigDecimal hourlyRate,
            @Size(max = 120) String location,
            @Size(max = 1000) String avatarUrl,
            @Min(0) @Max(60) Short experienceYears,
            @Pattern(regexp = "FULL_TIME|PART_TIME|NOT_AVAILABLE") String availability) {
    }

    public record SkillsUpdate(@NotEmpty @Size(max = 30) List<@NotBlank @Size(max = 60) String> skills) {
    }

    public record PortfolioRequest(@NotBlank @Size(max = 200) String title,
                                   @Pattern(regexp = "^https?://.+") @Size(max = 1000) String url,
                                   @Size(max = 3000) String description,
                                   @Size(max = 1000) String imageUrl) {
    }

    public record ExperienceRequest(@NotBlank @Size(max = 200) String company,
                                    @NotBlank @Size(max = 200) String title,
                                    @NotNull LocalDate startDate,
                                    LocalDate endDate,
                                    boolean currentlyWorking,
                                    @Size(max = 3000) String description) {
    }

    public record CertificationRequest(@NotBlank @Size(max = 200) String name,
                                       @NotBlank @Size(max = 200) String issuer,
                                       LocalDate issuedOn,
                                       LocalDate expiresOn,
                                       @Size(max = 1000) String credentialUrl) {
    }

    public record ClientProfileUpdate(@NotBlank @Size(max = 200) String companyName,
                                      @NotBlank @Size(max = 150) String contactPerson,
                                      @Size(max = 500) String website,
                                      @Size(max = 100) String industry,
                                      @Pattern(regexp = "1-10|11-50|51-200|201-1000|1000\\+") String companySize,
                                      @Size(max = 5000) String about,
                                      @Size(max = 1000) String logoUrl,
                                      @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", message = "Invalid GSTIN") String gstin,
                                      @Size(max = 120) String location) {
    }

    public record StatsResponse(int completedProjects, int cancelledProjects, int totalReviews, BigDecimal avgRating,
                                BigDecimal revenue, BigDecimal successRate, BigDecimal responseRate, BigDecimal score,
                                long rank) {
    }

    public record FreelancerCard(UUID userId, String fullName, String headline, String avatarUrl, String location,
                                 BigDecimal hourlyRate, BigDecimal avgRating, int totalReviews, int completedProjects,
                                 BigDecimal score, List<String> skills) {
    }

    public record FreelancerProfileResponse(UUID userId, String fullName, String headline, String bio, BigDecimal hourlyRate,
                                            String location, String avatarUrl, Short experienceYears, String availability,
                                            String verificationStatus, List<String> skills, List<PortfolioItem> portfolio,
                                            List<Experience> experience, List<Certification> certifications,
                                            StatsResponse stats) {
        public static FreelancerProfileResponse of(FreelancerProfile p, List<PortfolioItem> portfolio, List<Experience> exp,
                                                   List<Certification> certs, StatsResponse stats) {
            return new FreelancerProfileResponse(p.getUserId(), p.getFullName(), p.getHeadline(), p.getBio(), p.getHourlyRate(),
                    p.getLocation(), p.getAvatarUrl(), p.getExperienceYears(), p.getAvailability(), p.getVerificationStatus(),
                    List.copyOf(p.getSkills()), portfolio, exp, certs, stats);
        }
    }

    public record ClientProfileResponse(UUID userId, String companyName, String contactPerson, String website, String industry,
                                        String companySize, String about, String logoUrl, String gstin, String location,
                                        String verificationStatus) {
        public static ClientProfileResponse of(ClientProfile c) {
            return new ClientProfileResponse(c.getUserId(), c.getCompanyName(), c.getContactPerson(), c.getWebsite(),
                    c.getIndustry(), c.getCompanySize(), c.getAbout(), c.getLogoUrl(), c.getGstin(), c.getLocation(),
                    c.getVerificationStatus());
        }
    }
}
