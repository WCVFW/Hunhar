package com.theunoia.auth.service;

import com.theunoia.auth.domain.KycVerification;
import com.theunoia.auth.domain.User;
import com.theunoia.auth.dto.AuthDtos.KycInitResponse;
import com.theunoia.auth.dto.AuthDtos.KycStatusResponse;
import com.theunoia.auth.kyc.AadhaarKycProvider;
import com.theunoia.auth.kyc.AadhaarKycProvider.Outcome;
import com.theunoia.auth.repository.KycVerificationRepository;
import com.theunoia.auth.repository.UserRepository;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KycService {

    private final AadhaarKycProvider provider;
    private final KycVerificationRepository verifications;
    private final UserRepository users;
    private final EventPublisher events;
    private final AuthService authService;

    @Transactional
    public KycInitResponse initiate(UUID userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        if (user.isAadhaarVerified()) throw ApiException.conflict("Aadhaar is already verified");
        String reference = "kyc_" + UUID.randomUUID().toString().replace("-", "");
        AadhaarKycProvider.InitResult init = provider.initiate(userId, reference);
        KycVerification v = new KycVerification();
        v.setUserId(userId);
        v.setProvider(provider.name());
        v.setProviderReference(init.reference());
        v.setRedirectUrl(init.redirectUrl());
        v.setStatus(KycVerification.Status.INITIATED);
        verifications.save(v);
        return new KycInitResponse(v.getId(), v.getStatus().name(), init.redirectUrl());
    }

    /** Called by the frontend after the DigiLocker redirect (and safe to poll). */
    @Transactional
    public KycStatusResponse refreshStatus(UUID userId) {
        KycVerification v = verifications.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.notFound("Aadhaar verification"));
        if (v.getStatus() == KycVerification.Status.INITIATED) {
            AadhaarKycProvider.StatusResult result = provider.status(v.getProviderReference());
            if (result.outcome() == Outcome.VERIFIED) {
                v.setStatus(KycVerification.Status.VERIFIED);
                v.setAadhaarLast4(result.aadhaarLast4());
                v.setNameOnDocument(result.nameOnDocument());
                v.setCompletedAt(Instant.now());
                markUserVerified(userId);
            } else if (result.outcome() == Outcome.FAILED || result.outcome() == Outcome.EXPIRED) {
                v.setStatus(result.outcome() == Outcome.FAILED ? KycVerification.Status.FAILED : KycVerification.Status.EXPIRED);
                v.setFailureReason(result.failureReason());
                v.setCompletedAt(Instant.now());
            }
        }
        return toResponse(v);
    }

    /** Admin "Verification Management": approve KYC manually after offline document review. */
    @Transactional
    public KycStatusResponse markVerifiedManually(UUID userId, String note) {
        KycVerification v = new KycVerification();
        v.setUserId(userId);
        v.setProvider("MANUAL");
        v.setProviderReference("manual_" + UUID.randomUUID());
        v.setStatus(KycVerification.Status.MANUAL);
        v.setFailureReason(note);
        v.setCompletedAt(Instant.now());
        verifications.save(v);
        markUserVerified(userId);
        return toResponse(v);
    }

    private void markUserVerified(UUID userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        user.setAadhaarVerified(true);
        user.recomputePendingStatus(authService.kycRequired(user));
        events.publish("user.kyc_verified", Map.of("userId", userId, "role", user.getRole().name(),
                "status", user.getStatus().name()));
        authService.publishIfAwaitingApproval(user);
    }

    private KycStatusResponse toResponse(KycVerification v) {
        return new KycStatusResponse(v.getId(), v.getStatus().name(), v.getAadhaarLast4(), v.getNameOnDocument(),
                v.getFailureReason(), v.getCompletedAt());
    }
}
