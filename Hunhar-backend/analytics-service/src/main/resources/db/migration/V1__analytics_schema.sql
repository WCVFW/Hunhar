-- =====================================================================
-- analytics_db : event-sourced platform metrics (star-schema style)
-- =====================================================================

-- Fact table: one row per (day, metric, dimension). Upserted from domain events.
CREATE TABLE daily_metrics (
    metric_date  DATE            NOT NULL,
    metric       VARCHAR(60)     NOT NULL,
    dimension    VARCHAR(60)     NOT NULL DEFAULT '',
    value        NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ     NOT NULL DEFAULT now(),
    PRIMARY KEY (metric_date, metric, dimension)
);
CREATE INDEX idx_daily_metrics_metric ON daily_metrics (metric, metric_date);

-- Active-user tracking (DAU / WAU / MAU)
CREATE TABLE user_activity (
    user_id           UUID         PRIMARY KEY,
    role              VARCHAR(20),
    first_seen        DATE         NOT NULL DEFAULT CURRENT_DATE,
    last_active_date  DATE         NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX idx_user_activity_last_active ON user_activity (last_active_date);

-- PL/pgSQL upsert used by every event handler (atomic increments, no read-modify-write).
CREATE OR REPLACE FUNCTION record_metric(p_date DATE, p_metric VARCHAR, p_dimension VARCHAR, p_value NUMERIC)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO daily_metrics (metric_date, metric, dimension, value)
    VALUES (p_date, p_metric, COALESCE(p_dimension, ''), p_value)
    ON CONFLICT (metric_date, metric, dimension)
    DO UPDATE SET value = daily_metrics.value + EXCLUDED.value, updated_at = now();
END;
$$;

-- Monthly roll-up for growth charts; refreshed concurrently by the service every night.
CREATE MATERIALIZED VIEW monthly_metrics AS
SELECT date_trunc('month', metric_date)::date AS month, metric, dimension, sum(value) AS value
FROM daily_metrics
GROUP BY 1, 2, 3;
CREATE UNIQUE INDEX uq_monthly_metrics ON monthly_metrics (month, metric, dimension);
