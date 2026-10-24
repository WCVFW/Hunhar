package com.theunoia.messaging.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "conversations")
public class Conversation extends BaseEntity {

    public enum Type { DIRECT, PROJECT }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "direct_key")
    private String directKey;

    private String title;

    /** Maintained by the trg_messages_touch PL/pgSQL trigger. */
    @Column(name = "last_message_at", insertable = false, updatable = false)
    private Instant lastMessageAt;

    @Column(name = "last_message_preview", insertable = false, updatable = false)
    private String lastMessagePreview;

    public static String directKey(UUID a, UUID b) {
        return a.compareTo(b) < 0 ? a + ":" + b : b + ":" + a;
    }
}
