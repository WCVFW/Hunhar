package com.theunoia.user;

import com.theunoia.common.event.EventEnvelope;
import com.theunoia.user.event.UserEventListener;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
@AutoConfigureMockMvc
class UserServiceIntegrationTest {

    private static final EmbeddedPostgres PG;

    static {
        try {
            PG = EmbeddedPostgres.builder().start();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
    }

    @AfterAll
    static void stop() throws IOException {
        PG.close();
    }

    @Autowired
    UserEventListener listener;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    MockMvc mvc;

    private void send(String type, Map<String, Object> data) {
        listener.on(new EventEnvelope(UUID.randomUUID(), type, Instant.now(), "test", data));
    }

    @Test
    void profilesAndRankingFromEvents() throws Exception {
        UUID strong = UUID.randomUUID();
        UUID fresh = UUID.randomUUID();
        for (UUID id : List.of(strong, fresh)) {
            send("user.registered", Map.of("userId", id.toString(), "role", "FREELANCER", "profile",
                    Map.of("fullName", "Dev " + id.toString().substring(0, 4), "skills", List.of("Java", "React"),
                            "portfolioLinks", List.of("https://example.com"))));
            send("user.approved", Map.of("userId", id.toString(), "status", "ACTIVE"));
        }
        // idempotency: same event id twice is processed once
        EventEnvelope review = new EventEnvelope(UUID.randomUUID(), "review.created", Instant.now(), "test",
                Map.of("revieweeId", strong.toString(), "revieweeRole", "FREELANCER", "rating", 5));
        listener.on(review);
        listener.on(review);
        send("project.completed", Map.of("freelancerId", strong.toString()));
        send("escrow.released", Map.of("freelancerId", strong.toString(), "netAmount", "45000.00"));
        send("messaging.response_stats", Map.of("userId", strong.toString(), "received", 4, "responded", 3));

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM freelancer_stats WHERE user_id = ?", strong);
        assertThat(row.get("total_reviews")).isEqualTo(1);
        assertThat((BigDecimal) row.get("avg_rating")).isEqualByComparingTo("5.00");
        assertThat((BigDecimal) row.get("success_rate")).isEqualByComparingTo("100.00");
        assertThat((BigDecimal) row.get("response_rate")).isEqualByComparingTo("75.00");
        assertThat((BigDecimal) row.get("score")).isGreaterThan(BigDecimal.ZERO);

        mvc.perform(get("/api/v1/users/leaderboard").header("X-Internal-Token", "dev-internal-token-change-me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(strong.toString()))
                .andExpect(jsonPath("$[0].skills.length()").value(2));

        mvc.perform(get("/api/v1/users/freelancers").param("skill", "java")
                        .header("X-Internal-Token", "dev-internal-token-change-me"))
                .andExpect(jsonPath("$.totalItems").value(2));

        mvc.perform(put("/api/v1/users/me/skills").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"skills\":[\"Go\",\"Kubernetes\"]}")
                        .header("X-Internal-Token", "dev-internal-token-change-me")
                        .header("X-User-Id", fresh.toString()).header("X-User-Role", "FREELANCER").header("X-User-Status", "ACTIVE"))
                .andExpect(status().isOk());

        mvc.perform(get("/internal/freelancers/matching").param("skills", "kubernetes")
                        .header("X-Internal-Token", "dev-internal-token-change-me"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0]").value(fresh.toString()));
    }
}
