-- =====================================================================
-- file_db : metadata of objects stored in S3-compatible storage (MinIO / AWS S3)
-- Binary content never lives in PostgreSQL.
-- =====================================================================

CREATE TABLE stored_files (
    id               UUID           PRIMARY KEY,
    owner_id         UUID           NOT NULL,
    purpose          VARCHAR(30)    NOT NULL CHECK (purpose IN ('AVATAR', 'PORTFOLIO', 'PROJECT_ATTACHMENT', 'DELIVERABLE',
                                                                'MESSAGE_ATTACHMENT', 'BLOG_IMAGE', 'KYC_DOCUMENT', 'OTHER')),
    bucket           VARCHAR(100)   NOT NULL,
    object_key       VARCHAR(500)   NOT NULL UNIQUE,
    original_name    VARCHAR(255)   NOT NULL,
    content_type     VARCHAR(150)   NOT NULL,
    size_bytes       BIGINT         NOT NULL CHECK (size_bytes > 0),
    checksum_sha256  CHAR(64)       NOT NULL,
    visibility       VARCHAR(10)    NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_stored_files_owner ON stored_files (owner_id, created_at DESC) WHERE deleted_at IS NULL;

-- PL/pgSQL helper for per-user storage quota checks.
CREATE OR REPLACE FUNCTION user_storage_bytes(p_owner UUID) RETURNS BIGINT
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COALESCE(sum(size_bytes), 0) INTO v_total FROM stored_files WHERE owner_id = p_owner AND deleted_at IS NULL;
    RETURN v_total;
END;
$$;
