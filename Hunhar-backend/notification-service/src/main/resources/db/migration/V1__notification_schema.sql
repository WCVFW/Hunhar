-- =====================================================================
-- notification_db : contacts projection, in-app notifications, delivery
--                   audit (email / WhatsApp), calendar & reminders, campaigns
-- =====================================================================

-- Read model built from user.* events (CQRS projection) so notifications never call auth-service.
CREATE TABLE user_contacts (
    user_id           UUID          PRIMARY KEY,
    email             VARCHAR(254),
    mobile            VARCHAR(15),
    display_name      VARCHAR(150),
    role              VARCHAR(20),
    email_enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
    whatsapp_enabled  BOOLEAN       NOT NULL DEFAULT TRUE,
    marketing_opt_in  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_contacts_marketing ON user_contacts (role) WHERE marketing_opt_in;

CREATE TABLE notifications (
    id          UUID          PRIMARY KEY,
    user_id     UUID          NOT NULL,
    type        VARCHAR(50)   NOT NULL,
    title       VARCHAR(200)  NOT NULL,
    body        VARCHAR(1000),
    data        JSONB         NOT NULL DEFAULT '{}'::jsonb,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE delivery_logs (
    id                   BIGSERIAL     PRIMARY KEY,
    user_id              UUID,
    channel              VARCHAR(10)   NOT NULL CHECK (channel IN ('EMAIL', 'WHATSAPP')),
    template             VARCHAR(80)   NOT NULL,
    recipient            VARCHAR(254)  NOT NULL,
    status               VARCHAR(10)   NOT NULL CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
    error                VARCHAR(500),
    provider_message_id  VARCHAR(150),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_delivery_logs_created ON delivery_logs (created_at DESC);

CREATE TABLE calendar_events (
    id                UUID           PRIMARY KEY,
    owner_id          UUID           NOT NULL,
    title             VARCHAR(200)   NOT NULL,
    description       TEXT,
    type              VARCHAR(20)    NOT NULL CHECK (type IN ('MEETING', 'DEADLINE', 'PAYMENT_REMINDER')),
    start_at          TIMESTAMPTZ    NOT NULL,
    end_at            TIMESTAMPTZ,
    project_id        UUID,
    milestone_id      UUID,
    meeting_link      VARCHAR(1000),
    reminder_at       TIMESTAMPTZ,
    reminder_sent_at  TIMESTAMPTZ,
    google_event_id   VARCHAR(200),
    source_key        VARCHAR(150)   UNIQUE,      -- idempotency for auto-created events
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT chk_calendar_times CHECK (end_at IS NULL OR end_at >= start_at)
);
CREATE INDEX idx_calendar_owner_time ON calendar_events (owner_id, start_at);
-- the reminder scheduler only scans due, unsent reminders
CREATE INDEX idx_calendar_due_reminders ON calendar_events (reminder_at) WHERE reminder_sent_at IS NULL AND reminder_at IS NOT NULL;

CREATE TABLE calendar_attendees (
    event_id  UUID  NOT NULL REFERENCES calendar_events (id) ON DELETE CASCADE,
    user_id   UUID  NOT NULL,
    PRIMARY KEY (event_id, user_id)
);
CREATE INDEX idx_calendar_attendees_user ON calendar_attendees (user_id);

CREATE TABLE google_calendar_connections (
    user_id                  UUID           PRIMARY KEY,
    refresh_token_encrypted  VARCHAR(2000)  NOT NULL,
    google_email             VARCHAR(254),
    connected_at             TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
    id             UUID          PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL,
    template_name  VARCHAR(80)   NOT NULL,
    audience       VARCHAR(20)   NOT NULL CHECK (audience IN ('ALL', 'FREELANCER', 'CLIENT')),
    message        VARCHAR(1000) NOT NULL,
    status         VARCHAR(20)   NOT NULL CHECK (status IN ('SENDING', 'COMPLETED')),
    target_count   INT           NOT NULL DEFAULT 0,
    sent_count     INT           NOT NULL DEFAULT 0,
    created_by     UUID          NOT NULL,
    sent_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
