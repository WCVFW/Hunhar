-- =====================================================================
-- messaging_db : one-to-one and project-based conversations
-- =====================================================================

CREATE TABLE conversations (
    id                    UUID          PRIMARY KEY,
    type                  VARCHAR(10)   NOT NULL CHECK (type IN ('DIRECT', 'PROJECT')),
    project_id            UUID          UNIQUE,
    direct_key            VARCHAR(80)   UNIQUE,     -- "<smallerUuid>:<largerUuid>" guarantees one DM thread per pair
    title                 VARCHAR(200),
    last_message_at       TIMESTAMPTZ,
    last_message_preview  VARCHAR(200),
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_conversation_kind CHECK (
        (type = 'DIRECT' AND direct_key IS NOT NULL AND project_id IS NULL) OR
        (type = 'PROJECT' AND project_id IS NOT NULL))
);

CREATE TABLE conversation_participants (
    id                 UUID          PRIMARY KEY,
    conversation_id    UUID          NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    user_id            UUID          NOT NULL,
    role               VARCHAR(20)   NOT NULL DEFAULT 'MEMBER',
    last_read_at       TIMESTAMPTZ,
    first_received_at  TIMESTAMPTZ,   -- response-rate tracking (ranking system)
    first_replied_at   TIMESTAMPTZ,
    left_at            TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_participant UNIQUE (conversation_id, user_id)
);
CREATE INDEX idx_participants_user ON conversation_participants (user_id) WHERE left_at IS NULL;

CREATE TABLE messages (
    id               UUID          PRIMARY KEY,
    conversation_id  UUID          NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id        UUID          NOT NULL,
    body             TEXT,
    attachments      JSONB         NOT NULL DEFAULT '[]'::jsonb,
    edited_at        TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_message_content CHECK (body IS NOT NULL OR jsonb_array_length(attachments) > 0)
);
-- keyset pagination: newest first within a conversation
CREATE INDEX idx_messages_conversation_time ON messages (conversation_id, created_at DESC, id DESC);

-- PL/pgSQL: keep the conversation list ordering/preview current on every new message.
CREATE OR REPLACE FUNCTION trg_messages_touch_conversation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE conversations
       SET last_message_at = NEW.created_at,
           last_message_preview = CASE WHEN NEW.body IS NULL THEN '[attachment]' ELSE left(NEW.body, 200) END,
           updated_at = now()
     WHERE id = NEW.conversation_id;
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_messages_touch AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION trg_messages_touch_conversation();
