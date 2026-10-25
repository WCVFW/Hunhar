package com.theunoia.engagement.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID projectId;

    @Column(nullable = false)
    private UUID participant1Id;

    @Column(nullable = false)
    private UUID participant2Id;

    @Column(columnDefinition = "TEXT")
    private String lastMessage;

    private Instant lastMessageAt;

    private Instant participant1LastReadAt;

    private Instant participant2LastReadAt;

    // ----- Per-viewer display fields (not persisted) -----

    @Transient
    private UUID otherPartyId;

    @Transient
    private String otherPartyName;

    @Transient
    private String otherPartyAvatarUrl;

    @Transient
    private String otherPartyRole;

    @Transient
    private long unreadCount;

    public boolean hasParticipant(UUID userId) {
        return userId.equals(participant1Id) || userId.equals(participant2Id);
    }

    public UUID otherParticipant(UUID userId) {
        return userId.equals(participant1Id) ? participant2Id : participant1Id;
    }
}
