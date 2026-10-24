-- =====================================================================
-- auth_db : identities, credentials, sessions, verification & KYC
-- =====================================================================

CREATE TABLE users (
    id                     UUID          PRIMARY KEY,
    email                  VARCHAR(254)  NOT NULL,
    mobile                 VARCHAR(15)   NOT NULL,
    password_hash          VARCHAR(100)  NOT NULL,
    role                   VARCHAR(20)   NOT NULL CHECK (role IN ('FREELANCER', 'CLIENT', 'ADMIN')),
    status                 VARCHAR(30)   NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED')),
    display_name           VARCHAR(150)  NOT NULL,
    email_verified         BOOLEAN       NOT NULL DEFAULT FALSE,
    aadhaar_verified       BOOLEAN       NOT NULL DEFAULT FALSE,
    failed_login_attempts  INT           NOT NULL DEFAULT 0,
    locked_until           TIMESTAMPTZ,
    last_login_at          TIMESTAMPTZ,
    approved_at            TIMESTAMPTZ,
    approved_by            UUID,
    status_reason          VARCHAR(500),
    version                BIGINT        NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX uq_users_email ON users (email);
CREATE UNIQUE INDEX uq_users_mobile ON users (mobile);
CREATE INDEX idx_users_role_status ON users (role, status, created_at DESC);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opaque refresh tokens (only SHA-256 hash stored). family_id groups a rotation chain so a
-- replayed (already rotated) token revokes the whole family -> stolen-token detection.
CREATE TABLE refresh_tokens (
    id           UUID         PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id    UUID         NOT NULL,
    token_hash   CHAR(64)     NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked_at   TIMESTAMPTZ,
    replaced_by  UUID,
    user_agent   VARCHAR(300),
    ip_address   VARCHAR(45),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_active ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);

CREATE TABLE verification_tokens (
    id          UUID         PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose     VARCHAR(30)  NOT NULL CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
    token_hash  CHAR(64)     NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_verification_tokens_user ON verification_tokens (user_id, purpose);

-- Aadhaar KYC via DigiLocker. Per the Aadhaar Act we NEVER store the full Aadhaar number:
-- only the last 4 digits and the name as returned by DigiLocker.
CREATE TABLE kyc_verifications (
    id                  UUID          PRIMARY KEY,
    user_id             UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider            VARCHAR(30)   NOT NULL,
    provider_reference  VARCHAR(100)  NOT NULL UNIQUE,
    status              VARCHAR(20)   NOT NULL CHECK (status IN ('INITIATED', 'VERIFIED', 'FAILED', 'EXPIRED', 'MANUAL')),
    redirect_url        VARCHAR(1000),
    aadhaar_last4       CHAR(4),
    name_on_document    VARCHAR(200),
    failure_reason      VARCHAR(500),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_kyc_user ON kyc_verifications (user_id, created_at DESC);
CREATE TRIGGER trg_kyc_updated_at BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE admin_audit_logs (
    id              BIGSERIAL     PRIMARY KEY,
    admin_id        UUID          NOT NULL,
    action          VARCHAR(50)   NOT NULL,
    target_user_id  UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason          VARCHAR(500),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_target ON admin_audit_logs (target_user_id, created_at DESC);

-- PL/pgSQL: housekeeping function invoked by the service's nightly job.
CREATE OR REPLACE FUNCTION purge_expired_auth_tokens() RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    removed INTEGER;
    removed_verification INTEGER;
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < now() - INTERVAL '7 days';
    GET DIAGNOSTICS removed = ROW_COUNT;
    DELETE FROM verification_tokens WHERE expires_at < now() - INTERVAL '7 days';
    GET DIAGNOSTICS removed_verification = ROW_COUNT;
    RETURN removed + removed_verification;
END;
$$;
