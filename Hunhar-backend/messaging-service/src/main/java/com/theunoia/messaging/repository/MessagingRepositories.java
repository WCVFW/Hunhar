package com.theunoia.messaging.repository;

import com.theunoia.messaging.domain.Conversation;
import com.theunoia.messaging.domain.Message;
import com.theunoia.messaging.domain.Participant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class MessagingRepositories {

    private MessagingRepositories() {
    }

    public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
        Optional<Conversation> findByDirectKey(String directKey);

        Optional<Conversation> findByProjectId(UUID projectId);

        @Query("""
                SELECT c FROM Conversation c JOIN Participant p ON p.conversationId = c.id
                WHERE p.userId = :userId AND p.leftAt IS NULL
                ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC""")
        List<Conversation> findForUser(@Param("userId") UUID userId, Pageable pageable);
    }

    public interface ParticipantRepository extends JpaRepository<Participant, UUID> {
        List<Participant> findByConversationIdAndLeftAtIsNull(UUID conversationId);

        Optional<Participant> findByConversationIdAndUserId(UUID conversationId, UUID userId);

        @Query("SELECT count(p) FROM Participant p WHERE p.userId = :userId AND p.firstReceivedAt IS NOT NULL")
        long countReceived(@Param("userId") UUID userId);

        @Query("SELECT count(p) FROM Participant p WHERE p.userId = :userId AND p.firstReceivedAt IS NOT NULL AND p.firstRepliedAt IS NOT NULL")
        long countResponded(@Param("userId") UUID userId);
    }

    public interface MessageRepository extends JpaRepository<Message, UUID> {
        List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

        /** Keyset pagination for infinite scroll ("load older messages"). */
        List<Message> findByConversationIdAndCreatedAtBeforeOrderByCreatedAtDesc(UUID conversationId, Instant before, Pageable pageable);

        long countByConversationIdAndSenderIdNotAndDeletedAtIsNull(UUID conversationId, UUID userId);

        long countByConversationIdAndSenderIdNotAndDeletedAtIsNullAndCreatedAtAfter(UUID conversationId, UUID userId, Instant since);
    }
}
