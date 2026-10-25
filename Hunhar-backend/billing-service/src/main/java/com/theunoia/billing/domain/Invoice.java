package com.theunoia.billing.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(nullable = false)
    private UUID clientId;

    @Column(nullable = false)
    private UUID freelancerId;

    private UUID projectId;

    private UUID milestoneId;

    @Column(nullable = false, length = 150)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount; // Platform fee (e.g. 10%)

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal gstAmount; // 18% GST on platform fee

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netPayoutToFreelancer;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfContent;
}
