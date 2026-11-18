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
        return sendMessage(conversationId, senderId, content, attachmentUrl, null, null, null);
    }

    /** Only files uploaded to Hunhar can be attached (no outside links). */
    private static final java.util.regex.Pattern FILE_URL =
            java.util.regex.Pattern.compile("^/api/v1/projects/files/[0-9a-fA-F-]{36}$");

    @Transactional
    public ChatMessage sendMessage(UUID conversationId, UUID senderId, String content, String attachmentUrl,
                                   String attachmentName, String attachmentType, Long attachmentSize) {
        String text = content == null ? "" : content.trim();
        String url = attachmentUrl == null || attachmentUrl.isBlank() ? null : attachmentUrl.trim();
        if (url != null && !FILE_URL.matcher(url).matches()) {
            throw new BadRequestException("Attachments must be uploaded to Hunhar first");
        }
        if (text.isEmpty() && url == null) {
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
                .attachmentUrl(url)
                .attachmentName(url == null ? null : clip(attachmentName, 255, "Attachment"))
                .attachmentType(url == null ? null : clip(attachmentType, 120, null))
                .attachmentSize(url == null || attachmentSize == null || attachmentSize < 0 ? null : attachmentSize)
                .build());

        Instant previous = conv.getLastMessageAt();
        conv.setLastMessage(preview(message));
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

    /** The sender changes the text of their own message (attachments stay as they are). */
    @Transactional
    public ChatMessage editMessage(UUID conversationId, UUID messageId, UUID userId, String content) {
        Conversation conv = participantConversation(conversationId, userId);
        ChatMessage msg = ownMessage(conversationId, messageId, userId);
        String text = content == null ? "" : content.trim();
        if (text.length() > MAX_MESSAGE_LENGTH) {
            throw new BadRequestException("Message is too long (max " + MAX_MESSAGE_LENGTH + " characters)");
        }
        if (text.isEmpty() && msg.getAttachmentUrl() == null) {
            throw new BadRequestException("Message cannot be empty. Delete it instead.");
        }
        if (text.equals(msg.getContent())) return msg;
        msg.setContent(text);
        msg.setEditedAt(Instant.now());
        chatMessageRepository.save(msg);
        refreshLastMessage(conv);
        return msg;
    }

    /** The sender deletes their own message: text and attachment are removed, a "deleted" marker stays. */
    @Transactional
    public ChatMessage deleteMessage(UUID conversationId, UUID messageId, UUID userId) {
        Conversation conv = participantConversation(conversationId, userId);
        ChatMessage msg = ownMessage(conversationId, messageId, userId);
        msg.setContent("");
        msg.setAttachmentUrl(null);
        msg.setAttachmentName(null);
        msg.setAttachmentType(null);
        msg.setAttachmentSize(null);
        msg.setDeletedAt(Instant.now());
        chatMessageRepository.save(msg);
        refreshLastMessage(conv);
        return msg;
    }

    private ChatMessage ownMessage(UUID conversationId, UUID messageId, UUID userId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .filter(m -> m.getConversationId().equals(conversationId))
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!msg.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only change your own messages");
        }
        if (msg.getDeletedAt() != null) {
            throw new BadRequestException("This message was already deleted");
        }
        return msg;
    }

    /** Keeps the conversation list preview in step after an edit or delete. */
    private void refreshLastMessage(Conversation conv) {
        conv.setLastMessage(chatMessageRepository.findFirstByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conv.getId())
                .map(ChatService::preview).orElse(null));
        conversationRepository.save(conv);
    }

    private static String preview(ChatMessage m) {
        if (m.getContent() != null && !m.getContent().isBlank()) return m.getContent();
        return "\uD83D\uDCCE " + (m.getAttachmentName() != null ? m.getAttachmentName() : "Attachment");
    }

    private static String clip(String s, int max, String fallback) {
        if (s == null || s.isBlank()) return fallback;
        String t = s.replaceAll("[\\r\\n\\t]", " ").trim();
        return t.length() > max ? t.substring(0, max) : t;
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
