package com.theunoia.messaging.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "conversation_participants")
public class Participant extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String role = "MEMBER";

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(name = "first_received_at")
    private Instant firstReceivedAt;

    @Column(name = "first_replied_at")
    private Instant firstRepliedAt;

    @Column(name = "left_at")
    private Instant leftAt;
}
