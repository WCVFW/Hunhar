package com.theunoia.identity.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "portfolio_items", indexes = @Index(name = "idx_portfolio_user", columnList = "userId"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 80)
    private String category;

    private Integer year;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String link;

    @Column(length = 500)
    private String imageUrl;
}
