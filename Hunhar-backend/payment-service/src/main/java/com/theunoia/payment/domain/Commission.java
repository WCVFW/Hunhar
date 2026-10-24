package com.theunoia.payment.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "commissions")
public class Commission extends BaseEntity {

    @Column(name = "escrow_id", nullable = false)
    private UUID escrowId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "freelancer_id", nullable = false)
    private UUID freelancerId;

    @Column(name = "gross_amount", nullable = false)
    private BigDecimal grossAmount;

    @Column(nullable = false)
    private BigDecimal rate;

    @Column(name = "commission_amount", nullable = false)
    private BigDecimal commissionAmount;

    @Column(name = "gst_amount", nullable = false)
    private BigDecimal gstAmount;

    @Column(name = "net_amount", nullable = false)
    private BigDecimal netAmount;
}
