package com.theunoia.common.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Reads admin-controlled platform settings (owned by billing-service) with a 1-minute cache.
 * Falls back to safe defaults if billing is unreachable.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PlatformSettingsClient {

    private static final long TTL_MS = 60_000;

    private final InternalClient internalClient;
    private volatile Map<String, String> cached = Map.of();
    private volatile long loadedAt = 0;

    public int getInt(String key, int fallback) {
        try {
            return Integer.parseInt(all().getOrDefault(key, String.valueOf(fallback)));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public Map<String, String> all() {
        long now = System.currentTimeMillis();
        if (now - loadedAt > TTL_MS) {
            try {
                Map<String, String> fresh = internalClient.get(internalClient.billing() + "/internal/settings",
                        new ParameterizedTypeReference<Map<String, String>>() {});
                if (fresh != null) cached = fresh;
            } catch (Exception e) {
                log.warn("Could not refresh platform settings: {}", e.getMessage());
            }
            loadedAt = now;
        }
        return cached;
    }
}
