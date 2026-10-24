-- =====================================================================
-- project_db : projects, bidding, workspace (milestones / deliverables),
--              collaboration teams, reviews and disputes
-- =====================================================================

CREATE TABLE categories (
    id          UUID          PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    slug        VARCHAR(120)  NOT NULL UNIQUE,
    parent_id   UUID          REFERENCES categories (id) ON DELETE SET NULL,
    position    INT           NOT NULL DEFAULT 0,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    id              UUID            PRIMARY KEY,
    client_id       UUID            NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    category_id     UUID            REFERENCES categories (id),
    budget_type     VARCHAR(10)     NOT NULL CHECK (budget_type IN ('FIXED', 'HOURLY')),
    budget_min      NUMERIC(14, 2)  NOT NULL CHECK (budget_min > 0),
    budget_max      NUMERIC(14, 2)  NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'INR',
    deadline        DATE,
    status          VARCHAR(20)     NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'DISPUTED', 'COMPLETED', 'CANCELLED')),
    payment_mode    VARCHAR(10)     NOT NULL DEFAULT 'PLATFORM' CHECK (payment_mode IN ('PLATFORM', 'DIRECT')),
    credit_cost     INT             NOT NULL DEFAULT 2 CHECK (credit_cost >= 0),
    bid_count       INT             NOT NULL DEFAULT 0,
    awarded_bid_id  UUID,
    freelancer_id   UUID,
    published_at    TIMESTAMPTZ,
    awarded_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   VARCHAR(500),
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    -- Full-text search document, maintained by PostgreSQL itself.
    search_vector   TSVECTOR GENERATED ALWAYS AS (
                        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(description, '')), 'B')) STORED,
    CONSTRAINT chk_projects_budget CHECK (budget_max >= budget_min)
);
CREATE INDEX idx_projects_search ON projects USING GIN (search_vector);
CREATE INDEX idx_projects_open_feed ON projects (published_at DESC) WHERE status = 'OPEN';
CREATE INDEX idx_projects_client ON projects (client_id, status);
CREATE INDEX idx_projects_freelancer ON projects (freelancer_id, status) WHERE freelancer_id IS NOT NULL;
CREATE INDEX idx_projects_category ON projects (category_id);
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE project_skills (
    project_id  UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    skill       VARCHAR(60)  NOT NULL,
    PRIMARY KEY (project_id, skill)
);
CREATE INDEX idx_project_skills_lower ON project_skills (lower(skill));

CREATE TABLE project_attachments (
    id           UUID           PRIMARY KEY,
    project_id   UUID           NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    file_id      UUID           NOT NULL,
    file_name    VARCHAR(255)   NOT NULL,
    url          VARCHAR(1000)  NOT NULL,
    uploaded_by  UUID           NOT NULL,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_attachments_project ON project_attachments (project_id);

CREATE TABLE bids (
    id              UUID            PRIMARY KEY,
    project_id      UUID            NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    freelancer_id   UUID            NOT NULL,
    amount          NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    delivery_days   INT             NOT NULL CHECK (delivery_days BETWEEN 1 AND 365),
    proposal        TEXT            NOT NULL,
    status          VARCHAR(20)     NOT NULL CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    credits_spent   INT             NOT NULL DEFAULT 0,
    shortlisted_at  TIMESTAMPTZ,
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_bids_project_freelancer UNIQUE (project_id, freelancer_id)
);
CREATE INDEX idx_bids_project_status ON bids (project_id, status);
CREATE INDEX idx_bids_freelancer ON bids (freelancer_id, status, created_at DESC);
CREATE TRIGGER trg_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- PL/pgSQL: keep projects.bid_count (active bids) in sync without application round trips.
CREATE OR REPLACE FUNCTION trg_bids_maintain_count() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET bid_count = bid_count + 1 WHERE id = NEW.project_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'WITHDRAWN' AND NEW.status = 'WITHDRAWN' THEN
        UPDATE projects SET bid_count = GREATEST(bid_count - 1, 0) WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status <> 'WITHDRAWN' THEN
        UPDATE projects SET bid_count = GREATEST(bid_count - 1, 0) WHERE id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_bids_count AFTER INSERT OR UPDATE OF status OR DELETE ON bids
    FOR EACH ROW EXECUTE FUNCTION trg_bids_maintain_count();

CREATE TABLE milestones (
    id            UUID            PRIMARY KEY,
    project_id    UUID            NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title         VARCHAR(200)    NOT NULL,
    description   TEXT,
    amount        NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    due_date      DATE,
    position      INT             NOT NULL DEFAULT 0,
    status        VARCHAR(20)     NOT NULL CHECK (status IN ('PENDING', 'FUNDED', 'SUBMITTED', 'REVISION_REQUESTED',
                                                             'APPROVED', 'PAID', 'REFUNDED', 'CANCELLED')),
    funded_at     TIMESTAMPTZ,
    submitted_at  TIMESTAMPTZ,
    approved_at   TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    version       BIGINT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_milestones_project ON milestones (project_id, position);
CREATE INDEX idx_milestones_due ON milestones (due_date) WHERE status IN ('PENDING', 'FUNDED', 'REVISION_REQUESTED');
CREATE TRIGGER trg_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE deliverables (
    id            UUID          PRIMARY KEY,
    milestone_id  UUID          NOT NULL REFERENCES milestones (id) ON DELETE CASCADE,
    project_id    UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    submitted_by  UUID          NOT NULL,
    note          TEXT,
    attachments   JSONB         NOT NULL DEFAULT '[]'::jsonb,
    status        VARCHAR(20)   NOT NULL CHECK (status IN ('SUBMITTED', 'APPROVED', 'REVISION_REQUESTED')),
    review_note   TEXT,
    reviewed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliverables_milestone ON deliverables (milestone_id, created_at DESC);

CREATE TABLE project_updates (
    id                UUID         PRIMARY KEY,
    project_id        UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    author_id         UUID         NOT NULL,
    message           TEXT         NOT NULL,
    progress_percent  SMALLINT     CHECK (progress_percent BETWEEN 0 AND 100),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_updates_project ON project_updates (project_id, created_at DESC);

-- Collaboration: the awarded freelancer can bring in other freelancers (project-level only in MVP).
CREATE TABLE team_members (
    id            UUID          PRIMARY KEY,
    project_id    UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    owner_id      UUID          NOT NULL,
    member_id     UUID          NOT NULL,
    role          VARCHAR(60)   NOT NULL DEFAULT 'COLLABORATOR',
    status        VARCHAR(20)   NOT NULL CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED')),
    responded_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_team_project_member UNIQUE (project_id, member_id)
);
CREATE INDEX idx_team_members_member ON team_members (member_id, status);

CREATE TABLE reviews (
    id             UUID          PRIMARY KEY,
    project_id     UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    reviewer_id    UUID          NOT NULL,
    reviewee_id    UUID          NOT NULL,
    reviewer_role  VARCHAR(20)   NOT NULL CHECK (reviewer_role IN ('CLIENT', 'FREELANCER')),
    rating         SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_reviews_project_reviewer UNIQUE (project_id, reviewer_id),
    CONSTRAINT chk_reviews_not_self CHECK (reviewer_id <> reviewee_id)
);
CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id, created_at DESC);

CREATE TABLE disputes (
    id                        UUID          PRIMARY KEY,
    project_id                UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    milestone_id              UUID          REFERENCES milestones (id),
    raised_by                 UUID          NOT NULL,
    reason                    VARCHAR(50)   NOT NULL,
    description               TEXT          NOT NULL,
    status                    VARCHAR(20)   NOT NULL CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED')),
    resolution                VARCHAR(30)   CHECK (resolution IN ('REFUND_CLIENT', 'RELEASE_TO_FREELANCER', 'SPLIT', 'NO_ACTION')),
    freelancer_share_percent  SMALLINT      CHECK (freelancer_share_percent BETWEEN 0 AND 100),
    resolution_note           TEXT,
    resolved_by               UUID,
    resolved_at               TIMESTAMPTZ,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now()
);
-- At most one unresolved dispute per project.
CREATE UNIQUE INDEX uq_disputes_one_open_per_project ON disputes (project_id) WHERE status <> 'RESOLVED';
CREATE INDEX idx_disputes_status ON disputes (status, created_at DESC);

-- Seed categories
INSERT INTO categories (id, name, slug, position) VALUES
    (gen_random_uuid(), 'Web Development', 'web-development', 1),
    (gen_random_uuid(), 'Mobile Development', 'mobile-development', 2),
    (gen_random_uuid(), 'Design & Creative', 'design-creative', 3),
    (gen_random_uuid(), 'Digital Marketing', 'digital-marketing', 4),
    (gen_random_uuid(), 'Writing & Translation', 'writing-translation', 5),
    (gen_random_uuid(), 'Data Science & AI', 'data-science-ai', 6),
    (gen_random_uuid(), 'DevOps & Cloud', 'devops-cloud', 7),
    (gen_random_uuid(), 'Finance & Accounting', 'finance-accounting', 8);
