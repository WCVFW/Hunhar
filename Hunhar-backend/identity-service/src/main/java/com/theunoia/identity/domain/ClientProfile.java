package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile extends BaseEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, length = 100)
    private String contactPerson;

    private String industry;

    private String website;

    @Column(columnDefinition = "TEXT")
    private String companyDescription;

    @Column(length = 40)
    private String companySize;

    @Column(length = 120)
    private String location;

    /** GSTIN for tax invoices (15 characters) */
    @Column(length = 15)
    private String gstin;

    @Column(length = 300)
    private String billingAddress;

    @Column(columnDefinition = "TEXT")
    private String notificationPrefs;
}
