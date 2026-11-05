package com.theunoia.identity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.identity.domain.ClientProfile;
import com.theunoia.identity.domain.User;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.repository.ClientProfileRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientProfileService {

    static final Map<String, Boolean> DEFAULT_PREFS = Map.of(
            "newBids", true,
            "milestones", true,
            "messages", true,
            "paymentReceipts", true,
            "marketing", false
    );

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserDirectoryClient userDirectory;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> get(UUID userId) {
        return view(load(userId));
    }

    /** Partial update: only keys present in the body are changed. */
    @Transactional
    public Map<String, Object> update(UUID userId, Map<String, Object> body) {
        ClientProfile p = load(userId);
        User u = p.getUser();

        String fullName = str(body, "fullName", 100);
        if (fullName != null) {
            if (fullName.length() < 2) throw new BadRequestException("Please enter your full name");
            u.setFullName(fullName);
            p.setContactPerson(fullName);
        }
        String mobile = str(body, "mobile", 10);
        if (mobile != null) {
            if (!mobile.matches("^[0-9]{10}$")) throw new BadRequestException("Mobile number must be 10 digits");
            u.setMobile(mobile);
        }
        if (body.containsKey("avatarUrl")) u.setAvatarUrl(blankToNull(str(body, "avatarUrl", 500)));
        String company = str(body, "companyName", 150);
        if (company != null) {
            if (company.isBlank()) throw new BadRequestException("Company name is required");
            p.setCompanyName(company);
        }
        if (body.containsKey("industry")) p.setIndustry(blankToNull(str(body, "industry", 120)));
        if (body.containsKey("companySize")) p.setCompanySize(blankToNull(str(body, "companySize", 40)));
        if (body.containsKey("location")) p.setLocation(blankToNull(str(body, "location", 120)));
        if (body.containsKey("website")) {
            String w = blankToNull(str(body, "website", 255));
            p.setWebsite(w == null || w.matches("(?i)^https?://.*") ? w : "https://" + w);
        }
        if (body.containsKey("companyDescription")) p.setCompanyDescription(blankToNull(str(body, "companyDescription", 3000)));
        if (body.containsKey("gstin")) {
            String g = blankToNull(str(body, "gstin", 15));
            if (g != null && !g.toUpperCase().matches("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")) {
                throw new BadRequestException("Invalid GSTIN (example: 33ABCDE1234F1Z5)");
            }
            p.setGstin(g == null ? null : g.toUpperCase());
        }
        if (body.containsKey("billingAddress")) p.setBillingAddress(blankToNull(str(body, "billingAddress", 300)));
        if (body.get("notificationPrefs") instanceof Map<?, ?> prefs) {
            Map<String, Boolean> merged = new LinkedHashMap<>(readPrefs(p));
            prefs.forEach((k, v) -> {
                if (DEFAULT_PREFS.containsKey(String.valueOf(k)) && v instanceof Boolean b) merged.put(String.valueOf(k), b);
            });
            try {
                p.setNotificationPrefs(objectMapper.writeValueAsString(merged));
            } catch (Exception e) {
                throw new BadRequestException("Invalid notification preferences");
            }
        }

        userRepository.save(u);
        clientProfileRepository.save(p);
        userDirectory.evict(userId);
        return view(p);
    }

    private ClientProfile load(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() != UserRole.CLIENT) throw new ForbiddenException("Only clients have a company profile");
        return clientProfileRepository.findById(userId).orElseGet(() -> clientProfileRepository.save(
                ClientProfile.builder().user(user).companyName(user.getFullName()).contactPerson(user.getFullName()).build()));
    }

    private Map<String, Object> view(ClientProfile p) {
        User u = p.getUser();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("mobile", u.getMobile());
        m.put("avatarUrl", u.getAvatarUrl());
        m.put("kycStatus", u.getKycStatus());
        m.put("emailVerified", u.isEmailVerified());
        m.put("memberSince", u.getCreatedAt());
        m.put("companyName", p.getCompanyName());
        m.put("industry", p.getIndustry());
        m.put("companySize", p.getCompanySize());
        m.put("location", p.getLocation());
        m.put("website", p.getWebsite());
        m.put("companyDescription", p.getCompanyDescription());
        m.put("gstin", p.getGstin());
        m.put("billingAddress", p.getBillingAddress());
        m.put("notificationPrefs", readPrefs(p));
        return m;
    }

    private Map<String, Boolean> readPrefs(ClientProfile p) {
        Map<String, Boolean> prefs = new LinkedHashMap<>(DEFAULT_PREFS);
        if (p.getNotificationPrefs() != null) {
            try {
                prefs.putAll(objectMapper.readValue(p.getNotificationPrefs(), new TypeReference<Map<String, Boolean>>() {}));
            } catch (Exception ignored) {
                // defaults
            }
        }
        return prefs;
    }

    private static String str(Map<String, Object> body, String key, int max) {
        Object v = body.get(key);
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        if (s.length() > max) throw new BadRequestException(key + " is too long (max " + max + " characters)");
        return s;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
