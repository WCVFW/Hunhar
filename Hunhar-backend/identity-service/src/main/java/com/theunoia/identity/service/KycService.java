package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.EncryptionUtils;
import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.User;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.dto.KycRequestDto;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manual KYC: the user submits their Aadhaar number and a photo of the card,
 * an admin reviews it. (No automatic approval.)
 */
@Service
@RequiredArgsConstructor
public class KycService {

    private final UserRepository userRepository;
    private final EncryptionUtils encryptionUtils;
    private final NotificationPublisher notifications;

    @Transactional
    public Map<String, Object> submit(UUID userId, KycRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new BadRequestException("Your KYC is already verified");
        }
        if (user.getKycStatus() == KycStatus.PENDING_REVIEW) {
            throw new BadRequestException("Your KYC is already under review");
        }
        if (!isValidAadhaar(dto.getAadhaarNumber())) {
            throw new BadRequestException("This is not a valid Aadhaar number. Please check and try again.");
        }

        String num = dto.getAadhaarNumber();
        user.setAadhaarNumberEnc(encryptionUtils.encrypt(num));
        user.setAadhaarLast4(num.substring(num.length() - 4));
        user.setKycDocumentUrl(dto.getDocumentUrl().trim());
        user.setKycStatus(KycStatus.PENDING_REVIEW);
        user.setKycSubmittedAt(Instant.now());
        user.setKycRejectionReason(null);
        userRepository.save(user);
        return status(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(UUID userId) {
        return status(userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(KycStatus status) {
        List<User> users = status == null
                ? userRepository.findByKycStatusNotOrderByKycSubmittedAtDesc(KycStatus.NOT_SUBMITTED)
                : userRepository.findByKycStatusOrderByKycSubmittedAtAsc(status);
        return users.stream().filter(u -> u.getRole() != UserRole.ADMIN).map(u -> {
            Map<String, Object> m = status(u);
            m.put("userId", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("mobile", u.getMobile());
            m.put("role", u.getRole());
            m.put("avatarUrl", u.getAvatarUrl());
            m.put("memberSince", u.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void review(UUID userId, boolean approved, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getKycStatus() != KycStatus.PENDING_REVIEW) {
            throw new BadRequestException("This KYC is not waiting for review");
        }
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BadRequestException("Please give a reason for rejecting");
        }
        user.setKycStatus(approved ? KycStatus.VERIFIED : KycStatus.REJECTED);
        user.setKycReviewedAt(Instant.now());
        user.setKycRejectionReason(approved ? null : reason.trim());
        userRepository.save(user);

        String base = user.getRole() == UserRole.CLIENT ? "/client" : "/freelancer";
        notifications.notify(userId, approved ? "KYC_APPROVED" : "KYC_REJECTED",
                approved ? "KYC verified ✅" : "KYC needs attention",
                approved ? "Your identity is verified. You now have the verified badge and can withdraw earnings."
                        : "Your KYC was not approved: " + reason.trim() + ". Please submit again.",
                base + "/settings");
    }

    private Map<String, Object> status(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kycStatus", u.getKycStatus());
        m.put("aadhaarLast4", u.getAadhaarLast4());
        m.put("documentUrl", u.getKycDocumentUrl());
        m.put("submittedAt", u.getKycSubmittedAt());
        m.put("reviewedAt", u.getKycReviewedAt());
        m.put("rejectionReason", u.getKycRejectionReason());
        return m;
    }

    /** Aadhaar uses the Verhoeff checksum and never starts with 0 or 1. */
    static boolean isValidAadhaar(String number) {
        if (number == null || !number.matches("^[2-9][0-9]{11}$")) return false;
        int[][] d = {{0,1,2,3,4,5,6,7,8,9},{1,2,3,4,0,6,7,8,9,5},{2,3,4,0,1,7,8,9,5,6},{3,4,0,1,2,8,9,5,6,7},{4,0,1,2,3,9,5,6,7,8},
                {5,9,8,7,6,0,4,3,2,1},{6,5,9,8,7,1,0,4,3,2},{7,6,5,9,8,2,1,0,4,3},{8,7,6,5,9,3,2,1,0,4},{9,8,7,6,5,4,3,2,1,0}};
        int[][] p = {{0,1,2,3,4,5,6,7,8,9},{1,5,7,6,2,8,3,0,9,4},{5,8,0,3,7,9,6,1,4,2},{8,9,1,6,0,4,3,5,2,7},{9,4,5,3,1,2,6,8,7,0},
                {4,2,8,6,5,7,3,9,0,1},{2,7,9,3,8,0,6,4,1,5},{7,0,4,6,9,1,3,2,5,8}};
        int c = 0;
        for (int i = 0; i < number.length(); i++) {
            int digit = number.charAt(number.length() - 1 - i) - '0';
            c = d[c][p[i % 8][digit]];
        }
        return c == 0;
    }
}
