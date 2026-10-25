package com.theunoia.identity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.common.security.EncryptionUtils;
import com.theunoia.identity.domain.*;
import com.theunoia.identity.dto.*;
import com.theunoia.identity.repository.FreelancerProfileRepository;
import com.theunoia.identity.repository.PortfolioItemRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FreelancerProfileService {

    static final Map<String, Boolean> DEFAULT_NOTIFICATION_PREFS = Map.of(
            "projectInvites", true,
            "bidUpdates", true,
            "clientMessages", true,
            "payoutProcessed", true,
            "creditsReminder", true,
            "marketingDigest", false
    );

    private static final int MAX_PORTFOLIO_ITEMS = 24;

    private final UserRepository userRepository;
    private final FreelancerProfileRepository profileRepository;
    private final PortfolioItemRepository portfolioRepository;
    private final EncryptionUtils encryptionUtils;
    private final PasswordEncoder passwordEncoder;
    private final UserDirectoryClient userDirectoryClient;
    private final ObjectMapper objectMapper;

    // ---------------------------------------------------------------- reads

    @Transactional(readOnly = true)
    public FreelancerProfileDto getOwnProfile(UUID userId) {
        return toDto(loadProfile(userId), true);
    }

    @Transactional(readOnly = true)
    public FreelancerProfileDto getPublicProfile(UUID userId) {
        FreelancerProfile profile = loadProfile(userId);
        if (profile.getUser().getStatus() == UserStatus.SUSPENDED) {
            throw new ResourceNotFoundException("Freelancer not found");
        }
        return toDto(profile, false);
    }

    @Transactional(readOnly = true)
    public List<FreelancerProfileDto> searchFreelancers(UUID currentUserId, String search, String skill, int limit) {
        String q = blankToNull(search);
        String s = blankToNull(skill);
        return profileRepository.searchDirectory(
                        currentUserId,
                        q == null ? null : q.toLowerCase(),
                        s == null ? null : s.toLowerCase(),
                        PageRequest.of(0, Math.min(Math.max(limit, 1), 50)))
                .stream()
                .map(p -> toDto(p, false))
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------- writes

    @Transactional
    public FreelancerProfileDto updateProfile(UUID userId, UpdateFreelancerProfileDto dto) {
        FreelancerProfile profile = loadProfile(userId);
        User user = profile.getUser();

        if (dto.getFullName() != null) user.setFullName(dto.getFullName().trim());
        if (dto.getMobile() != null) user.setMobile(dto.getMobile().trim());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(blankToNull(dto.getAvatarUrl()));

        if (dto.getProfessionalTitle() != null) profile.setProfessionalTitle(blankToNull(dto.getProfessionalTitle()));
        if (dto.getBio() != null) profile.setBio(blankToNull(dto.getBio()));
        if (dto.getSkills() != null) {
            profile.setSkills(dto.getSkills().stream()
                    .map(String::trim)
                    .filter(x -> !x.isEmpty())
                    .map(x -> x.replace(",", " "))
                    .distinct()
                    .collect(Collectors.joining(",")));
        }
        if (dto.getLocation() != null) profile.setLocation(blankToNull(dto.getLocation()));
        if (dto.getAvailability() != null) profile.setAvailability(blankToNull(dto.getAvailability()));
        if (dto.getHourlyRate() != null) profile.setHourlyRate(dto.getHourlyRate());
        if (dto.getExperienceYears() != null) profile.setExperienceYears(dto.getExperienceYears());
        if (dto.getCollegeUniversity() != null) profile.setCollegeUniversity(blankToNull(dto.getCollegeUniversity()));
        if (dto.getGraduationYear() != null) profile.setGraduationYear(dto.getGraduationYear());
        if (dto.getDegreeField() != null) profile.setDegreeField(blankToNull(dto.getDegreeField()));
        if (dto.getPortfolioUrl() != null) profile.setPortfolioUrl(normalizeUrl(dto.getPortfolioUrl()));
        if (dto.getGithubUrl() != null) profile.setGithubUrl(normalizeUrl(dto.getGithubUrl()));
        if (dto.getCoverUrl() != null) profile.setCoverUrl(blankToNull(dto.getCoverUrl()));

        userRepository.save(user);
        profileRepository.save(profile);
        userDirectoryClient.evict(userId);
        return toDto(profile, true);
    }

    @Transactional
    public FreelancerProfileDto updatePayout(UUID userId, UpdatePayoutDto dto) {
        FreelancerProfile profile = loadProfile(userId);

        if ("UPI".equals(dto.getMethod()) && blankToNull(dto.getUpiId()) == null) {
            throw new BadRequestException("UPI ID is required for UPI payouts");
        }
        if ("BANK".equals(dto.getMethod())) {
            boolean hasAccount = blankToNull(dto.getAccountNumber()) != null || profile.getAccountNumberEnc() != null;
            if (!hasAccount || blankToNull(dto.getIfscCode()) == null || blankToNull(dto.getAccountHolder()) == null) {
                throw new BadRequestException("Account holder, account number and IFSC are required for bank payouts");
            }
        }

        profile.setPayoutMethod(dto.getMethod());
        profile.setUpiId(blankToNull(dto.getUpiId()));
        profile.setAccountHolder(blankToNull(dto.getAccountHolder()));
        profile.setBankName(blankToNull(dto.getBankName()));
        profile.setIfscCode(blankToNull(dto.getIfscCode()));
        if (blankToNull(dto.getAccountNumber()) != null) {
            profile.setAccountNumberEnc(encryptionUtils.encrypt(dto.getAccountNumber()));
        }
        if (blankToNull(dto.getPanNumber()) != null) {
            profile.setPanEnc(encryptionUtils.encrypt(dto.getPanNumber()));
        }
        profile.setAutoWithdrawal(dto.isAutoWithdrawal());
        profileRepository.save(profile);
        return toDto(profile, true);
    }

    @Transactional
    public Map<String, Boolean> updateNotificationPrefs(UUID userId, Map<String, Boolean> prefs) {
        FreelancerProfile profile = loadProfile(userId);
        Map<String, Boolean> merged = new LinkedHashMap<>(readPrefs(profile));
        prefs.forEach((k, v) -> {
            if (DEFAULT_NOTIFICATION_PREFS.containsKey(k) && v != null) merged.put(k, v);
        });
        try {
            profile.setNotificationPrefs(objectMapper.writeValueAsString(merged));
        } catch (Exception e) {
            throw new BadRequestException("Invalid notification preferences");
        }
        profileRepository.save(profile);
        return merged;
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (passwordEncoder.matches(dto.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from the current password");
        }
        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    // ---------------------------------------------------------------- portfolio

    @Transactional
    public PortfolioItemDto addPortfolioItem(UUID userId, PortfolioItemDto dto) {
        loadProfile(userId);
        if (portfolioRepository.countByUserId(userId) >= MAX_PORTFOLIO_ITEMS) {
            throw new BadRequestException("You can add at most " + MAX_PORTFOLIO_ITEMS + " portfolio items");
        }
        PortfolioItem item = portfolioRepository.save(PortfolioItem.builder()
                .userId(userId)
                .title(dto.getTitle().trim())
                .category(blankToNull(dto.getCategory()))
                .year(dto.getYear())
                .description(blankToNull(dto.getDescription()))
                .link(normalizeUrl(dto.getLink()))
                .imageUrl(blankToNull(dto.getImageUrl()))
                .build());
        return toDto(item);
    }

    @Transactional
    public PortfolioItemDto updatePortfolioItem(UUID userId, UUID itemId, PortfolioItemDto dto) {
        PortfolioItem item = ownedItem(userId, itemId);
        item.setTitle(dto.getTitle().trim());
        item.setCategory(blankToNull(dto.getCategory()));
        item.setYear(dto.getYear());
        item.setDescription(blankToNull(dto.getDescription()));
        item.setLink(normalizeUrl(dto.getLink()));
        item.setImageUrl(blankToNull(dto.getImageUrl()));
        return toDto(portfolioRepository.save(item));
    }

    @Transactional
    public void deletePortfolioItem(UUID userId, UUID itemId) {
        portfolioRepository.delete(ownedItem(userId, itemId));
    }

    // ---------------------------------------------------------------- stats (internal)

    @Transactional
    public void recordCompletedProject(UUID freelancerId, BigDecimal revenue) {
        FreelancerProfile profile = profileRepository.findById(freelancerId).orElse(null);
        if (profile == null) return;
        profile.setCompletedProjects(profile.getCompletedProjects() + 1);
        if (revenue != null) {
            profile.setRevenueGenerated(profile.getRevenueGenerated().add(revenue));
        }
        profile.recalculateLeaderboardScore();
        profileRepository.save(profile);
    }

    // ---------------------------------------------------------------- mapping

    private FreelancerProfile loadProfile(UUID userId) {
        FreelancerProfile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (user.getRole() != UserRole.FREELANCER) {
                throw new ForbiddenException("Only freelancers have a freelancer profile");
            }
            profile = FreelancerProfile.builder().user(user).build();
            profile.recalculateLeaderboardScore();
            profile = profileRepository.save(profile);
        }
        return profile;
    }

    private PortfolioItem ownedItem(UUID userId, UUID itemId) {
        PortfolioItem item = portfolioRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio item not found"));
        if (!item.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own portfolio");
        }
        return item;
    }

    FreelancerProfileDto toDto(FreelancerProfile p, boolean owner) {
        User u = p.getUser();
        List<PortfolioItemDto> portfolio = portfolioRepository.findByUserIdOrderByCreatedAtDesc(p.getUserId())
                .stream().map(this::toDto).collect(Collectors.toList());
        List<String> skills = splitSkills(p.getSkills());

        List<String> missing = new ArrayList<>();
        if (u.getAvatarUrl() == null) missing.add("Profile photo");
        if (p.getProfessionalTitle() == null) missing.add("Professional title");
        if (p.getBio() == null || p.getBio().length() < 50) missing.add("Bio (50+ characters)");
        if (skills.size() < 3) missing.add("At least 3 skills");
        if (p.getLocation() == null) missing.add("Location");
        if (p.getHourlyRate() == null) missing.add("Hourly rate");
        if (portfolio.isEmpty()) missing.add("Portfolio project");
        if (u.getMobile() == null) missing.add("Mobile number");
        if (p.getPayoutMethod() == null) missing.add("Payout details");
        if (u.getKycStatus() != KycStatus.VERIFIED) missing.add("KYC verification");
        int completion = (int) Math.round((10 - missing.size()) * 10.0);

        FreelancerProfileDto.FreelancerProfileDtoBuilder b = FreelancerProfileDto.builder()
                .id(p.getUserId())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .coverUrl(p.getCoverUrl())
                .kycStatus(u.getKycStatus())
                .emailVerified(u.isEmailVerified())
                .memberSince(u.getCreatedAt())
                .professionalTitle(p.getProfessionalTitle())
                .bio(p.getBio())
                .skills(skills)
                .location(p.getLocation())
                .availability(p.getAvailability())
                .hourlyRate(p.getHourlyRate())
                .experienceYears(p.getExperienceYears())
                .collegeUniversity(p.getCollegeUniversity())
                .graduationYear(p.getGraduationYear())
                .degreeField(p.getDegreeField())
                .portfolioUrl(p.getPortfolioUrl())
                .githubUrl(p.getGithubUrl())
                .completedProjects(p.getCompletedProjects())
                .rating(p.getRating())
                .revenueGenerated(p.getRevenueGenerated())
                .responseRate(p.getResponseRate())
                .projectSuccessRate(p.getProjectSuccessRate())
                .leaderboardScore(p.getLeaderboardScore())
                .rank((int) profileRepository.countByLeaderboardScoreGreaterThan(p.getLeaderboardScore()) + 1)
                .portfolio(portfolio);

        if (owner) {
            b.email(u.getEmail())
                    .mobile(u.getMobile())
                    .profileCompletion(completion)
                    .profileMissing(missing)
                    .notificationPrefs(readPrefs(p))
                    .payout(FreelancerProfileDto.PayoutDetailsDto.builder()
                            .method(p.getPayoutMethod())
                            .upiId(p.getUpiId())
                            .accountHolder(p.getAccountHolder())
                            .bankName(p.getBankName())
                            .accountNumberMasked(mask(decryptOrNull(p.getAccountNumberEnc()), 4))
                            .ifscCode(p.getIfscCode())
                            .panMasked(mask(decryptOrNull(p.getPanEnc()), 4))
                            .autoWithdrawal(p.isAutoWithdrawal())
                            .build());
        }
        return b.build();
    }

    private PortfolioItemDto toDto(PortfolioItem i) {
        return PortfolioItemDto.builder()
                .id(i.getId())
                .title(i.getTitle())
                .category(i.getCategory())
                .year(i.getYear())
                .description(i.getDescription())
                .link(i.getLink())
                .imageUrl(i.getImageUrl())
                .build();
    }

    private Map<String, Boolean> readPrefs(FreelancerProfile p) {
        Map<String, Boolean> prefs = new LinkedHashMap<>(DEFAULT_NOTIFICATION_PREFS);
        if (p.getNotificationPrefs() != null) {
            try {
                prefs.putAll(objectMapper.readValue(p.getNotificationPrefs(), new TypeReference<Map<String, Boolean>>() {}));
            } catch (Exception ignored) {
                // corrupt JSON -> defaults
            }
        }
        return prefs;
    }

    static List<String> splitSkills(String skills) {
        if (skills == null || skills.isBlank()) return List.of();
        return Arrays.stream(skills.split(","))
                .map(String::trim)
                .filter(x -> !x.isEmpty())
                .collect(Collectors.toList());
    }

    private String decryptOrNull(String enc) {
        if (enc == null) return null;
        try {
            return encryptionUtils.decrypt(enc);
        } catch (Exception e) {
            return null;
        }
    }

    private static String mask(String value, int visible) {
        if (value == null || value.isEmpty()) return null;
        if (value.length() <= visible) return value;
        return "•".repeat(value.length() - visible) + value.substring(value.length() - visible);
    }

    private static String normalizeUrl(String url) {
        String u = blankToNull(url);
        if (u == null) return null;
        if (!u.matches("(?i)^https?://.*")) u = "https://" + u;
        if (u.length() > 500) throw new BadRequestException("Link is too long");
        return u;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
