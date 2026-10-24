package com.theunoia.notification;

import com.theunoia.common.event.EventEnvelope;
import com.theunoia.notification.client.UserClient;
import com.theunoia.notification.event.NotificationEventListener;
import com.theunoia.notification.service.Notifier;
import com.theunoia.notification.service.ReminderScheduler;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000",
        "theunoia.notifications.reminder-interval-ms=3600000",
        "theunoia.notifications.email.enabled=false"
})
class NotificationIntegrationTest {

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
    NotificationEventListener listener;
    @Autowired
    ReminderScheduler reminders;
    @Autowired
    Notifier notifier;
    @Autowired
    JdbcTemplate jdbc;
    @MockBean
    UserClient users;

    @Test
    void eventsBecomeNotificationsCalendarEntriesAndReminders() {
        UUID client = UUID.randomUUID();
        UUID freelancer = UUID.randomUUID();
        send("user.registered", Map.of("userId", client.toString(), "role", "CLIENT", "email", "c@x.com",
                "mobile", "9876500001", "displayName", "Acme"));
        send("user.registered", Map.of("userId", freelancer.toString(), "role", "FREELANCER", "email", "f@x.com",
                "mobile", "9876500002", "displayName", "Asha"));

        when(users.matchingFreelancers(anyList())).thenReturn(List.of(freelancer));
        send("project.published", Map.of("projectId", UUID.randomUUID().toString(), "title", "Build API",
                "skills", List.of("Java")));
        assertThat(count("SELECT count(*) FROM notifications WHERE user_id = ? AND type = 'NEW_PROJECT_MATCH'", freelancer)).isEqualTo(1);
        // WhatsApp is disabled in dev -> delivery is audited as SKIPPED
        assertThat(jdbc.queryForObject("SELECT status FROM delivery_logs WHERE template = 'new_project_match'", String.class))
                .isEqualTo("SKIPPED");

        String projectId = UUID.randomUUID().toString();
        EventEnvelope awarded = new EventEnvelope(UUID.randomUUID(), "project.awarded", Instant.now(), "test", Map.of(
                "projectId", projectId, "projectTitle", "Build API", "clientId", client.toString(),
                "freelancerId", freelancer.toString(), "deadline", LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")).toString()));
        listener.on(awarded);
        listener.on(awarded); // duplicate delivery -> no duplicate calendar entries
        assertThat(count("SELECT count(*) FROM calendar_events WHERE project_id = ?::uuid", projectId)).isEqualTo(2);

        reminders.sendDueReminders();
        assertThat(count("SELECT count(*) FROM calendar_events WHERE project_id = ?::uuid AND reminder_sent_at IS NOT NULL", projectId))
                .isEqualTo(2);
        assertThat(count("SELECT count(*) FROM notifications WHERE type = 'REMINDER_DEADLINE' AND user_id = ?", client)).isEqualTo(1);

        assertThat(notifier.unread(freelancer)).isEqualTo(4); // welcome, project match, project awarded, deadline reminder
    }

    private void send(String type, Map<String, Object> data) {
        listener.on(new EventEnvelope(UUID.randomUUID(), type, Instant.now(), "test", data));
    }

    private int count(String sql, Object arg) {
        return jdbc.queryForObject(sql, Integer.class, arg);
    }
}
