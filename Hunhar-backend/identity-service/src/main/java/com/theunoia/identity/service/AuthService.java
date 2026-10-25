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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailOtpService emailOtpService;

    @Transactional
    public AuthResponseDto registerFreelancer(RegisterFreelancerDto dto) {
        if (userRepository.existsByEmail(dto.getEmail().toLowerCase().trim())) {
            throw new BadRequestException("Email is already registered");
        }
        emailOtpService.consumeVerifiedEmail(dto.getEmail());

        User user = User.builder()
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .mobile(dto.getMobile().trim())
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
        emailOtpService.consumeVerifiedEmail(dto.getEmail());

        User user = User.builder()
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getContactPerson())
                .mobile(dto.getMobile().trim())
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
