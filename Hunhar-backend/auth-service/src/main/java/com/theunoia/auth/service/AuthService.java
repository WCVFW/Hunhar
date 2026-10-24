package com.theunoia.auth.service;

import com.theunoia.auth.config.AuthProperties;
import com.theunoia.auth.domain.RefreshToken;
import com.theunoia.auth.domain.Role;
import com.theunoia.auth.domain.User;
import com.theunoia.auth.domain.UserStatus;
import com.theunoia.auth.domain.VerificationToken;
import com.theunoia.auth.dto.AuthDtos.ClientRegistration;
import com.theunoia.auth.dto.AuthDtos.FreelancerRegistration;
import com.theunoia.auth.dto.AuthDtos.RegistrationResponse;
import com.theunoia.auth.dto.AuthDtos.TokenResponse;
import com.theunoia.auth.dto.AuthDtos.UserResponse;
import com.theunoia.auth.repository.RefreshTokenRepository;
import com.theunoia.auth.repository.UserRepository;
import com.theunoia.auth.repository.VerificationTokenRepository;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final VerificationTokenRepository verificationTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EventPublisher events;
    private final AuthProperties props;

    // ------------------------------------------------------------------ registration

    @Transactional
    public RegistrationResponse registerFreelancer(FreelancerRegistration req) {
        User user = createUser(req.email(), req.mobile(), req.password(), Role.FREELANCER, req.fullName());
        Map<String, Object> profile = new HashMap<>();
        profile.put("fullName", req.fullName());
        profile.put("skills", req.skills());
        profile.put("portfolioLinks", req.portfolioLinks() == null ? List.of() : req.portfolioLinks());
        publishRegistered(user, profile);
        return new RegistrationResponse(user.getId(), user.getStatus().name(),
                "Registration successful. Please verify your email and complete Aadhaar verification.");
    }

    @Transactional
    public RegistrationResponse registerClient(ClientRegistration req) {
        User user = createUser(req.email(), req.mobile(), req.password(), Role.CLIENT, req.companyName());
        publishRegistered(user, Map.of("companyName", req.companyName(), "contactPerson", req.contactPerson()));
        return new RegistrationResponse(user.getId(), user.getStatus().name(),
                "Registration successful. Please verify your email and complete Aadhaar verification.");
    }

    User createUser(String rawEmail, String mobile, String password, Role role, String displayName) {
        String email = normalize(rawEmail);
        if (users.existsByEmail(email)) throw ApiException.conflict("An account with this email already exists");
        if (users.existsByMobile(mobile)) throw ApiException.conflict("An account with this mobile number already exists");
        User user = new User();
        user.setEmail(email);
        user.setMobile(mobile);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setDisplayName(displayName.trim());
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        return users.save(user);
    }

    private void publishRegistered(User user, Map<String, Object> profile) {
        events.publish("user.registered", Map.of(
                "userId", user.getId(),
                "role", user.getRole().name(),
                "email", user.getEmail(),
                "mobile", user.getMobile(),
                "displayName", user.getDisplayName(),
                "profile", profile));
        sendEmailVerification(user);
    }

    // ------------------------------------------------------------------ login & tokens

    @Transactional(noRollbackFor = ApiException.class)
    public TokenResponse login(String rawEmail, String password, String userAgent, String ip) {
        User user = users.findByEmail(normalize(rawEmail))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (user.isLocked()) {
            throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Too many failed attempts. Try again later.");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= props.getMaxFailedLogins()) {
                user.setLockedUntil(Instant.now().plus(props.getLockDuration()));
                user.setFailedLoginAttempts(0);
            }
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED", "This account has been suspended");
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_REJECTED", "This registration was rejected: " + user.getStatusReason());
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        events.publish("user.logged_in", Map.of("userId", user.getId(), "role", user.getRole().name()));
        return issueTokens(user, UUID.randomUUID(), userAgent, ip);
    }

    /**
     * Refresh-token rotation with reuse detection: each refresh token is single use. If an
     * already-rotated token is presented again, it was likely stolen, so the whole token
     * family is revoked and the user must log in again.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public TokenResponse refresh(String rawToken, String userAgent, String ip) {
        RefreshToken token = refreshTokens.findByTokenHash(CryptoUtil.sha256Hex(rawToken))
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
        if (token.getRevokedAt() != null) {
            if (token.getReplacedBy() != null) {
                log.warn("Refresh token reuse detected for user {}; revoking family {}", token.getUser().getId(), token.getFamilyId());
                refreshTokens.revokeFamily(token.getFamilyId());
            }
            throw ApiException.unauthorized("Refresh token has been revoked");
        }
        if (!token.isActive()) throw ApiException.unauthorized("Refresh token expired");
        User user = token.getUser();
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.REJECTED) {
            refreshTokens.revokeAllForUser(user.getId());
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not allowed to sign in");
        }
        TokenResponse response = issueTokens(user, token.getFamilyId(), userAgent, ip);
        token.setRevokedAt(Instant.now());
        token.setReplacedBy(refreshTokens.findByTokenHash(CryptoUtil.sha256Hex(response.refreshToken()))
                .map(RefreshToken::getId).orElse(null));
        return response;
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokens.findByTokenHash(CryptoUtil.sha256Hex(rawToken)).ifPresent(t -> {
            if (t.getRevokedAt() == null) t.setRevokedAt(Instant.now());
        });
    }

    @Transactional
    public void logoutEverywhere(UUID userId) {
        refreshTokens.revokeAllForUser(userId);
    }

    private TokenResponse issueTokens(User user, UUID familyId, String userAgent, String ip) {
        String raw = CryptoUtil.randomToken(48);
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setFamilyId(familyId);
        rt.setTokenHash(CryptoUtil.sha256Hex(raw));
        rt.setExpiresAt(Instant.now().plus(props.getRefreshTokenTtl()));
        rt.setUserAgent(userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 300)));
        rt.setIpAddress(ip);
        refreshTokens.saveAndFlush(rt);
        return new TokenResponse(jwtService.issueAccessToken(user), raw, "Bearer", jwtService.accessTokenTtlSeconds(),
                UserResponse.from(user));
    }

    // ------------------------------------------------------------------ email verification

    @Transactional
    public UserResponse verifyEmail(String rawToken) {
        VerificationToken token = consume(rawToken, VerificationToken.Purpose.EMAIL_VERIFICATION);
        User user = users.findById(token.getUserId()).orElseThrow(() -> ApiException.notFound("User"));
        user.setEmailVerified(true);
        user.recomputePendingStatus(kycRequired(user));
        events.publish("user.email_verified", Map.of("userId", user.getId(), "status", user.getStatus().name()));
        publishIfAwaitingApproval(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void resendVerification(UUID userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        if (user.isEmailVerified()) throw ApiException.conflict("Email is already verified");
        sendEmailVerification(user);
    }

    private void sendEmailVerification(User user) {
        verificationTokens.invalidateOutstanding(user.getId(), VerificationToken.Purpose.EMAIL_VERIFICATION);
        String raw = createToken(user.getId(), VerificationToken.Purpose.EMAIL_VERIFICATION, props.getEmailTokenTtl());
        events.publish("auth.email_verification_requested", Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "displayName", user.getDisplayName(),
                "verificationUrl", props.getFrontendUrl() + "/verify-email?token=" + raw));
    }

    // ------------------------------------------------------------------ password management

    /** Always succeeds from the caller's perspective, to avoid leaking which emails are registered. */
    @Transactional
    public void forgotPassword(String rawEmail) {
        users.findByEmail(normalize(rawEmail)).ifPresent(user -> {
            verificationTokens.invalidateOutstanding(user.getId(), VerificationToken.Purpose.PASSWORD_RESET);
            String raw = createToken(user.getId(), VerificationToken.Purpose.PASSWORD_RESET, props.getPasswordResetTtl());
            events.publish("auth.password_reset_requested", Map.of(
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "displayName", user.getDisplayName(),
                    "resetUrl", props.getFrontendUrl() + "/reset-password?token=" + raw));
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        VerificationToken token = consume(rawToken, VerificationToken.Purpose.PASSWORD_RESET);
        User user = users.findById(token.getUserId()).orElseThrow(() -> ApiException.notFound("User"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        refreshTokens.revokeAllForUser(user.getId());
    }

    @Transactional
    public void changePassword(UUID userId, String current, String next) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        if (!passwordEncoder.matches(current, user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(next));
        refreshTokens.revokeAllForUser(userId);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return UserResponse.from(users.findById(userId).orElseThrow(() -> ApiException.notFound("User")));
    }

    // ------------------------------------------------------------------ helpers

    boolean kycRequired(User user) {
        return props.getKycRequiredRoles().contains(user.getRole().name());
    }

    void publishIfAwaitingApproval(User user) {
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            events.publish("user.awaiting_approval", Map.of("userId", user.getId(), "role", user.getRole().name(),
                    "displayName", user.getDisplayName()));
        }
    }

    private String createToken(UUID userId, VerificationToken.Purpose purpose, java.time.Duration ttl) {
        String raw = CryptoUtil.randomToken(32);
        VerificationToken token = new VerificationToken();
        token.setUserId(userId);
        token.setPurpose(purpose);
        token.setTokenHash(CryptoUtil.sha256Hex(raw));
        token.setExpiresAt(Instant.now().plus(ttl));
        verificationTokens.save(token);
        return raw;
    }

    private VerificationToken consume(String rawToken, VerificationToken.Purpose purpose) {
        VerificationToken token = verificationTokens.findByTokenHashAndPurpose(CryptoUtil.sha256Hex(rawToken), purpose)
                .filter(VerificationToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest("This link is invalid or has expired"));
        token.setUsedAt(Instant.now());
        return token;
    }

    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
