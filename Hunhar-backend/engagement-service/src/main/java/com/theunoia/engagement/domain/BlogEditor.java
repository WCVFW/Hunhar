package com.theunoia.engagement.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** A login for the blog dashboard only (SEO / content team). Not a marketplace user. */
@Entity
@Table(name = "blog_editors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogEditor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    private boolean active;

    private Instant lastLoginAt;

    private int failedLogins;

    private Instant lockedUntil;
}
