package com.theunoia.gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Date;
import java.util.UUID;

/** Edge security rules; downstream services are unreachable here, so routed calls end in the 503 fallback. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "theunoia.gateway.services.auth=http://127.0.0.1:1",
        "theunoia.gateway.services.project=http://127.0.0.1:1",
        "spring.data.redis.port=1"
})
@AutoConfigureWebTestClient
class GatewaySecurityTest {

    private static final String SECRET = "ZGV2LW9ubHktand0LXNlY3JldC1jaGFuZ2UtbWUtaW4tcHJvZHVjdGlvbi0zMmJ5dGVzIQ==";

    @Autowired
    WebTestClient client;

    @Test
    void internalEndpointsAreNeverExposed() {
        client.get().uri("/internal/users/stats").exchange().expectStatus().isNotFound();
        client.get().uri("/api/v1/projects/internal/x").exchange().expectStatus().isNotFound();
    }

    @Test
    void protectedRoutesRequireValidAccessToken() {
        client.get().uri("/api/v1/projects/mine/list").exchange().expectStatus().isUnauthorized();
        client.post().uri("/api/v1/projects").header("Authorization", "Bearer not-a-jwt").exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.code").isEqualTo("INVALID_TOKEN");
    }

    @Test
    void publicRoutesPassWithoutTokenAndValidTokensAreForwarded() {
        // public browse -> forwarded (downstream down => circuit-breaker fallback 503)
        client.get().uri("/api/v1/projects").exchange().expectStatus().isEqualTo(503)
                .expectBody().jsonPath("$.code").isEqualTo("SERVICE_UNAVAILABLE");

        String token = Jwts.builder().subject(UUID.randomUUID().toString()).claim("typ", "access").claim("role", "CLIENT")
                .claim("status", "ACTIVE").expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET))).compact();
        client.get().uri("/api/v1/projects/mine/list").header("Authorization", "Bearer " + token).exchange()
                .expectStatus().isEqualTo(503);
        // a refresh-type or expired token is rejected
        String expired = Jwts.builder().subject(UUID.randomUUID().toString()).claim("typ", "access")
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET))).compact();
        client.get().uri("/api/v1/projects/mine/list").header("Authorization", "Bearer " + expired).exchange()
                .expectStatus().isUnauthorized();
    }
}
