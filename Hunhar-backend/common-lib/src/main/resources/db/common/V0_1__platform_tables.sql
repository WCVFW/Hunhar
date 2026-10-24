-- Platform tables present in every service database.
-- outbox_events  : Transactional Outbox (reliable event publishing)
-- processed_events: idempotent consumption of incoming events


CREATE TABLE IF NOT EXISTS outbox_events (
    id            BIGSERIAL    PRIMARY KEY,
    event_id      UUID         NOT NULL UNIQUE,
    event_type    VARCHAR(100) NOT NULL,
    payload       JSONB        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    published_at  TIMESTAMPTZ,
    attempts      INT          NOT NULL DEFAULT 0
);
-- Partial index: the relay only ever scans unpublished rows.
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON outbox_events (id) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS processed_events (
    event_id      UUID         PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    processed_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- PL/pgSQL trigger function reused by every table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
