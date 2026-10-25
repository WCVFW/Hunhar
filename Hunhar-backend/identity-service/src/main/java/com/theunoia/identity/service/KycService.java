package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.User;
import com.theunoia.identity.dto.KycRequestDto;
import com.theunoia.identity.kyc.KycProvider;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KycService {

    private final UserRepository userRepository;
    private final KycProvider kycProvider;
    private final com.theunoia.common.security.EncryptionUtils encryptionUtils;

    @Transactional
    public KycProvider.KycResult submitAadhaarVerification(UUID userId, KycRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new BadRequestException("Aadhaar KYC is already verified");
        }

        KycProvider.KycResult result = kycProvider.initiateAadhaarVerification(dto.getAadhaarNumber());
        if (result.success()) {
            user.setKycStatus(KycStatus.VERIFIED);
            user.setAadhaarRefId(encryptionUtils.encrypt(result.verificationId()));
            String num = dto.getAadhaarNumber();
            user.setAadhaarLast4(num.substring(num.length() - 4));
            userRepository.save(user);
        }

        return result;
    }

    @Transactional
    public void adminApproveKyc(UUID userId, boolean approved) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setKycStatus(approved ? KycStatus.VERIFIED : KycStatus.REJECTED);
        userRepository.save(user);
    }
}
