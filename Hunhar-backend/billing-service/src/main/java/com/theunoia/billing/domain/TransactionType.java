package com.theunoia.billing.domain;

public enum TransactionType {
    DEPOSIT,
    ESCROW_HOLD,
    ESCROW_RELEASE,
    COMMISSION_DEDUCTION,
    WITHDRAWAL,
    CREDIT_PURCHASE,
    REFUND,
    /** Freelancer's net share of a released milestone payment */
    MILESTONE_EARNING
}
