package com.theunoia.billing.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "credit_wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditWallet extends BaseEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    @Builder.Default
    private int balance = 10; // Starter credits given to every freelancer

    @Column(nullable = false)
    @Builder.Default
    private int totalPurchased = 0;

    @Column(nullable = false)
    @Builder.Default
    private int totalConsumed = 0;
}
