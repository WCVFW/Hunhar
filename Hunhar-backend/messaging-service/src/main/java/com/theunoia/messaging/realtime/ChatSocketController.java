package com.theunoia.messaging.realtime;

import com.theunoia.messaging.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** STOMP application destinations. Persisted messages are pushed back via {@link RealtimeFanout}. */
@Controller
@RequiredArgsConstructor
public class ChatSocketController {

    private final MessagingService messaging;
    private final SimpMessagingTemplate broker;

    @MessageMapping("/conversations/{conversationId}/send")
    public void send(@DestinationVariable UUID conversationId, @Payload MessagingService.SendCommand cmd, Principal principal) {
        messaging.send(UUID.fromString(principal.getName()), conversationId, cmd);
    }

    /** Ephemeral typing indicator - not persisted. */
    @MessageMapping("/conversations/{conversationId}/typing")
    public void typing(@DestinationVariable UUID conversationId, Principal principal) {
        UUID me = UUID.fromString(principal.getName());
        messaging.requireMember(conversationId, me);
        List<Map<String, Object>> list = messaging.list(me, 0, 100);
        list.stream().filter(c -> conversationId.equals(c.get("id"))).findFirst().ifPresent(c -> {
            @SuppressWarnings("unchecked")
            List<UUID> members = (List<UUID>) c.get("participants");
            members.stream().filter(m -> !m.equals(me)).forEach(m -> broker.convertAndSendToUser(m.toString(),
                    "/queue/typing", Map.of("conversationId", conversationId, "userId", me)));
        });
    }
}
