package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.JwtUtils;
import com.theunoia.identity.domain.*;
import com.theunoia.identity.dto.*;
import com.theunoia.identity.repository.ClientProfileRepository;
import com.theunoia.identity.repository.FreelancerProfileRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.theunoia.common.exception.ForbiddenException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailOtpService emailOtpService;
    private final MobileOtpService mobileOtpService;

    /** Mobile must be unique and (when MOBILE_OTP_REQUIRED) verified by SMS. Returns the normalized number. */
    private String checkMobile(String raw) {
        String mobile = MobileOtpService.normalize(raw);
        if (userRepository.existsByMobile(mobile)) {
            throw new BadRequestException("This mobile number is already registered");
        }
        if (mobileOtpService.isRequired()) {
            mobileOtpService.consumeVerifiedMobile(mobile);
        }
        return mobile;
    }
    private final GoogleTokenVerifier googleTokenVerifier;

    public String googleClientId() {
        return googleTokenVerifier.getClientId();
    }

    /**
     * Sign in or sign up with Google. An existing account (same email) is signed in and linked.
     * A new email needs a role; without one the response has {@code needsRole=true} and no token.
     */
    @Transactional
    public AuthResponseDto googleAuth(GoogleAuthDto dto) {
        GoogleTokenVerifier.GoogleUser g;
        if (dto.getAccessToken() != null && !dto.getAccessToken().isBlank()) {
            g = googleTokenVerifier.verifyAccessToken(dto.getAccessToken());
        } else if (dto.getCredential() != null && !dto.getCredential().isBlank()) {
            g = googleTokenVerifier.verify(dto.getCredential());
        } else {
            throw new BadRequestException("Google credential is required");
        }

        User user = userRepository.findByEmail(g.email()).orElse(null);
        if (user != null) {
            if (user.getGoogleId() != null && !user.getGoogleId().equals(g.sub())) {
                throw new UnauthorizedException("This email is linked to a different Google account");
            }
            if (user.getStatus() == UserStatus.SUSPENDED) {
                throw new UnauthorizedException("Account is suspended. Please contact platform administration.");
            }
            if (user.getGoogleId() == null) user.setGoogleId(g.sub());
            if (user.getAvatarUrl() == null && g.picture() != null) user.setAvatarUrl(g.picture());
            user.setEmailVerified(true);
            return buildResponse(userRepository.save(user));
        }

        if (dto.getRole() == null || dto.getRole().isBlank()) {
            return AuthResponseDto.builder().email(g.email()).fullName(g.name()).needsRole(true).build();
        }
        UserRole role = UserRole.valueOf(dto.getRole());
        if (role == UserRole.ADMIN) throw new ForbiddenException("Invalid account type");

        user = userRepository.save(User.builder()
                .email(g.email())
                // Google users have no password until they set one with "Forgot password"
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID()))
                .fullName(g.name().length() > 100 ? g.name().substring(0, 100) : g.name())
                .role(role)
                .status(UserStatus.ACTIVE)
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .emailVerified(true)
                .googleId(g.sub())
                .avatarUrl(g.picture())
                .build());

        if (role == UserRole.CLIENT) {
            String company = dto.getCompanyName() == null || dto.getCompanyName().isBlank() ? user.getFullName() : dto.getCompanyName().trim();
            clientProfileRepository.save(ClientProfile.builder().user(user).companyName(company).contactPerson(user.getFullName()).build());
        } else {
            FreelancerProfile profile = FreelancerProfile.builder().user(user).skills("").portfolioLinks("").build();
            profile.recalculateLeaderboardScore();
            freelancerProfileRepository.save(profile);
        }
        return buildResponse(user);
    }

    @Transactional
    public void resetPassword(String rawEmail, String otp, String newPassword) {
        emailOtpService.consumePasswordResetOtp(rawEmail, otp);
        User user = userRepository.findByEmail(rawEmail.toLowerCase().trim())
                .orElseThrow(() -> new BadRequestException("Invalid or expired code. Please request a new one."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private AuthResponseDto buildResponse(User user) {
        return AuthResponseDto.builder()
                .token(jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name()))
                .refreshToken(jwtUtils.generateRefreshToken(user.getId()))
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public AuthResponseDto registerFreelancer(RegisterFreelancerDto dto) {
        if (userRepository.existsByEmail(dto.getEmail().toLowerCase().trim())) {
            throw new BadRequestException("Email is already registered");
        }
        String mobile = checkMobile(dto.getMobile());
        emailOtpService.consumeVerifiedEmail(dto.getEmail());

        User user = User.builder()
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .mobile(mobile)
                .mobileVerified(mobileOtpService.isRequired())
                .role(UserRole.FREELANCER)
                .status(UserStatus.ACTIVE) // Active for MVP exploration, KYC completes badge
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .emailVerified(true)
                .build();

        user = userRepository.save(user);

        String skillsStr = dto.getSkills() != null ? String.join(",", dto.getSkills()) : "";
        String portfolioStr = dto.getPortfolioLinks() != null ? String.join(",", dto.getPortfolioLinks()) : "";

        FreelancerProfile profile = FreelancerProfile.builder()
                .user(user)
                .skills(skillsStr)
                .portfolioLinks(portfolioStr)
                .build();
        profile.recalculateLeaderboardScore();
        freelancerProfileRepository.save(profile);

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        return AuthResponseDto.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .build();
    }

    @Transactional
    public AuthResponseDto registerClient(RegisterClientDto dto) {
        if (userRepository.existsByEmail(dto.getEmail().toLowerCase().trim())) {
            throw new BadRequestException("Email is already registered");
        }
        String mobile = checkMobile(dto.getMobile());
        emailOtpService.consumeVerifiedEmail(dto.getEmail());

        User user = User.builder()
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getContactPerson())
                .mobile(mobile)
                .mobileVerified(mobileOtpService.isRequired())
                .role(UserRole.CLIENT)
                .status(UserStatus.ACTIVE)
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .emailVerified(true)
                .build();

        user = userRepository.save(user);

        ClientProfile profile = ClientProfile.builder()
                .user(user)
                .companyName(dto.getCompanyName())
                .contactPerson(dto.getContactPerson())
                .build();
        clientProfileRepository.save(profile);

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        return AuthResponseDto.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .build();
    }

    public AuthResponseDto login(LoginDto dto) {
        User user = userRepository.findByEmail(dto.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Account is suspended. Please contact platform administration.");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getStatus().name());
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        return AuthResponseDto.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .build();
    }
}
