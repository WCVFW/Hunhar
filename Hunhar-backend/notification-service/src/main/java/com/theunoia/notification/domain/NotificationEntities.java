package com.theunoia.notification.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** JPA entities of notification-service (nested to keep the module compact). */
public final class NotificationEntities {

    private NotificationEntities() {
    }

    @Getter
    @Setter
    @Entity(name = "UserContact")
    @Table(name = "user_contacts")
    public static class UserContact {
        @Id
        @Column(name = "user_id")
        private UUID userId;
        private String email;
        private String mobile;
        @Column(name = "display_name")
        private String displayName;
        private String role;
        @Column(name = "email_enabled", nullable = false)
        private boolean emailEnabled = true;
        @Column(name = "whatsapp_enabled", nullable = false)
        private boolean whatsappEnabled = true;
        @Column(name = "marketing_opt_in", nullable = false)
        private boolean marketingOptIn;
        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private Instant createdAt;
        @UpdateTimestamp
        @Column(name = "updated_at", nullable = false)
        private Instant updatedAt;
    }

    @Getter
    @Setter
    @Entity(name = "Notification")
    @Table(name = "notifications")
    public static class Notification extends BaseEntity {
        @Column(name = "user_id", nullable = false)
        private UUID userId;
        @Column(nullable = false)
        private String type;
        @Column(nullable = false)
        private String title;
        private String body;
        @JdbcTypeCode(SqlTypes.JSON)
        @Column(columnDefinition = "jsonb", nullable = false)
        private Map<String, Object> data = new HashMap<>();
        @Column(name = "read_at")
        private Instant readAt;
    }

    @Getter
    @Setter
    @Entity(name = "CalendarEvent")
    @Table(name = "calendar_events")
    public static class CalendarEvent extends BaseEntity {
        @Column(name = "owner_id", nullable = false)
        private UUID ownerId;
        @Column(nullable = false)
        private String title;
        private String description;
        @Column(nullable = false)
        private String type;
        @Column(name = "start_at", nullable = false)
        private Instant startAt;
        @Column(name = "end_at")
        private Instant endAt;
        @Column(name = "project_id")
        private UUID projectId;
        @Column(name = "milestone_id")
        private UUID milestoneId;
        @Column(name = "meeting_link")
        private String meetingLink;
        @Column(name = "reminder_at")
        private Instant reminderAt;
        @Column(name = "reminder_sent_at")
        private Instant reminderSentAt;
        @Column(name = "google_event_id")
        private String googleEventId;
        @Column(name = "source_key")
        private String sourceKey;
        @ElementCollection(fetch = FetchType.EAGER)
        @CollectionTable(name = "calendar_attendees", joinColumns = @JoinColumn(name = "event_id"))
        @Column(name = "user_id")
        private Set<UUID> attendees = new LinkedHashSet<>();
    }

    @Getter
    @Setter
    @Entity(name = "GoogleConnection")
    @Table(name = "google_calendar_connections")
    public static class GoogleConnection {
        @Id
        @Column(name = "user_id")
        private UUID userId;
        @Column(name = "refresh_token_encrypted", nullable = false)
        private String refreshTokenEncrypted;
        @Column(name = "google_email")
        private String googleEmail;
        @Column(name = "connected_at", nullable = false)
        private Instant connectedAt = Instant.now();
        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private Instant createdAt;
        @UpdateTimestamp
        @Column(name = "updated_at", nullable = false)
        private Instant updatedAt;
    }

    @Getter
    @Setter
    @Entity(name = "Campaign")
    @Table(name = "campaigns")
    public static class Campaign extends BaseEntity {
        @Column(nullable = false)
        private String name;
        @Column(name = "template_name", nullable = false)
        private String templateName;
        @Column(nullable = false)
        private String audience;
        @Column(nullable = false)
        private String message;
        @Column(nullable = false)
        private String status = "SENDING";
        @Column(name = "target_count", nullable = false)
        private int targetCount;
        @Column(name = "sent_count", nullable = false)
        private int sentCount;
        @Column(name = "created_by", nullable = false)
        private UUID createdBy;
        @Column(name = "sent_at")
        private Instant sentAt;
    }
}
