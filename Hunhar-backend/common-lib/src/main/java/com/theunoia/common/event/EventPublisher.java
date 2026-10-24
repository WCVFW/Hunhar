package com.theunoia.common.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Transactional Outbox writer. Call inside the business transaction: the event row commits
 * (or rolls back) together with the state change, and {@link OutboxRelay} ships it later.
 */
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.application.name}")
    private String source;

    @Transactional(propagation = Propagation.MANDATORY)
    public UUID publish(String type, Map<String, Object> data) {
        UUID id = UUID.randomUUID();
        EventEnvelope envelope = new EventEnvelope(id, type, Instant.now(), source, data);
        try {
            jdbcTemplate.update(
                    "INSERT INTO outbox_events (event_id, event_type, payload) VALUES (?, ?, CAST(? AS jsonb))",
                    id, type, objectMapper.writeValueAsString(envelope));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize event " + type, e);
        }
        return id;
    }
}
