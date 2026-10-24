package com.theunoia.content.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public final class ContentEntities {

    private ContentEntities() {
    }

    /** Search engine metadata management, shared by pages and blog posts. */
    @Getter
    @Setter
    @Embeddable
    public static class Seo {
        @Column(name = "meta_title")
        private String metaTitle;
        @Column(name = "meta_description")
        private String metaDescription;
        @Column(name = "meta_keywords")
        private String metaKeywords;
        @Column(name = "canonical_url")
        private String canonicalUrl;
        @Column(name = "og_image_url")
        private String ogImageUrl;
    }

    @Getter
    @Setter
    @Entity(name = "Page")
    @Table(name = "pages")
    public static class Page extends BaseEntity {
        @Column(nullable = false)
        private String slug;
        @Column(nullable = false)
        private String title;
        @Column(nullable = false)
        private String type = "STATIC";
        /** Dynamic landing pages: ordered list of blocks rendered by the frontend. */
        @JdbcTypeCode(SqlTypes.JSON)
        @Column(columnDefinition = "jsonb", nullable = false)
        private List<Map<String, Object>> sections = new ArrayList<>();
        @Column(nullable = false)
        private String status = "PUBLISHED";
        @Embedded
        private Seo seo = new Seo();
    }

    @Getter
    @Setter
    @Entity(name = "BlogCategory")
    @Table(name = "blog_categories")
    public static class BlogCategory extends BaseEntity {
        @Column(nullable = false)
        private String name;
        @Column(nullable = false)
        private String slug;
        private String description;
    }

    @Getter
    @Setter
    @Entity(name = "BlogPost")
    @Table(name = "blog_posts")
    public static class BlogPost extends BaseEntity {
        @Column(nullable = false)
        private String title;
        @Column(nullable = false)
        private String slug;
        private String excerpt;
        @Column(nullable = false)
        private String content;
        @Column(name = "cover_image_url")
        private String coverImageUrl;
        @Column(name = "category_id")
        private UUID categoryId;
        @Column(name = "author_name", nullable = false)
        private String authorName = "THEUNOiA Team";
        @Column(nullable = false)
        private String status = "DRAFT";
        @Column(name = "published_at")
        private Instant publishedAt;
        @Column(name = "view_count", insertable = false, updatable = false)
        private int viewCount;
        /** Computed by the trg_blog_reading_time PL/pgSQL trigger. */
        @Column(name = "reading_minutes", insertable = false, updatable = false)
        private int readingMinutes;
        @Embedded
        private Seo seo = new Seo();
        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "blog_post_tags", joinColumns = @JoinColumn(name = "post_id"))
        @Column(name = "tag")
        private Set<String> tags = new LinkedHashSet<>();
    }

    @Getter
    @Setter
    @Entity(name = "Faq")
    @Table(name = "faqs")
    public static class Faq extends BaseEntity {
        @Column(nullable = false)
        private String question;
        @Column(nullable = false)
        private String answer;
        @Column(nullable = false)
        private String category = "GENERAL";
        private int position;
        private boolean active = true;
    }

    @Getter
    @Setter
    @Entity(name = "ContactInquiry")
    @Table(name = "contact_inquiries")
    public static class ContactInquiry extends BaseEntity {
        @Column(nullable = false)
        private String name;
        @Column(nullable = false)
        private String email;
        private String phone;
        @Column(nullable = false)
        private String subject;
        @Column(nullable = false)
        private String message;
        @Column(nullable = false)
        private String status = "NEW";
        private String notes;
    }

    @Getter
    @Setter
    @Entity(name = "Lead")
    @Table(name = "leads")
    public static class Lead extends BaseEntity {
        private String name;
        @Column(nullable = false)
        private String email;
        private String phone;
        @Column(nullable = false)
        private String type;
        private String source;
        @Column(name = "utm_source")
        private String utmSource;
        @Column(name = "utm_medium")
        private String utmMedium;
        @Column(name = "utm_campaign")
        private String utmCampaign;
        @JdbcTypeCode(SqlTypes.JSON)
        @Column(columnDefinition = "jsonb", nullable = false)
        private Map<String, Object> metadata = new HashMap<>();
    }
}
