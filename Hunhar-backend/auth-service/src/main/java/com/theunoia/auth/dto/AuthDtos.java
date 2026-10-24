package com.theunoia.auth.dto;

import com.theunoia.auth.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {
    }

    /** 8-72 chars (bcrypt limit) with upper-case, lower-case and a digit. */
    public static final String PASSWORD_RULE = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,72}$";
    public static final String PASSWORD_MESSAGE = "Password must be 8-72 characters with upper-case, lower-case and a digit";
    public static final String MOBILE_RULE = "^[6-9]\\d{9}$";
    public static final String MOBILE_MESSAGE = "Enter a valid 10-digit Indian mobile number";

    public record FreelancerRegistration(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = MOBILE_RULE, message = MOBILE_MESSAGE) String mobile,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String password,
            @NotEmpty @Size(max = 30) List<@NotBlank @Size(max = 60) String> skills,
            @Size(max = 10) List<@Pattern(regexp = "^https?://.+", message = "Portfolio links must be URLs") String> portfolioLinks) {
    }

    public record ClientRegistration(
            @NotBlank @Size(max = 200) String companyName,
            @NotBlank @Size(max = 150) String contactPerson,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = MOBILE_RULE, message = MOBILE_MESSAGE) String mobile,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String password) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record TokenRequest(@NotBlank String token) {
    }

    public record EmailRequest(@NotBlank @Email String email) {
    }

    public record ResetPasswordRequest(@NotBlank String token,
                                       @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String newPassword) {
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MESSAGE) String newPassword) {
    }

    public record ReasonRequest(@Size(max = 500) String reason) {
    }

    public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn, UserResponse user) {
    }

    public record UserResponse(UUID id, String email, String mobile, String role, String status, String displayName,
                               boolean emailVerified, boolean aadhaarVerified, String statusReason,
                               Instant lastLoginAt, Instant createdAt) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getEmail(), u.getMobile(), u.getRole().name(), u.getStatus().name(),
                    u.getDisplayName(), u.isEmailVerified(), u.isAadhaarVerified(), u.getStatusReason(),
                    u.getLastLoginAt(), u.getCreatedAt());
        }
    }

    public record KycInitResponse(UUID verificationId, String status, String redirectUrl) {
    }

    public record KycStatusResponse(UUID verificationId, String status, String aadhaarLast4, String nameOnDocument,
                                    String failureReason, Instant completedAt) {
    }

    public record RegistrationResponse(UUID userId, String status, String message) {
    }

    public record UserStatsResponse(long totalUsers, long freelancers, long clients, long pendingApproval, long active,
                                    long suspended) {
    }
}
