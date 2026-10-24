package com.theunoia.payment.gateway;

import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Withdrawal;

/** Payout rails (bank transfer / UPI) - RazorpayX Payouts or a mock. */
public interface PayoutGateway {

    String name();

    /** Registers contact + fund account at the provider; returns the fund account id. */
    FundAccount register(PayoutAccount account, String plainAccountNumber, String userEmail);

    /** Initiates the transfer. Status may already be final (mock) or arrive later via webhook. */
    PayoutResult payout(Withdrawal withdrawal, PayoutAccount account);

    record FundAccount(String contactId, String fundAccountId) {
    }

    enum PayoutStatus { PROCESSING, PROCESSED, FAILED }

    record PayoutResult(String payoutId, PayoutStatus status, String failureReason) {
    }
}
