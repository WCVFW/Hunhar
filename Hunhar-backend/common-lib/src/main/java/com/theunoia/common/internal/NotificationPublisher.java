package com.theunoia.common.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Sends in-app notifications to engagement-service. Fire-and-forget: a notification
 * failure must never break the business action that triggered it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private final InternalClient internalClient;

    public void notify(UUID userId, String type, String title, String message, String link) {
        if (userId == null) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId.toString());
        body.put("type", type);
        body.put("title", title);
        body.put("message", message);
        body.put("link", link);

        CompletableFuture.runAsync(() -> {
            try {
                internalClient.post(internalClient.engagement() + "/internal/notifications", body,
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Could not deliver notification '{}' to {}: {}", title, userId, e.getMessage());
            }
        });
    }
}
