package com.theunoia.credit.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "credit_packages")
public class CreditPackage extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int credits;

    @Column(name = "bonus_credits", nullable = false)
    private int bonusCredits;

    @Column(nullable = false)
    private BigDecimal price;

    private boolean active = true;

    private int position;

    public int totalCredits() {
        return credits + bonusCredits;
    }
}
