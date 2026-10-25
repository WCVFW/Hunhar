package com.theunoia.engagement.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.engagement.domain.ChatMessage;
import com.theunoia.engagement.domain.Conversation;
import com.theunoia.engagement.repository.ChatMessageRepository;
import com.theunoia.engagement.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 5000;

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserDirectoryClient userDirectory;
    private final NotificationPublisher notifications;

    @Transactional
    public Conversation startOrGetConversation(UUID u1, UUID u2, UUID projectId) {
        if (u1.equals(u2)) {
            throw new BadRequestException("You cannot message yourself");
        }
        if (projectId != null) {
            for (Conversation c : conversationRepository.findByProjectId(projectId)) {
                if (c.hasParticipant(u1) && c.hasParticipant(u2)) return c;
            }
        }
        return conversationRepository.findDirectConversation(u1, u2)
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .participant1Id(u1)
                        .participant2Id(u2)
                        .projectId(projectId)
                        .lastMessage("Conversation started")
                        .lastMessageAt(Instant.now())
                        .build()));
    }

    @Transactional
    public ChatMessage sendMessage(UUID conversationId, UUID senderId, String content, String attachmentUrl) {
        String text = content == null ? "" : content.trim();
        if (text.isEmpty() && (attachmentUrl == null || attachmentUrl.isBlank())) {
            throw new BadRequestException("Message cannot be empty");
        }
        if (text.length() > MAX_MESSAGE_LENGTH) {
            throw new BadRequestException("Message is too long (max " + MAX_MESSAGE_LENGTH + " characters)");
        }
        Conversation conv = participantConversation(conversationId, senderId);

        String senderName = userDirectory.nameOf(senderId);
        ChatMessage message = chatMessageRepository.save(ChatMessage.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .senderName(senderName != null ? senderName : "User")
                .content(text)
                .attachmentUrl(attachmentUrl)
                .build());

        Instant previous = conv.getLastMessageAt();
        conv.setLastMessage(text.isEmpty() ? "📎 Attachment" : text);
        conv.setLastMessageAt(Instant.now());
        markRead(conv, senderId);
        conversationRepository.save(conv);

        // One notification per burst of messages, not one per message
        if (previous == null || Duration.between(previous, Instant.now()).toMinutes() >= 10) {
            UUID recipient = conv.otherParticipant(senderId);
            notifications.notify(recipient, "NEW_MESSAGE",
                    "New message from " + message.getSenderName(),
                    text.length() > 120 ? text.substring(0, 120) + "…" : text,
                    null);
        }
        return message;
    }

    /** Returns the messages and marks the conversation as read for this user. */
    @Transactional
    public List<ChatMessage> getMessages(UUID conversationId, UUID userId) {
        Conversation conv = participantConversation(conversationId, userId);
        markRead(conv, userId);
        conversationRepository.save(conv);
        return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(UUID userId) {
        List<Conversation> list = conversationRepository.findUserConversations(userId);
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(
                list.stream().map(c -> c.otherParticipant(userId)).collect(Collectors.toSet()));
        for (Conversation c : list) {
            UUID other = c.otherParticipant(userId);
            c.setOtherPartyId(other);
            UserDirectoryClient.UserInfo info = users.get(other);
            if (info != null) {
                c.setOtherPartyName(info.fullName());
                c.setOtherPartyAvatarUrl(info.avatarUrl());
                c.setOtherPartyRole(info.role());
            }
            Instant lastRead = userId.equals(c.getParticipant1Id()) ? c.getParticipant1LastReadAt() : c.getParticipant2LastReadAt();
            c.setUnreadCount(chatMessageRepository.countUnread(c.getId(), userId, lastRead));
        }
        return list;
    }

    public long getTotalUnread(UUID userId) {
        return getUserConversations(userId).stream().mapToLong(Conversation::getUnreadCount).sum();
    }

    private Conversation participantConversation(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.hasParticipant(userId)) {
            throw new ForbiddenException("You are not part of this conversation");
        }
        return conv;
    }

    private static void markRead(Conversation conv, UUID userId) {
        if (userId.equals(conv.getParticipant1Id())) conv.setParticipant1LastReadAt(Instant.now());
        else conv.setParticipant2LastReadAt(Instant.now());
    }
}
