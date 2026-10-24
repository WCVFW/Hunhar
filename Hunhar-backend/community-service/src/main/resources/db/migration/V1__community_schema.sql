-- =====================================================================
-- community_db : forum (discussions, Q&A, industry topics), votes,
--                moderation reports, freelancer networking (follows)
-- =====================================================================

CREATE TABLE forum_categories (
    id           UUID          PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    slug         VARCHAR(120)  NOT NULL UNIQUE,
    description  VARCHAR(500),
    position     INT           NOT NULL DEFAULT 0,
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE threads (
    id                 UUID          PRIMARY KEY,
    category_id        UUID          NOT NULL REFERENCES forum_categories (id),
    author_id          UUID          NOT NULL,
    type               VARCHAR(20)   NOT NULL CHECK (type IN ('DISCUSSION', 'QUESTION')),
    title              VARCHAR(200)  NOT NULL,
    body               TEXT          NOT NULL,
    status             VARCHAR(10)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'HIDDEN')),
    pinned             BOOLEAN       NOT NULL DEFAULT FALSE,
    view_count         INT           NOT NULL DEFAULT 0,
    reply_count        INT           NOT NULL DEFAULT 0,
    vote_score         INT           NOT NULL DEFAULT 0,
    accepted_reply_id  UUID,
    last_activity_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    search_vector      TSVECTOR GENERATED ALWAYS AS (
                           setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                           setweight(to_tsvector('english', coalesce(body, '')), 'B')) STORED
);
CREATE INDEX idx_threads_search ON threads USING GIN (search_vector);
CREATE INDEX idx_threads_feed ON threads (category_id, pinned DESC, last_activity_at DESC) WHERE status <> 'HIDDEN';
CREATE INDEX idx_threads_author ON threads (author_id);

CREATE TABLE thread_tags (
    thread_id  UUID         NOT NULL REFERENCES threads (id) ON DELETE CASCADE,
    tag        VARCHAR(40)  NOT NULL,
    PRIMARY KEY (thread_id, tag)
);
CREATE INDEX idx_thread_tags_tag ON thread_tags (lower(tag));

CREATE TABLE replies (
    id          UUID          PRIMARY KEY,
    thread_id   UUID          NOT NULL REFERENCES threads (id) ON DELETE CASCADE,
    author_id   UUID          NOT NULL,
    body        TEXT          NOT NULL,
    vote_score  INT           NOT NULL DEFAULT 0,
    status      VARCHAR(10)   NOT NULL DEFAULT 'VISIBLE' CHECK (status IN ('VISIBLE', 'HIDDEN')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_replies_thread ON replies (thread_id, created_at);

CREATE TABLE votes (
    user_id      UUID         NOT NULL,
    target_type  VARCHAR(10)  NOT NULL CHECK (target_type IN ('THREAD', 'REPLY')),
    target_id    UUID         NOT NULL,
    value        SMALLINT     NOT NULL CHECK (value IN (-1, 1)),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE content_reports (
    id           UUID          PRIMARY KEY,
    reporter_id  UUID          NOT NULL,
    target_type  VARCHAR(10)   NOT NULL CHECK (target_type IN ('THREAD', 'REPLY', 'USER')),
    target_id    UUID          NOT NULL,
    reason       VARCHAR(30)   NOT NULL CHECK (reason IN ('SPAM', 'ABUSE', 'HARASSMENT', 'SCAM', 'OFF_TOPIC', 'OTHER')),
    details      VARCHAR(1000),
    status       VARCHAR(10)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACTIONED', 'DISMISSED')),
    reviewed_by  UUID,
    reviewed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_report_once UNIQUE (reporter_id, target_type, target_id)
);
CREATE INDEX idx_reports_open ON content_reports (created_at) WHERE status = 'OPEN';

CREATE TABLE user_follows (
    follower_id  UUID         NOT NULL,
    followee_id  UUID         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_id <> followee_id)
);
CREATE INDEX idx_follows_followee ON user_follows (followee_id);

-- ---------------------------------------------------------------------
-- PL/pgSQL counters: denormalised vote scores and reply counts stay exact
-- regardless of which code path (or concurrent request) changed the data.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_votes_apply() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_delta INT;
    v_type  VARCHAR;
    v_id    UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_delta := NEW.value; v_type := NEW.target_type; v_id := NEW.target_id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_delta := NEW.value - OLD.value; v_type := NEW.target_type; v_id := NEW.target_id;
    ELSE
        v_delta := -OLD.value; v_type := OLD.target_type; v_id := OLD.target_id;
    END IF;
    IF v_type = 'THREAD' THEN
        UPDATE threads SET vote_score = vote_score + v_delta WHERE id = v_id;
    ELSE
        UPDATE replies SET vote_score = vote_score + v_delta WHERE id = v_id;
    END IF;
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_votes_apply AFTER INSERT OR UPDATE OR DELETE ON votes FOR EACH ROW EXECUTE FUNCTION trg_votes_apply();

CREATE OR REPLACE FUNCTION trg_replies_counter() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads SET reply_count = reply_count + 1, last_activity_at = now() WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
        UPDATE threads SET reply_count = reply_count + CASE WHEN NEW.status = 'HIDDEN' THEN -1 ELSE 1 END
         WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'VISIBLE' THEN
        UPDATE threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_replies_counter AFTER INSERT OR UPDATE OF status OR DELETE ON replies
    FOR EACH ROW EXECUTE FUNCTION trg_replies_counter();

INSERT INTO forum_categories (id, name, slug, description, position) VALUES
    (gen_random_uuid(), 'General Discussions', 'general', 'Talk about anything freelancing', 1),
    (gen_random_uuid(), 'Questions & Answers', 'questions', 'Ask the community for help', 2),
    (gen_random_uuid(), 'Industry Topics', 'industry', 'Trends, tools and market insights', 3),
    (gen_random_uuid(), 'Freelancer Networking', 'networking', 'Find collaborators and partners', 4),
    (gen_random_uuid(), 'Knowledge Sharing', 'knowledge', 'Tutorials, guides and best practices', 5);
