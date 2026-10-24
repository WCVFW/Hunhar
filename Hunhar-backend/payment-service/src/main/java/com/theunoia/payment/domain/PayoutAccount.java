package com.theunoia.payment.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Bank account or UPI handle for withdrawals. Account numbers are AES-GCM encrypted at rest. */
@Getter
@Setter
@Entity
@Table(name = "payout_accounts")
public class PayoutAccount extends BaseEntity {

    public enum Type { BANK, UPI }

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "account_holder_name", nullable = false)
    private String accountHolderName;

    @JsonIgnore
    @Column(name = "account_number_encrypted")
    private String accountNumberEncrypted;

    @Column(name = "account_last4")
    private String accountLast4;

    private String ifsc;

    @Column(name = "upi_id")
    private String upiId;

    @JsonIgnore
    @Column(name = "provider_contact_id")
    private String providerContactId;

    @JsonIgnore
    @Column(name = "provider_fund_account_id")
    private String providerFundAccountId;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAccount;

    private boolean active = true;
}
