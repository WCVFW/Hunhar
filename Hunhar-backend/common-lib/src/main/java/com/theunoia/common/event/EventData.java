package com.theunoia.common.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Null-safe typed accessors for the loosely typed {@code data} map of an event. */
public final class EventData {

    private final Map<String, Object> data;

    private EventData(Map<String, Object> data) {
        this.data = data == null ? Map.of() : data;
    }

    public static EventData of(EventEnvelope event) {
        return new EventData(event.data());
    }

    public static EventData of(Map<String, Object> data) {
        return new EventData(data);
    }

    public String str(String key) {
        Object v = data.get(key);
        return v == null ? null : v.toString();
    }

    public UUID uuid(String key) {
        String v = str(key);
        return v == null || v.isBlank() ? null : UUID.fromString(v);
    }

    public BigDecimal decimal(String key) {
        String v = str(key);
        return v == null ? null : new BigDecimal(v);
    }

    public Integer integer(String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
    }

    public Long longValue(String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
    }

    public boolean bool(String key) {
        Object v = data.get(key);
        return v instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(v));
    }

    public LocalDate date(String key) {
        String v = str(key);
        return v == null ? null : LocalDate.parse(v);
    }

    public Instant instant(String key) {
        String v = str(key);
        return v == null ? null : Instant.parse(v);
    }

    @SuppressWarnings("unchecked")
    public List<String> strings(String key) {
        Object v = data.get(key);
        if (v instanceof Collection<?> c) {
            return c.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> map(String key) {
        Object v = data.get(key);
        return v instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    public Map<String, Object> raw() {
        return data;
    }
}
