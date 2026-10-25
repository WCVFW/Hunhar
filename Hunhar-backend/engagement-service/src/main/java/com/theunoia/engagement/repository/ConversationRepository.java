package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.participant1Id = :userId OR c.participant2Id = :userId ORDER BY c.lastMessageAt DESC")
    List<Conversation> findUserConversations(UUID userId);

    @Query("SELECT c FROM Conversation c WHERE (c.participant1Id = :u1 AND c.participant2Id = :u2) OR (c.participant1Id = :u2 AND c.participant2Id = :u1)")
    Optional<Conversation> findDirectConversation(UUID u1, UUID u2);

    List<Conversation> findByProjectId(UUID projectId);
}
