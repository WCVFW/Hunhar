package com.theunoia.messaging;

import com.theunoia.common.event.EventEnvelope;
import com.theunoia.messaging.event.MessagingEventListener;
import com.theunoia.messaging.service.MessagingService;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
class MessagingIntegrationTest {

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
    MessagingService messaging;
    @Autowired
    MessagingEventListener listener;
    @Autowired
    JdbcTemplate jdbc;

    @Test
    void directAndProjectChats() {
        UUID client = UUID.randomUUID();
        UUID freelancer = UUID.randomUUID();
        UUID outsider = UUID.randomUUID();

        UUID dm = (UUID) messaging.openDirect(client, freelancer).get("id");
        assertThat(messaging.openDirect(freelancer, client).get("id")).isEqualTo(dm); // one thread per pair

        messaging.send(client, dm, new MessagingService.SendCommand("Hi, are you available?", null));
        messaging.send(client, dm, new MessagingService.SendCommand(null,
                List.of(Map.of("fileId", UUID.randomUUID().toString(), "fileName", "brief.pdf", "url", "https://files/brief.pdf"))));
        assertThat(messaging.totalUnread(freelancer)).isEqualTo(2);
        messaging.send(freelancer, dm, new MessagingService.SendCommand("Yes!", null));
        messaging.markRead(freelancer, dm);
        assertThat(messaging.totalUnread(freelancer)).isZero();
        assertThat(messaging.history(client, dm, null, 10)).hasSize(3);

        // trigger kept the conversation preview current
        assertThat(jdbc.queryForObject("SELECT last_message_preview FROM conversations WHERE id = ?", String.class, dm)).isEqualTo("Yes!");
        // response-rate stats emitted for the freelancer (received 1, responded 1)
        String responded = jdbc.queryForObject("""
                SELECT payload->'data'->>'responded' FROM outbox_events
                WHERE event_type = 'messaging.response_stats' AND payload->'data'->>'userId' = ?
                ORDER BY id DESC LIMIT 1""", String.class, freelancer.toString());
        assertThat(responded).isEqualTo("1");

        assertThatThrownBy(() -> messaging.send(outsider, dm, new MessagingService.SendCommand("spam", null)))
                .hasMessageContaining("not a participant");

        UUID projectId = UUID.randomUUID();
        listener.on(new EventEnvelope(UUID.randomUUID(), "project.awarded", Instant.now(), "test", Map.of(
                "projectId", projectId.toString(), "projectTitle", "Payments API",
                "clientId", client.toString(), "freelancerId", freelancer.toString())));
        listener.on(new EventEnvelope(UUID.randomUUID(), "team.member_joined", Instant.now(), "test", Map.of(
                "projectId", projectId.toString(), "memberId", outsider.toString())));
        List<Map<String, Object>> outsiderChats = messaging.list(outsider, 0, 10);
        assertThat(outsiderChats).hasSize(1);
        assertThat(outsiderChats.get(0).get("type")).isEqualTo("PROJECT");
        assertThat((List<?>) outsiderChats.get(0).get("participants")).hasSize(3);
    }
}
