package com.theunoia.messaging.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.messaging.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

/** Project-based chats follow the project lifecycle (award -> chat room, team changes -> membership). */
@Component
@RequiredArgsConstructor
public class MessagingEventListener {

    private final IdempotencyGuard guard;
    private final MessagingService messaging;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        switch (event.type()) {
            case "project.awarded" -> messaging.ensureProjectConversation(d.uuid("projectId"), d.str("projectTitle"),
                    Arrays.asList(d.uuid("clientId"), d.uuid("freelancerId")));
            case "team.member_joined" -> messaging.joinProjectConversation(d.uuid("projectId"), d.uuid("memberId"));
            case "team.member_removed" -> messaging.leaveProjectConversation(d.uuid("projectId"), d.uuid("memberId"));
            default -> {
            }
        }
    }
}
