package com.theunoia.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MetricsRepository {

    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final JdbcTemplate jdbc;

    public void record(String metric, String dimension, BigDecimal value) {
        if (value == null) return;
        jdbc.queryForList("SELECT record_metric(?, ?, ?, ?)", LocalDate.now(IST), metric, dimension == null ? "" : dimension, value);
    }

    public void increment(String metric, String dimension) {
        record(metric, dimension, BigDecimal.ONE);
    }

    public void touchUser(UUID userId, String role) {
        jdbc.update("""
                INSERT INTO user_activity (user_id, role, first_seen, last_active_date) VALUES (?, ?, ?, ?)
                ON CONFLICT (user_id) DO UPDATE SET last_active_date = EXCLUDED.last_active_date,
                                                    role = COALESCE(EXCLUDED.role, user_activity.role)""",
                userId, role, LocalDate.now(IST), LocalDate.now(IST));
    }

    public BigDecimal total(String metric) {
        return jdbc.queryForObject("SELECT COALESCE(sum(value), 0) FROM daily_metrics WHERE metric = ?", BigDecimal.class, metric);
    }

    public BigDecimal totalSince(String metric, int days) {
        return jdbc.queryForObject("SELECT COALESCE(sum(value), 0) FROM daily_metrics WHERE metric = ? AND metric_date > ?",
                BigDecimal.class, metric, LocalDate.now(IST).minusDays(days));
    }

    public long activeUsers(int days) {
        Long n = jdbc.queryForObject("SELECT count(*) FROM user_activity WHERE last_active_date > ?", Long.class,
                LocalDate.now(IST).minusDays(days));
        return n == null ? 0 : n;
    }

    public List<Map<String, Object>> totalsByDimension(String metric) {
        return jdbc.queryForList("SELECT dimension, sum(value) AS value FROM daily_metrics WHERE metric = ? GROUP BY dimension ORDER BY 2 DESC", metric);
    }

    /** Zero-filled daily series (generate_series) for charts. */
    public List<Map<String, Object>> series(String metric, int days) {
        return jdbc.queryForList("""
                SELECT d::date AS date, COALESCE(sum(m.value), 0) AS value
                FROM generate_series(?::date, ?::date, interval '1 day') d
                LEFT JOIN daily_metrics m ON m.metric_date = d::date AND m.metric = ?
                GROUP BY d ORDER BY d""", LocalDate.now(IST).minusDays(days - 1L), LocalDate.now(IST), metric);
    }

    public List<Map<String, Object>> monthly(String metric, int months) {
        return jdbc.queryForList("""
                SELECT month, sum(value) AS value FROM monthly_metrics
                WHERE metric = ? AND month >= date_trunc('month', now()) - make_interval(months => ?)
                GROUP BY month ORDER BY month""", metric, months);
    }

    public List<String> metricNames() {
        return jdbc.queryForList("SELECT DISTINCT metric FROM daily_metrics ORDER BY 1", String.class);
    }

    public void refreshMonthly() {
        jdbc.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_metrics");
    }
}
