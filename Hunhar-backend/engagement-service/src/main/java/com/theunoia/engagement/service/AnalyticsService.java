package com.theunoia.engagement.service;

import com.theunoia.common.internal.InternalClient;
import com.theunoia.engagement.repository.ChatMessageRepository;
import com.theunoia.engagement.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Platform-wide numbers for the admin dashboard, collected live from each service's /internal/stats.
 * A service that is down shows up in "unavailable" instead of breaking the whole dashboard.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final InternalClient internalClient;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;

    public Map<String, Object> getPlatformAnalytics() {
        CompletableFuture<Map<String, Object>> users = fetch(internalClient.identity());
        CompletableFuture<Map<String, Object>> projects = fetch(internalClient.project());
        CompletableFuture<Map<String, Object>> money = fetch(internalClient.billing());

        Map<String, Object> result = new LinkedHashMap<>();
        List<String> unavailable = new ArrayList<>();
        put(result, "users", users.join(), "identity", unavailable);
        put(result, "projects", projects.join(), "projects", unavailable);
        put(result, "payments", money.join(), "billing", unavailable);

        Map<String, Object> engagement = new LinkedHashMap<>();
        engagement.put("conversations", conversationRepository.count());
        engagement.put("messages", chatMessageRepository.count());
        result.put("engagement", engagement);
        result.put("unavailable", unavailable);
        result.put("generatedAt", new Date());
        return result;
    }

    private CompletableFuture<Map<String, Object>> fetch(String baseUrl) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return internalClient.get(baseUrl + "/internal/stats", new ParameterizedTypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Stats unavailable from {}: {}", baseUrl, e.getMessage());
                return null;
            }
        });
    }

    private static void put(Map<String, Object> result, String key, Map<String, Object> value, String service, List<String> unavailable) {
        if (value == null) {
            unavailable.add(service);
            result.put(key, Map.of());
        } else {
            result.put(key, value);
        }
    }
}
