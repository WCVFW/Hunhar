package com.theunoia.auth.kyc;

import java.util.UUID;

/** Aadhaar verification through DigiLocker (Cashfree Verification Suite) or a dev mock. */
public interface AadhaarKycProvider {

    String name();

    /** Starts a DigiLocker consent flow; returns the provider reference and the URL to send the user to. */
    InitResult initiate(UUID userId, String reference);

    /** Polls the provider; on success returns the masked Aadhaar data. */
    StatusResult status(String reference);

    record InitResult(String reference, String redirectUrl) {
    }

    record StatusResult(Outcome outcome, String aadhaarLast4, String nameOnDocument, String failureReason) {
    }

    enum Outcome { PENDING, VERIFIED, FAILED, EXPIRED }
}
