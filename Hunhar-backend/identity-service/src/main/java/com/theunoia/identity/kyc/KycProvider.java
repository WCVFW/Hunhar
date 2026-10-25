package com.theunoia.identity.kyc;

public interface KycProvider {
    KycResult initiateAadhaarVerification(String aadhaarNumber);

    record KycResult(
            boolean success,
            String verificationId,
            String message,
            String maskedAadhaar
    ) {}
}
