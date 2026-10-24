package com.theunoia.messaging.realtime;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Horizontal scaling of WebSockets: every pod owns an exclusive, auto-delete queue bound to
 * message.sent (see {@link RealtimeTopology}), so each pod receives every message and pushes
 * it to the users connected to *that* pod. No sticky sessions or external STOMP broker needed.
 */
@Component
@RequiredArgsConstructor
public class RealtimeFanout {

    private final SimpMessagingTemplate broker;

    @RabbitListener(queues = "#{realtimeQueue.name}")
    public void deliver(EventEnvelope event) {
        EventData d = EventData.of(event);
        Object payload = d.raw().get("message");
        for (String recipient : d.strings("recipientIds")) {
            broker.convertAndSendToUser(recipient, "/queue/messages", payload);
        }
        UUID sender = d.uuid("senderId");
        if (sender != null) broker.convertAndSendToUser(sender.toString(), "/queue/messages", payload); // other tabs/devices
    }
}
