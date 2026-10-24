package com.theunoia.auth.domain;

/**
 * Account lifecycle:
 * PENDING_VERIFICATION (email / Aadhaar outstanding) -> PENDING_APPROVAL (admin review)
 * -> ACTIVE; admin may REJECT or SUSPEND (and reactivate).
 */
public enum UserStatus {
    PENDING_VERIFICATION, PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED
}
