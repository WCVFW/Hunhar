package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversationId = :conversationId " +
            "AND m.senderId <> :userId AND (:since IS NULL OR m.createdAt > :since)")
    long countUnread(@org.springframework.data.repository.query.Param("conversationId") UUID conversationId,
                     @org.springframework.data.repository.query.Param("userId") UUID userId,
                     @org.springframework.data.repository.query.Param("since") java.time.Instant since);
}
