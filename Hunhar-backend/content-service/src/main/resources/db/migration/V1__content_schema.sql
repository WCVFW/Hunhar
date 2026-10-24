-- =====================================================================
-- content_db : public website - dynamic pages, blog, FAQ, SEO metadata,
--              contact inquiries, lead collection
-- =====================================================================

CREATE TABLE pages (
    id                UUID           PRIMARY KEY,
    slug              VARCHAR(150)   NOT NULL UNIQUE,
    title             VARCHAR(200)   NOT NULL,
    type              VARCHAR(10)    NOT NULL CHECK (type IN ('STATIC', 'LANDING')),
    sections          JSONB          NOT NULL DEFAULT '[]'::jsonb,   -- ordered blocks: hero, features, steps, cta, testimonials...
    status            VARCHAR(10)    NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    meta_title        VARCHAR(70),
    meta_description  VARCHAR(170),
    meta_keywords     VARCHAR(300),
    canonical_url     VARCHAR(500),
    og_image_url      VARCHAR(1000),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE blog_categories (
    id           UUID          PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    slug         VARCHAR(120)  NOT NULL UNIQUE,
    description  VARCHAR(500),
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE blog_posts (
    id                UUID           PRIMARY KEY,
    title             VARCHAR(200)   NOT NULL,
    slug              VARCHAR(220)   NOT NULL UNIQUE,
    excerpt           VARCHAR(500),
    content           TEXT           NOT NULL,
    cover_image_url   VARCHAR(1000),
    category_id       UUID           REFERENCES blog_categories (id) ON DELETE SET NULL,
    author_name       VARCHAR(150)   NOT NULL DEFAULT 'THEUNOiA Team',
    status            VARCHAR(10)    NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    published_at      TIMESTAMPTZ,
    view_count        INT            NOT NULL DEFAULT 0,
    reading_minutes   INT            NOT NULL DEFAULT 1,
    meta_title        VARCHAR(70),
    meta_description  VARCHAR(170),
    meta_keywords     VARCHAR(300),
    canonical_url     VARCHAR(500),
    og_image_url      VARCHAR(1000),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    search_vector     TSVECTOR GENERATED ALWAYS AS (
                          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                          setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
                          setweight(to_tsvector('english', coalesce(content, '')), 'C')) STORED
);
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN (search_vector);
CREATE INDEX idx_blog_posts_published ON blog_posts (published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_blog_posts_category ON blog_posts (category_id);

CREATE TABLE blog_post_tags (
    post_id  UUID         NOT NULL REFERENCES blog_posts (id) ON DELETE CASCADE,
    tag      VARCHAR(40)  NOT NULL,
    PRIMARY KEY (post_id, tag)
);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags (tag);

-- PL/pgSQL: derive reading time (~200 words/minute) whenever content changes.
CREATE OR REPLACE FUNCTION trg_blog_reading_time() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.reading_minutes := GREATEST(1, ceil(array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1) / 200.0));
    IF NEW.status = 'PUBLISHED' AND NEW.published_at IS NULL THEN
        NEW.published_at := now();
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_blog_reading_time BEFORE INSERT OR UPDATE OF content, status ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION trg_blog_reading_time();

CREATE TABLE faqs (
    id          UUID           PRIMARY KEY,
    question    VARCHAR(300)   NOT NULL,
    answer      TEXT           NOT NULL,
    category    VARCHAR(30)    NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'FREELANCER', 'CLIENT', 'PAYMENTS', 'CREDITS')),
    position    INT            NOT NULL DEFAULT 0,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE contact_inquiries (
    id          UUID           PRIMARY KEY,
    name        VARCHAR(150)   NOT NULL,
    email       VARCHAR(254)   NOT NULL,
    phone       VARCHAR(15),
    subject     VARCHAR(200)   NOT NULL,
    message     TEXT           NOT NULL,
    status      VARCHAR(15)    NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED')),
    notes       TEXT,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_inquiries_status ON contact_inquiries (status, created_at DESC);

CREATE TABLE leads (
    id            UUID           PRIMARY KEY,
    name          VARCHAR(150),
    email         VARCHAR(254)   NOT NULL,
    phone         VARCHAR(15),
    type          VARCHAR(15)    NOT NULL CHECK (type IN ('FREELANCER', 'CLIENT', 'OTHER')),
    source        VARCHAR(150),            -- landing page slug / form id
    utm_source    VARCHAR(100),
    utm_medium    VARCHAR(100),
    utm_campaign  VARCHAR(100),
    metadata      JSONB          NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_created ON leads (created_at DESC);
CREATE INDEX idx_leads_campaign ON leads (utm_campaign) WHERE utm_campaign IS NOT NULL;

-- ------------------------------------------------------------------ seed: website pages + FAQ
INSERT INTO pages (id, slug, title, type, sections, meta_title, meta_description) VALUES
 (gen_random_uuid(), 'home', 'Home', 'STATIC',
  '[{"type":"hero","heading":"Hire skilled freelancers. Get work done.","subheading":"Post a project, receive bids, collaborate in one workspace.","cta":[{"label":"Hire talent","href":"/register/client"},{"label":"Find work","href":"/register/freelancer"}]},
    {"type":"features","items":["Structured bidding","Secure escrow payments","Built-in workspace & chat","Verified profiles (Aadhaar)"]}]',
  'THEUNOiA - Freelancing & Collaboration Platform', 'Connect businesses with verified freelancers through structured bidding, secure payments and collaboration.'),
 (gen_random_uuid(), 'about-us', 'About Us', 'STATIC', '[{"type":"text","body":"THEUNOiA connects businesses with skilled freelancers."}]',
  'About THEUNOiA', 'Learn about the THEUNOiA mission and team.'),
 (gen_random_uuid(), 'how-it-works', 'How It Works', 'STATIC',
  '[{"type":"steps","items":["Post a project","Receive bids","Award & collaborate","Pay securely through escrow"]}]',
  'How THEUNOiA Works', 'Post projects, compare bids, collaborate and pay securely.'),
 (gen_random_uuid(), 'freelancer-registration', 'Become a Freelancer', 'LANDING', '[{"type":"form","form":"freelancer-registration"}]',
  'Join THEUNOiA as a Freelancer', 'Get starter credits and start bidding on projects.'),
 (gen_random_uuid(), 'client-registration', 'Hire Freelancers', 'LANDING', '[{"type":"form","form":"client-registration"}]',
  'Hire Verified Freelancers on THEUNOiA', 'Post your first project for free.'),
 (gen_random_uuid(), 'community', 'Community', 'STATIC', '[{"type":"text","body":"Discuss, ask questions and network."}]',
  'THEUNOiA Community', 'Freelancer discussions, Q&A and networking.'),
 (gen_random_uuid(), 'contact', 'Contact', 'STATIC', '[{"type":"form","form":"contact"}]', 'Contact THEUNOiA', 'Get in touch with our team.');

INSERT INTO faqs (id, question, answer, category, position) VALUES
 (gen_random_uuid(), 'What are credits?', 'Credits are used to apply (bid) for projects. New freelancers receive starter credits; more can be purchased.', 'CREDITS', 1),
 (gen_random_uuid(), 'How do platform payments work?', 'Clients fund milestones into escrow. When a milestone is approved, funds are released to the freelancer minus the platform commission.', 'PAYMENTS', 2),
 (gen_random_uuid(), 'Why is Aadhaar verification required?', 'Verification via DigiLocker keeps the marketplace safe. We only store the last 4 digits of your Aadhaar.', 'GENERAL', 3),
 (gen_random_uuid(), 'How do I withdraw my earnings?', 'Add a bank account or UPI ID in your wallet and request a withdrawal. Payouts are processed after admin approval.', 'FREELANCER', 4);
