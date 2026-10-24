-- =====================================================================
-- user_db : public profiles (freelancer & client), portfolio, ranking
-- user_id values are owned by auth-service (no cross-database FKs).
-- =====================================================================

CREATE TABLE freelancer_profiles (
    user_id              UUID          PRIMARY KEY,
    full_name            VARCHAR(150)  NOT NULL,
    headline             VARCHAR(200),
    bio                  TEXT,
    hourly_rate          NUMERIC(12, 2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    location             VARCHAR(120),
    avatar_url           VARCHAR(1000),
    experience_years     SMALLINT      CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 60),
    availability         VARCHAR(20)   NOT NULL DEFAULT 'FULL_TIME' CHECK (availability IN ('FULL_TIME', 'PART_TIME', 'NOT_AVAILABLE')),
    verification_status  VARCHAR(30)   NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_freelancer_profiles_updated_at BEFORE UPDATE ON freelancer_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE freelancer_skills (
    user_id  UUID         NOT NULL REFERENCES freelancer_profiles (user_id) ON DELETE CASCADE,
    skill    VARCHAR(60)  NOT NULL,
    PRIMARY KEY (user_id, skill)
);
-- case-insensitive skill matching for "new project matches" notifications and search
CREATE INDEX idx_freelancer_skills_lower ON freelancer_skills (lower(skill));

CREATE TABLE portfolio_items (
    id           UUID           PRIMARY KEY,
    user_id      UUID           NOT NULL REFERENCES freelancer_profiles (user_id) ON DELETE CASCADE,
    title        VARCHAR(200)   NOT NULL,
    url          VARCHAR(1000),
    description  TEXT,
    image_url    VARCHAR(1000),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_portfolio_user ON portfolio_items (user_id);

CREATE TABLE experiences (
    id                 UUID          PRIMARY KEY,
    user_id            UUID          NOT NULL REFERENCES freelancer_profiles (user_id) ON DELETE CASCADE,
    company            VARCHAR(200)  NOT NULL,
    title              VARCHAR(200)  NOT NULL,
    start_date         DATE          NOT NULL,
    end_date           DATE,
    currently_working  BOOLEAN       NOT NULL DEFAULT FALSE,
    description        TEXT,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_experience_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_experiences_user ON experiences (user_id);

CREATE TABLE certifications (
    id              UUID          PRIMARY KEY,
    user_id         UUID          NOT NULL REFERENCES freelancer_profiles (user_id) ON DELETE CASCADE,
    name            VARCHAR(200)  NOT NULL,
    issuer          VARCHAR(200)  NOT NULL,
    issued_on       DATE,
    expires_on      DATE,
    credential_url  VARCHAR(1000),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_certifications_user ON certifications (user_id);

CREATE TABLE client_profiles (
    user_id              UUID          PRIMARY KEY,
    company_name         VARCHAR(200)  NOT NULL,
    contact_person       VARCHAR(150)  NOT NULL,
    website              VARCHAR(500),
    industry             VARCHAR(100),
    company_size         VARCHAR(20)   CHECK (company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
    about                TEXT,
    logo_url             VARCHAR(1000),
    gstin                VARCHAR(15)   CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    location             VARCHAR(120),
    verification_status  VARCHAR(30)   NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Ranking system. Raw counters are maintained from domain events; derived
-- ratios are GENERATED columns and the leaderboard score is computed by a
-- PL/pgSQL trigger so it is always consistent with the counters.
-- ---------------------------------------------------------------------
CREATE TABLE freelancer_stats (
    user_id                  UUID           PRIMARY KEY REFERENCES freelancer_profiles (user_id) ON DELETE CASCADE,
    completed_projects       INT            NOT NULL DEFAULT 0 CHECK (completed_projects >= 0),
    cancelled_projects       INT            NOT NULL DEFAULT 0 CHECK (cancelled_projects >= 0),
    total_reviews            INT            NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
    rating_sum               INT            NOT NULL DEFAULT 0 CHECK (rating_sum >= 0),
    revenue                  NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
    conversations_received   INT            NOT NULL DEFAULT 0,
    conversations_responded  INT            NOT NULL DEFAULT 0,
    avg_rating    NUMERIC(3, 2) GENERATED ALWAYS AS
                  (CASE WHEN total_reviews = 0 THEN 0 ELSE round(rating_sum::numeric / total_reviews, 2) END) STORED,
    success_rate  NUMERIC(5, 2) GENERATED ALWAYS AS
                  (CASE WHEN completed_projects + cancelled_projects = 0 THEN 0
                        ELSE round(100.0 * completed_projects / (completed_projects + cancelled_projects), 2) END) STORED,
    response_rate NUMERIC(5, 2) GENERATED ALWAYS AS
                  (CASE WHEN conversations_received = 0 THEN 0
                        ELSE round(100.0 * conversations_responded / conversations_received, 2) END) STORED,
    score                    NUMERIC(6, 2)  NOT NULL DEFAULT 0,
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_freelancer_stats_score ON freelancer_stats (score DESC);

/*
 * Leaderboard score (0..100):
 *   30 x Bayesian rating     ((sum + 5*3.5) / (n + 5)) / 5   -- few reviews pull toward 3.5 stars
 *   25 x completed projects  min(completed / 50, 1)
 *   20 x revenue (log scale) min(ln(1 + revenue) / ln(1 + 10,00,000), 1)
 *   15 x success rate        completed / (completed + cancelled)
 *   10 x response rate       responded / received
 */
CREATE OR REPLACE FUNCTION compute_freelancer_score(
    p_completed INT, p_cancelled INT, p_reviews INT, p_rating_sum INT,
    p_revenue NUMERIC, p_received INT, p_responded INT
) RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_rating   NUMERIC;
    v_volume   NUMERIC;
    v_revenue  NUMERIC;
    v_success  NUMERIC := 0;
    v_response NUMERIC := 0;
BEGIN
    v_rating  := ((p_rating_sum + 5 * 3.5) / (p_reviews + 5)) / 5.0;
    v_volume  := LEAST(p_completed / 50.0, 1);
    v_revenue := LEAST(ln(1 + GREATEST(p_revenue, 0)) / ln(1 + 1000000), 1);
    IF p_completed + p_cancelled > 0 THEN
        v_success := p_completed::NUMERIC / (p_completed + p_cancelled);
    END IF;
    IF p_received > 0 THEN
        v_response := LEAST(p_responded::NUMERIC / p_received, 1);
    END IF;
    -- No track record yet: rating prior must not dominate the board.
    IF p_completed = 0 AND p_reviews = 0 THEN
        v_rating := 0;
    END IF;
    RETURN round(30 * v_rating + 25 * v_volume + 20 * v_revenue + 15 * v_success + 10 * v_response, 2);
END;
$$;

CREATE OR REPLACE FUNCTION trg_freelancer_stats_score() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.score := compute_freelancer_score(NEW.completed_projects, NEW.cancelled_projects, NEW.total_reviews,
                                          NEW.rating_sum, NEW.revenue, NEW.conversations_received,
                                          NEW.conversations_responded);
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_freelancer_stats_score
    BEFORE INSERT OR UPDATE ON freelancer_stats
    FOR EACH ROW EXECUTE FUNCTION trg_freelancer_stats_score();
