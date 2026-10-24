package com.theunoia.common.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Wire format of every domain event on the {@code theunoia.events} topic exchange. */
public record EventEnvelope(UUID id, String type, Instant occurredAt, String source, Map<String, Object> data) {
}
