package com.theunoia.engagement.web;

import com.theunoia.engagement.domain.Conversation;
import com.theunoia.engagement.domain.Notification;
import com.theunoia.engagement.service.ChatService;
import com.theunoia.engagement.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Service-to-service endpoints (protected by the internal key, not routed by the gateway). */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalEngagementController {

    private final NotificationService notificationService;
    private final ChatService chatService;

    @PostMapping("/notifications")
    public Map<String, Object> createNotification(@RequestBody NotificationRequest req) {
        Notification n = notificationService.sendNotification(req.getUserId(), req.getTitle(), req.getMessage(), req.getType(), req.getLink());
        return Map.of("id", n.getId());
    }

    @PostMapping("/conversations")
    public Map<String, Object> openConversation(@RequestBody ConversationRequest req) {
        Conversation c = chatService.startOrGetConversation(req.getParticipant1Id(), req.getParticipant2Id(), req.getProjectId());
        return Map.of("id", c.getId());
    }

    @Data
    public static class NotificationRequest {
        private UUID userId;
        private String type;
        private String title;
        private String message;
        private String link;
    }

    @Data
    public static class ConversationRequest {
        private UUID participant1Id;
        private UUID participant2Id;
        private UUID projectId;
    }
}
