package com.theunoia.messaging.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.messaging.domain.Conversation;
import com.theunoia.messaging.domain.Message;
import com.theunoia.messaging.domain.Participant;
import com.theunoia.messaging.repository.MessagingRepositories.ConversationRepository;
import com.theunoia.messaging.repository.MessagingRepositories.MessageRepository;
import com.theunoia.messaging.repository.MessagingRepositories.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversations;
    private final ParticipantRepository participants;
    private final MessageRepository messages;
    private final EventPublisher events;

    public record SendCommand(String body, List<Map<String, Object>> attachments) {
    }

    // ------------------------------------------------------------------ conversations

    /** One-to-one conversation; idempotent thanks to the unique direct_key. */
    @Transactional
    public Map<String, Object> openDirect(UUID me, UUID other) {
        if (me.equals(other)) throw ApiException.badRequest("Cannot start a conversation with yourself");
        String key = Conversation.directKey(me, other);
        Conversation c = conversations.findByDirectKey(key).orElseGet(() -> {
            Conversation n = new Conversation();
            n.setType(Conversation.Type.DIRECT);
            n.setDirectKey(key);
            conversations.saveAndFlush(n);
            addParticipant(n.getId(), me, "MEMBER");
            addParticipant(n.getId(), other, "MEMBER");
            return n;
        });
        return summary(c, me);
    }

    /** Project-based chat, created automatically when a project is awarded. */
    @Transactional
    public Conversation ensureProjectConversation(UUID projectId, String title, List<UUID> members) {
        Conversation c = conversations.findByProjectId(projectId).orElseGet(() -> {
            Conversation n = new Conversation();
            n.setType(Conversation.Type.PROJECT);
            n.setProjectId(projectId);
            n.setTitle(title);
            return conversations.saveAndFlush(n);
        });
        for (UUID m : members) {
            if (m != null) joinProject(c.getId(), m);
        }
        return c;
    }

    @Transactional
    public void joinProjectConversation(UUID projectId, UUID memberId) {
        conversations.findByProjectId(projectId).ifPresent(c -> joinProject(c.getId(), memberId));
    }

    @Transactional
    public void leaveProjectConversation(UUID projectId, UUID memberId) {
        conversations.findByProjectId(projectId)
                .flatMap(c -> participants.findByConversationIdAndUserId(c.getId(), memberId))
                .ifPresent(p -> p.setLeftAt(Instant.now()));
    }

    private void joinProject(UUID conversationId, UUID userId) {
        participants.findByConversationIdAndUserId(conversationId, userId)
                .ifPresentOrElse(p -> p.setLeftAt(null), () -> addParticipant(conversationId, userId, "MEMBER"));
    }

    private void addParticipant(UUID conversationId, UUID userId, String role) {
        Participant p = new Participant();
        p.setConversationId(conversationId);
        p.setUserId(userId);
        p.setRole(role);
        participants.save(p);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(UUID me, int page, int size) {
        return conversations.findForUser(me, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)))
                .stream().map(c -> summary(c, me)).toList();
    }

    @Transactional(readOnly = true)
    public long totalUnread(UUID me) {
        return conversations.findForUser(me, PageRequest.of(0, 500)).stream()
                .mapToLong(c -> unread(c.getId(), me)).sum();
    }

    // ------------------------------------------------------------------ messages

    @Transactional(readOnly = true)
    public List<Message> history(UUID me, UUID conversationId, Instant before, int limit) {
        requireMember(conversationId, me);
        PageRequest page = PageRequest.of(0, Math.min(Math.max(limit, 1), 100));
        return before == null ? messages.findByConversationIdOrderByCreatedAtDesc(conversationId, page)
                : messages.findByConversationIdAndCreatedAtBeforeOrderByCreatedAtDesc(conversationId, before, page);
    }

    @Transactional
    public Message send(UUID me, UUID conversationId, SendCommand cmd) {
        boolean hasBody = cmd.body() != null && !cmd.body().isBlank();
        boolean hasFiles = cmd.attachments() != null && !cmd.attachments().isEmpty();
        if (!hasBody && !hasFiles) throw ApiException.badRequest("Message must contain text or an attachment");
        if (hasBody && cmd.body().length() > 10_000) throw ApiException.badRequest("Message too long");
        Participant sender = requireMember(conversationId, me);
        Conversation c = conversations.findById(conversationId).orElseThrow(() -> ApiException.notFound("Conversation"));

        Message m = new Message();
        m.setConversationId(conversationId);
        m.setSenderId(me);
        m.setBody(hasBody ? cmd.body().trim() : null);
        if (hasFiles) m.setAttachments(new ArrayList<>(cmd.attachments()));
        messages.saveAndFlush(m);

        Instant now = Instant.now();
        sender.setLastReadAt(now);
        List<UUID> recipients = new ArrayList<>();
        List<UUID> statsChanged = new ArrayList<>();
        if (sender.getFirstReceivedAt() != null && sender.getFirstRepliedAt() == null) {
            sender.setFirstRepliedAt(now);
            statsChanged.add(me);
        }
        for (Participant p : participants.findByConversationIdAndLeftAtIsNull(conversationId)) {
            if (p.getUserId().equals(me)) continue;
            recipients.add(p.getUserId());
            if (p.getFirstReceivedAt() == null) {
                p.setFirstReceivedAt(now);
                statsChanged.add(p.getUserId());
            }
        }
        participants.flush();
        for (UUID u : statsChanged) {
            events.publish("messaging.response_stats", Map.of("userId", u,
                    "received", participants.countReceived(u), "responded", participants.countResponded(u)));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("messageId", m.getId());
        data.put("conversationId", conversationId);
        data.put("conversationType", c.getType().name());
        data.put("senderId", me);
        data.put("recipientIds", recipients);
        data.put("preview", hasBody ? m.getBody().substring(0, Math.min(m.getBody().length(), 120)) : "[attachment]");
        data.put("message", toPayload(m));
        if (c.getProjectId() != null) data.put("projectId", c.getProjectId());
        events.publish("message.sent", data);
        return m;
    }

    @Transactional
    public void markRead(UUID me, UUID conversationId) {
        requireMember(conversationId, me).setLastReadAt(Instant.now());
    }

    @Transactional
    public Message delete(UUID me, UUID messageId) {
        Message m = messages.findById(messageId).orElseThrow(() -> ApiException.notFound("Message"));
        if (!m.getSenderId().equals(me)) throw ApiException.forbidden("You can only delete your own messages");
        m.setDeletedAt(Instant.now());
        m.setBody(null);
        m.setAttachments(new ArrayList<>(List.of(Map.of("deleted", true))));
        return m;
    }

    // ------------------------------------------------------------------ helpers

    public Participant requireMember(UUID conversationId, UUID userId) {
        return participants.findByConversationIdAndUserId(conversationId, userId).filter(p -> p.getLeftAt() == null)
                .orElseThrow(() -> ApiException.forbidden("You are not a participant of this conversation"));
    }

    private long unread(UUID conversationId, UUID me) {
        Instant since = participants.findByConversationIdAndUserId(conversationId, me).map(Participant::getLastReadAt).orElse(null);
        return since == null ? messages.countByConversationIdAndSenderIdNotAndDeletedAtIsNull(conversationId, me)
                : messages.countByConversationIdAndSenderIdNotAndDeletedAtIsNullAndCreatedAtAfter(conversationId, me, since);
    }

    private Map<String, Object> summary(Conversation c, UUID me) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("id", c.getId());
        s.put("type", c.getType().name());
        s.put("projectId", c.getProjectId());
        s.put("title", c.getTitle());
        s.put("participants", participants.findByConversationIdAndLeftAtIsNull(c.getId()).stream().map(Participant::getUserId).toList());
        s.put("lastMessageAt", c.getLastMessageAt());
        s.put("lastMessagePreview", c.getLastMessagePreview());
        s.put("unread", unread(c.getId(), me));
        return s;
    }

    public static Map<String, Object> toPayload(Message m) {
        Map<String, Object> p = new HashMap<>();
        p.put("id", m.getId());
        p.put("conversationId", m.getConversationId());
        p.put("senderId", m.getSenderId());
        p.put("body", m.getBody());
        p.put("attachments", m.getAttachments());
        p.put("createdAt", m.getCreatedAt() == null ? Instant.now().toString() : m.getCreatedAt().toString());
        return p;
    }
}
