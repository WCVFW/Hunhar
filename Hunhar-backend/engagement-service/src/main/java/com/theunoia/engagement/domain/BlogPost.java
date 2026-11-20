package com.theunoia.engagement.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/** A blog article written by the SEO team in the blog dashboard. Content is Markdown. */
@Entity
@Table(name = "blog_posts", indexes = {
        @Index(name = "idx_blog_status_published", columnList = "status, publishedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogPost extends BaseEntity {

    public enum Status { PUBLISHED, DRAFT }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 600)
    private String excerpt;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(length = 500)
    private String coverImage;

    @Column(length = 80)
    private String category;

    /** Comma separated */
    @Column(length = 500)
    private String tags;

    @Column(length = 100)
    private String authorName;

    @Column(length = 100)
    private String authorRole;

    @Column(length = 500)
    private String authorAvatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Status status;

    private Instant publishedAt;

    @Column(length = 30)
    private String readTime;

    @Column(length = 200)
    private String metaTitle;

    @Column(length = 320)
    private String metaDescription;

    @Column(length = 120)
    private String focusKeyword;

    private boolean featured;

    /** Who last saved it (blog editor or admin) */
    @Column(length = 120)
    private String updatedBy;
}
