package com.theunoia.analytics;

import com.theunoia.analytics.event.AnalyticsEventListener;
import com.theunoia.analytics.service.DashboardService;
import com.theunoia.common.event.EventEnvelope;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000",
        // live sources unreachable in this test -> dashboard must degrade to event-derived numbers
        "theunoia.services.auth=http://127.0.0.1:1", "theunoia.services.project=http://127.0.0.1:1",
        "theunoia.services.payment=http://127.0.0.1:1", "theunoia.services.user=http://127.0.0.1:1"
})
class AnalyticsIntegrationTest {

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
    AnalyticsEventListener listener;
    @Autowired
    DashboardService dashboard;

    @Test
    @SuppressWarnings("unchecked")
    void eventsRollUpIntoDashboard() {
        for (int i = 0; i < 3; i++) {
            send("user.registered", Map.of("userId", UUID.randomUUID().toString(), "role", i == 0 ? "CLIENT" : "FREELANCER"));
        }
        send("project.published", Map.of());
        send("payment.captured", Map.of("purpose", "PROJECT_PAYMENT", "amount", "10000.00"));
        send("escrow.released", Map.of("commission", "1000.00", "gst", "180.00", "netAmount", "8820.00"));
        send("credits.purchased", Map.of("price", "499.00", "credits", 70));

        Map<String, Object> d = dashboard.dashboard();
        Map<String, Object> users = (Map<String, Object>) d.get("users");
        Map<String, Object> revenue = (Map<String, Object>) d.get("revenue");
        assertThat((BigDecimal) users.get("totalUsers")).isEqualByComparingTo("3");
        assertThat(users.get("activeUsersToday")).isEqualTo(3L);
        assertThat((BigDecimal) revenue.get("platformRevenue")).isEqualByComparingTo("1499.00");
        List<Map<String, Object>> growth = (List<Map<String, Object>>) d.get("userGrowth30d");
        assertThat(growth).hasSize(30);
        assertThat((BigDecimal) growth.get(29).get("value")).isEqualByComparingTo("3");

        dashboard.refreshRollups();
        assertThat(dashboard.monthly("payments_volume", 3).get("series").toString()).contains("10000");
    }

    private void send(String type, Map<String, Object> data) {
        listener.on(new EventEnvelope(UUID.randomUUID(), type, Instant.now(), "test", data));
    }
}
