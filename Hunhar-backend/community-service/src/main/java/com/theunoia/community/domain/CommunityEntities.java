package com.theunoia.community.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

public final class CommunityEntities {

    private CommunityEntities() {
    }

    @Getter
    @Setter
    @Entity(name = "ForumCategory")
    @Table(name = "forum_categories")
    public static class ForumCategory extends BaseEntity {
        @Column(nullable = false)
        private String name;
        @Column(nullable = false)
        private String slug;
        private String description;
        private int position;
        private boolean active = true;
    }

    @Getter
    @Setter
    @Entity(name = "ForumThread")
    @Table(name = "threads")
    public static class ForumThread extends BaseEntity {
        @Column(name = "category_id", nullable = false)
        private UUID categoryId;
        @Column(name = "author_id", nullable = false)
        private UUID authorId;
        @Column(nullable = false)
        private String type;
        @Column(nullable = false)
        private String title;
        @Column(nullable = false)
        private String body;
        @Column(nullable = false)
        private String status = "OPEN";
        private boolean pinned;
        /** Counters below are maintained by SQL / PL/pgSQL triggers. */
        @Column(name = "view_count", insertable = false, updatable = false)
        private int viewCount;
        @Column(name = "reply_count", insertable = false, updatable = false)
        private int replyCount;
        @Column(name = "vote_score", insertable = false, updatable = false)
        private int voteScore;
        @Column(name = "accepted_reply_id")
        private UUID acceptedReplyId;
        @Column(name = "last_activity_at", insertable = false, updatable = false)
        private Instant lastActivityAt;
        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "thread_tags", joinColumns = @JoinColumn(name = "thread_id"))
        @Column(name = "tag")
        private Set<String> tags = new LinkedHashSet<>();
    }

    @Getter
    @Setter
    @Entity(name = "Reply")
    @Table(name = "replies")
    public static class Reply extends BaseEntity {
        @Column(name = "thread_id", nullable = false)
        private UUID threadId;
        @Column(name = "author_id", nullable = false)
        private UUID authorId;
        @Column(nullable = false)
        private String body;
        @Column(name = "vote_score", insertable = false, updatable = false)
        private int voteScore;
        @Column(nullable = false)
        private String status = "VISIBLE";
    }

    @Getter
    @Setter
    @Entity(name = "ContentReport")
    @Table(name = "content_reports")
    public static class ContentReport extends BaseEntity {
        @Column(name = "reporter_id", nullable = false)
        private UUID reporterId;
        @Column(name = "target_type", nullable = false)
        private String targetType;
        @Column(name = "target_id", nullable = false)
        private UUID targetId;
        @Column(nullable = false)
        private String reason;
        private String details;
        @Column(nullable = false)
        private String status = "OPEN";
        @Column(name = "reviewed_by")
        private UUID reviewedBy;
        @Column(name = "reviewed_at")
        private Instant reviewedAt;
    }
}
