package com.theunoia.common.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Resolves user ids to display info (name, avatar) from identity-service, with a short in-memory cache.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserDirectoryClient {

    private static final long TTL_MS = 5 * 60 * 1000;

    private final InternalClient internalClient;
    private final Map<UUID, CachedUser> cache = new ConcurrentHashMap<>();

    public record UserInfo(UUID id, String fullName, String avatarUrl, String role, String professionalTitle) {}

    private record CachedUser(UserInfo info, long loadedAt) {}

    public Map<UUID, UserInfo> lookup(Collection<UUID> ids) {
        Map<UUID, UserInfo> result = new HashMap<>();
        Set<UUID> missing = new HashSet<>();
        long now = System.currentTimeMillis();
        for (UUID id : ids) {
            if (id == null) continue;
            CachedUser cached = cache.get(id);
            if (cached != null && now - cached.loadedAt() < TTL_MS) {
                result.put(id, cached.info());
            } else {
                missing.add(id);
            }
        }
        if (!missing.isEmpty()) {
            try {
                String idsParam = missing.stream().map(UUID::toString).collect(Collectors.joining(","));
                List<UserInfo> loaded = internalClient.get(
                        internalClient.identity() + "/internal/users/lookup?ids=" + idsParam,
                        new ParameterizedTypeReference<List<UserInfo>>() {});
                if (loaded != null) {
                    for (UserInfo info : loaded) {
                        cache.put(info.id(), new CachedUser(info, now));
                        result.put(info.id(), info);
                    }
                }
            } catch (Exception e) {
                log.warn("User lookup failed: {}", e.getMessage());
            }
        }
        return result;
    }

    public String nameOf(UUID id) {
        if (id == null) return null;
        UserInfo info = lookup(List.of(id)).get(id);
        return info != null ? info.fullName() : null;
    }

    public void evict(UUID id) {
        cache.remove(id);
    }
}
