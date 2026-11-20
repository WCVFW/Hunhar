package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.EncryptionUtils;
import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.KycVerification;
import com.theunoia.identity.domain.KycVerification.Step;
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
    private final com.theunoia.identity.repository.KycVerificationRepository verificationRepository;

    /** Only files uploaded to Hunhar can be used as KYC documents. */
    private static final java.util.regex.Pattern FILE_URL =
            java.util.regex.Pattern.compile("^/api/v1/projects/files/[0-9a-fA-F-]{36}$");

    public enum DocumentStep { AADHAAR, COLLEGE_ID }

    /** Step 3/4: upload the Aadhaar card or the college ID card (replacing an earlier upload under review). */
    @Transactional
    public Map<String, Object> submitDocument(UUID userId, DocumentStep step, String url, String name) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getKycStatus() == KycStatus.VERIFIED) throw new BadRequestException("Your KYC is already verified");
        String u = url == null ? "" : url.trim();
        if (!FILE_URL.matcher(u).matches()) throw new BadRequestException("Please upload the document again");
        KycVerification v = verification(userId);
        if (step == DocumentStep.AADHAAR) {
            v.setAadhaarDocUrl(u);
            v.setAadhaarDocName(clip(name, 255, "Aadhaar card"));
            v.setAadhaarStatus(Step.UNDER_REVIEW);
        } else {
            v.setCollegeDocUrl(u);
            v.setCollegeDocName(clip(name, 255, "College ID"));
            v.setCollegeStatus(Step.UNDER_REVIEW);
        }
        verificationRepository.save(v);
        submitForReviewWhenComplete(user, v);
        return status(user);
    }

    /** Step 5: skills to verify, with an optional work sample. */
    @Transactional
    public Map<String, Object> submitSkills(UUID userId, List<String> skills, String sampleUrl, String sampleName) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getKycStatus() == KycStatus.VERIFIED) throw new BadRequestException("Your KYC is already verified");
        List<String> clean = skills == null ? List.of() : skills.stream()
                .filter(s -> s != null && !s.isBlank()).map(s -> clip(s, 50, "")).distinct().limit(15).toList();
        if (clean.isEmpty()) throw new BadRequestException("Choose at least one skill");
        String sample = sampleUrl == null || sampleUrl.isBlank() ? null : sampleUrl.trim();
        if (sample != null && !FILE_URL.matcher(sample).matches()) throw new BadRequestException("Please upload the work sample again");
        KycVerification v = verification(userId);
        v.setSkills(String.join(",", clean));
        if (sample != null) {
            v.setWorkSampleUrl(sample);
            v.setWorkSampleName(clip(sampleName, 255, "Work sample"));
        }
        v.setSkillsStatus(Step.UNDER_REVIEW);
        verificationRepository.save(v);
        submitForReviewWhenComplete(user, v);
        return status(user);
    }

    private KycVerification verification(UUID userId) {
        return verificationRepository.findById(userId).orElseGet(() -> KycVerification.builder()
                .userId(userId).aadhaarStatus(Step.NOT_STARTED).collegeStatus(Step.NOT_STARTED).skillsStatus(Step.NOT_STARTED).build());
    }

    private static boolean done(Step s) {
        return s == Step.UNDER_REVIEW || s == Step.VERIFIED;
    }

    /** Once all three steps are submitted, the KYC goes to the admin queue. */
    private void submitForReviewWhenComplete(User user, KycVerification v) {
        if (!done(v.getAadhaarStatus()) || !done(v.getCollegeStatus()) || !done(v.getSkillsStatus())) return;
        v.setSubmittedAt(Instant.now());
        verificationRepository.save(v);
        if (user.getKycStatus() == KycStatus.PENDING_REVIEW) return;
        user.setKycStatus(KycStatus.PENDING_REVIEW);
        user.setKycSubmittedAt(Instant.now());
        user.setKycDocumentUrl(v.getAadhaarDocUrl());
        user.setKycRejectionReason(null);
        userRepository.save(user);
    }

    private static String clip(String s, int max, String fallback) {
        if (s == null || s.isBlank()) return fallback;
        String t = s.replaceAll("[\\r\\n\\t]", " ").trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

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
        if (dto.getDocumentUrl() != null && FILE_URL.matcher(dto.getDocumentUrl().trim()).matches()) {
            KycVerification v = verification(userId);
            v.setAadhaarDocUrl(dto.getDocumentUrl().trim());
            if (v.getAadhaarDocName() == null) v.setAadhaarDocName("Aadhaar card");
            v.setAadhaarStatus(Step.UNDER_REVIEW);
            verificationRepository.save(v);
        }
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
        verificationRepository.findById(userId).ifPresent(v -> {
            Step result = approved ? Step.VERIFIED : Step.REJECTED;
            if (v.getAadhaarStatus() != Step.NOT_STARTED) v.setAadhaarStatus(result);
            if (v.getCollegeStatus() != Step.NOT_STARTED) v.setCollegeStatus(result);
            if (v.getSkillsStatus() != Step.NOT_STARTED) v.setSkillsStatus(result);
            verificationRepository.save(v);
        });

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

        KycVerification v = verificationRepository.findById(u.getId()).orElse(null);
        // KYC done before the step-by-step flow: the Aadhaar step follows the overall status
        Step legacyAadhaar = u.getKycStatus() == KycStatus.VERIFIED ? Step.VERIFIED
                : u.getKycStatus() == KycStatus.PENDING_REVIEW ? Step.UNDER_REVIEW : Step.NOT_STARTED;
        Step aadhaar = v != null && v.getAadhaarStatus() != null && v.getAadhaarStatus() != Step.NOT_STARTED ? v.getAadhaarStatus() : legacyAadhaar;
        Step college = v != null && v.getCollegeStatus() != null ? v.getCollegeStatus() : Step.NOT_STARTED;
        Step skills = v != null && v.getSkillsStatus() != null ? v.getSkillsStatus() : Step.NOT_STARTED;
        m.put("emailVerified", u.isEmailVerified());
        m.put("mobileVerified", u.isMobileVerified());
        m.put("aadhaarStatus", aadhaar);
        m.put("aadhaarDocumentUrl", v != null && v.getAadhaarDocUrl() != null ? v.getAadhaarDocUrl() : u.getKycDocumentUrl());
        m.put("aadhaarDocumentName", v != null ? v.getAadhaarDocName() : null);
        m.put("collegeIdStatus", college);
        m.put("collegeIdDocumentUrl", v != null ? v.getCollegeDocUrl() : null);
        m.put("collegeIdDocumentName", v != null ? v.getCollegeDocName() : null);
        m.put("skillsStatus", skills);
        m.put("selectedSkills", v != null && v.getSkills() != null && !v.getSkills().isBlank() ? List.of(v.getSkills().split(",")) : List.of());
        m.put("workSampleUrl", v != null ? v.getWorkSampleUrl() : null);
        m.put("workSampleName", v != null ? v.getWorkSampleName() : null);
        int pct = (u.isEmailVerified() ? 20 : 0) + (u.isMobileVerified() ? 20 : 0)
                + (done(aadhaar) ? 20 : 0) + (done(college) ? 20 : 0) + (done(skills) ? 20 : 0);
        m.put("percentage", pct);
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
