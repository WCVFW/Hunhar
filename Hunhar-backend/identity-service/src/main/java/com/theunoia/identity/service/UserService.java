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
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> getUserSummary(u.getId(), true))
                .collect(Collectors.toList());
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
                        titles.getOrDefault(u.getId(), companies.get(u.getId()))))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(UUID userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setStatus(status);
        userRepository.save(user);
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
