package com.theunoia.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Publishes committed outbox rows to RabbitMQ with publisher confirms. Rows are claimed
 * with {@code FOR UPDATE SKIP LOCKED}, so any number of replicas can run the relay without
 * double publishing; consumers are idempotent anyway (at-least-once delivery).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxRelay {

    private final JdbcTemplate jdbcTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final TransactionTemplate transactionTemplate;

    @Scheduled(fixedDelayString = "${theunoia.events.relay-interval-ms:1000}", initialDelay = 5000)
    public void relay() {
        try {
            Integer published;
            do {
                published = transactionTemplate.execute(status -> publishBatch());
            } while (published != null && published == 100);
        } catch (Exception e) {
            log.warn("Outbox relay failed, will retry: {}", e.getMessage());
        }
    }

    private int publishBatch() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT id, event_id, event_type, payload::text AS payload
                FROM outbox_events
                WHERE published_at IS NULL
                ORDER BY id
                LIMIT 100
                FOR UPDATE SKIP LOCKED""");
        if (rows.isEmpty()) {
            return 0;
        }
        rabbitTemplate.invoke(ops -> {
            for (Map<String, Object> row : rows) {
                Message message = MessageBuilder.withBody(((String) row.get("payload")).getBytes(StandardCharsets.UTF_8))
                        .setContentType("application/json")
                        .setContentEncoding("UTF-8")
                        .setMessageId(row.get("event_id").toString())
                        .setType((String) row.get("event_type"))
                        .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                        .build();
                ops.send(EventConfig.EXCHANGE, (String) row.get("event_type"), message);
            }
            ops.waitForConfirmsOrDie(10_000);
            return null;
        });
        List<Object[]> ids = rows.stream().map(r -> new Object[]{r.get("id")}).toList();
        jdbcTemplate.batchUpdate("UPDATE outbox_events SET published_at = now(), attempts = attempts + 1 WHERE id = ?", ids);
        return rows.size();
    }

    /** Keep a week of published events for audit/replay. */
    @Scheduled(cron = "0 15 3 * * *")
    public void purgeOld() {
        int deleted = jdbcTemplate.update("DELETE FROM outbox_events WHERE published_at < now() - interval '7 days'");
        jdbcTemplate.update("DELETE FROM processed_events WHERE processed_at < now() - interval '30 days'");
        log.info("Purged {} published outbox events", deleted);
    }
}
