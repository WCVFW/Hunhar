package com.theunoia.common.event;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Exactly-once processing on top of at-least-once delivery: the consumer records the event
 * id in the same transaction as its side effects. A redelivered event finds the row and is skipped.
 */
@Component
@RequiredArgsConstructor
public class IdempotencyGuard {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(propagation = Propagation.MANDATORY)
    public boolean firstDelivery(EventEnvelope event) {
        int inserted = jdbcTemplate.update(
                "INSERT INTO processed_events (event_id, event_type) VALUES (?, ?) ON CONFLICT (event_id) DO NOTHING",
                event.id(), event.type());
        return inserted == 1;
    }
}
