package com.theunoia.gateway.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Set;

/**
 * Suspended accounts, refreshed from identity-service every minute. A login token stays valid for 24 hours,
 * so without this a user an admin suspends could keep using the site until their token expired.
 */
@Slf4j
@Component
public class SuspendedUsers {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String identityUrl;
    private final String internalKey;
    private volatile Set<String> suspended = Set.of();

    public SuspendedUsers(@Value("${IDENTITY_SERVICE_URL:http://localhost:8081}") String identityUrl,
                          @Value("${theunoia.internal.key:${INTERNAL_API_KEY:hunhar-internal-dev-key-change-me}}") String internalKey) {
        this.identityUrl = identityUrl.replaceAll("/$", "");
        this.internalKey = internalKey;
    }

    public boolean isSuspended(String userId) {
        return userId != null && suspended.contains(userId);
    }

    @Scheduled(initialDelay = 5_000, fixedDelay = 60_000)
    public void refresh() {
        try {
            HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(identityUrl + "/internal/users/suspended"))
                    .timeout(Duration.ofSeconds(5))
                    .header("X-Internal-Key", internalKey)
                    .GET().build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("Could not refresh suspended users: HTTP {}", res.statusCode());
                return; // keep the last known list
            }
            List<String> ids = mapper.readValue(res.body(), new TypeReference<List<String>>() {});
            suspended = Set.copyOf(ids);
        } catch (Exception e) {
            log.warn("Could not refresh suspended users: {}", e.getMessage());
        }
    }
}
