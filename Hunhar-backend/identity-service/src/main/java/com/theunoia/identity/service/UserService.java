package com.theunoia.identity.service;

import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.identity.domain.ClientProfile;
import com.theunoia.identity.domain.User;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.domain.UserStatus;
import com.theunoia.identity.dto.UserSummaryDto;
import com.theunoia.identity.repository.ClientProfileRepository;
import com.theunoia.identity.repository.FreelancerProfileRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileService freelancerProfileService;
    private final com.theunoia.common.internal.NotificationPublisher notifications;

    /**
     * @param includePrivate true when the viewer is the user themself or an admin:
     *                       email, mobile and owner-only profile fields are included.
     */
    @Transactional(readOnly = true)
    public UserSummaryDto getUserSummary(UUID userId, boolean includePrivate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Object profile = null;
        if (user.getRole() == UserRole.FREELANCER) {
            profile = freelancerProfileRepository.findById(userId)
                    .map(p -> freelancerProfileService.toDto(p, includePrivate))
                    .orElse(null);
        } else if (user.getRole() == UserRole.CLIENT) {
            profile = clientProfileRepository.findById(userId).map(this::clientProfileView).orElse(null);
        }

        return UserSummaryDto.builder()
                .id(user.getId())
                .email(includePrivate ? user.getEmail() : null)
                .fullName(user.getFullName())
                .mobile(includePrivate ? user.getMobile() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .emailVerified(user.isEmailVerified())
                .avatarUrl(user.getAvatarUrl())
                .profile(profile)
                .createdAt(user.getCreatedAt())
                .build();
    }

    /** Admin list: lightweight rows (no profile), filtered and newest first. */
    @Transactional(readOnly = true)
    public List<UserSummaryDto> searchUsers(UserRole role, UserStatus status, String search, int limit) {
        String q = search == null || search.isBlank() ? null : search.trim().toLowerCase();
        return userRepository.adminSearch(role, status, q, org.springframework.data.domain.PageRequest.of(0, Math.min(Math.max(limit, 1), 500)))
                .stream()
                .map(u -> UserSummaryDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .mobile(u.getMobile())
                        .role(u.getRole())
                        .status(u.getStatus())
                        .kycStatus(u.getKycStatus())
                        .emailVerified(u.isEmailVerified())
                        .avatarUrl(u.getAvatarUrl())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> stats() {
        java.time.ZoneId ist = java.time.ZoneId.of("Asia/Kolkata");
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalUsers", userRepository.count());
        s.put("freelancers", userRepository.countByRole(UserRole.FREELANCER));
        s.put("clients", userRepository.countByRole(UserRole.CLIENT));
        s.put("activeUsers", userRepository.countByStatus(UserStatus.ACTIVE));
        s.put("suspendedUsers", userRepository.countByStatus(UserStatus.SUSPENDED));
        s.put("pendingKyc", userRepository.countByKycStatus(com.theunoia.identity.domain.KycStatus.PENDING_REVIEW));
        s.put("verifiedKyc", userRepository.countByKycStatus(com.theunoia.identity.domain.KycStatus.VERIFIED));
        java.time.YearMonth now = java.time.YearMonth.now(ist);
        s.put("newThisMonth", userRepository.countByCreatedAtBetween(now.atDay(1).atStartOfDay(ist).toInstant(), java.time.Instant.now().plusSeconds(60)));
        List<Map<String, Object>> monthly = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.YearMonth ym = now.minusMonths(i);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", ym.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH) + " " + ym.getYear());
            m.put("signups", userRepository.countByCreatedAtBetween(ym.atDay(1).atStartOfDay(ist).toInstant(), ym.plusMonths(1).atDay(1).atStartOfDay(ist).toInstant()));
            monthly.add(m);
        }
        s.put("monthly", monthly);
        return s;
    }

    @Transactional(readOnly = true)
    public List<UserDirectoryClient.UserInfo> lookup(Collection<UUID> ids) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, String> titles = freelancerProfileRepository.findAllById(ids).stream()
                .filter(p -> p.getProfessionalTitle() != null)
                .collect(Collectors.toMap(p -> p.getUserId(), p -> p.getProfessionalTitle()));
        Map<UUID, String> companies = clientProfileRepository.findAllById(ids).stream()
                .filter(c -> c.getCompanyName() != null)
                .collect(Collectors.toMap(ClientProfile::getUserId, ClientProfile::getCompanyName));
        return userRepository.findAllById(ids).stream()
                .map(u -> new UserDirectoryClient.UserInfo(
                        u.getId(),
                        u.getFullName(),
                        u.getAvatarUrl(),
                        u.getRole().name(),
                        titles.getOrDefault(u.getId(), companies.get(u.getId())),
                        u.getEmail()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(UUID adminId, UUID userId, UserStatus status, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getId().equals(adminId)) throw new com.theunoia.common.exception.BadRequestException("You cannot change your own account status");
        if (user.getRole() == UserRole.ADMIN) throw new com.theunoia.common.exception.BadRequestException("Admin accounts cannot be suspended here");
        user.setStatus(status);
        userRepository.save(user);
        String why = reason == null || reason.isBlank() ? "." : ": " + reason.trim();
        notifications.notify(userId, "ACCOUNT_" + status.name(),
                status == UserStatus.SUSPENDED ? "Account suspended" : "Account status updated",
                status == UserStatus.SUSPENDED
                        ? "Your account was suspended" + why + " Contact support if you think this is a mistake."
                        : "Your account is now " + status.name().toLowerCase().replace('_', ' ') + ".",
                null);
    }

    private Map<String, Object> clientProfileView(ClientProfile c) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("companyName", c.getCompanyName());
        view.put("contactPerson", c.getContactPerson());
        view.put("industry", c.getIndustry());
        view.put("website", c.getWebsite());
        view.put("companyDescription", c.getCompanyDescription());
        return view;
    }
}
