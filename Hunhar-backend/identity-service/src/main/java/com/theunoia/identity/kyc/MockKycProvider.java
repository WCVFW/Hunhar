package com.theunoia.identity.kyc;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockKycProvider implements KycProvider {

    @Override
    public KycResult initiateAadhaarVerification(String aadhaarNumber) {
        String last4 = aadhaarNumber.length() >= 4 ? aadhaarNumber.substring(aadhaarNumber.length() - 4) : "0000";
        String verificationId = "KYC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new KycResult(true, verificationId, "Aadhaar verified successfully via DigiLocker Lite", "XXXXXXXX" + last4);
    }
}
