-- =====================================================================
-- payment_db : orders, escrow, wallets, double-entry style ledger,
--              commission, payouts (withdrawals), refunds, invoices
-- All money is NUMERIC(14,2) in INR - never floating point.
-- =====================================================================

CREATE TABLE wallets (
    user_id            UUID            PRIMARY KEY,
    available_balance  NUMERIC(14, 2)  NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
    total_earned       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    total_withdrawn    NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    version            BIGINT          NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE payment_orders (
    id                   UUID            PRIMARY KEY,
    user_id              UUID            NOT NULL,
    purpose              VARCHAR(30)     NOT NULL CHECK (purpose IN ('PROJECT_PAYMENT', 'CREDIT_PURCHASE')),
    reference_id         UUID            NOT NULL,
    project_id           UUID,
    payee_id             UUID,
    amount               NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    currency             CHAR(3)         NOT NULL DEFAULT 'INR',
    provider             VARCHAR(20)     NOT NULL,
    provider_order_id    VARCHAR(100)    UNIQUE,
    provider_payment_id  VARCHAR(100),
    status               VARCHAR(25)     NOT NULL CHECK (status IN ('CREATED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    description          VARCHAR(300),
    failure_reason       VARCHAR(500),
    captured_at          TIMESTAMPTZ,
    version              BIGINT          NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_orders_user ON payment_orders (user_id, created_at DESC);
CREATE INDEX idx_payment_orders_status ON payment_orders (status, created_at DESC);
-- A milestone can be funded (captured) only once.
CREATE UNIQUE INDEX uq_payment_orders_milestone_captured ON payment_orders (reference_id)
    WHERE purpose = 'PROJECT_PAYMENT' AND status IN ('CAPTURED', 'PARTIALLY_REFUNDED');

CREATE TABLE escrow_holdings (
    id                UUID            PRIMARY KEY,
    payment_order_id  UUID            NOT NULL UNIQUE REFERENCES payment_orders (id),
    project_id        UUID            NOT NULL,
    milestone_id      UUID            NOT NULL UNIQUE,
    client_id         UUID            NOT NULL,
    freelancer_id     UUID            NOT NULL,
    amount            NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    released_amount   NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    refunded_amount   NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    status            VARCHAR(20)     NOT NULL CHECK (status IN ('HELD', 'RELEASED', 'REFUNDED', 'SPLIT')),
    settled_at        TIMESTAMPTZ,
    version           BIGINT          NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT chk_escrow_settlement CHECK (released_amount + refunded_amount <= amount)
);
CREATE INDEX idx_escrow_freelancer ON escrow_holdings (freelancer_id, status);
CREATE INDEX idx_escrow_client ON escrow_holdings (client_id, status);

CREATE TABLE commissions (
    id                 UUID            PRIMARY KEY,
    escrow_id          UUID            NOT NULL REFERENCES escrow_holdings (id),
    project_id         UUID            NOT NULL,
    freelancer_id      UUID            NOT NULL,
    gross_amount       NUMERIC(14, 2)  NOT NULL,
    rate               NUMERIC(5, 4)   NOT NULL,
    commission_amount  NUMERIC(14, 2)  NOT NULL,
    gst_amount         NUMERIC(14, 2)  NOT NULL,
    net_amount         NUMERIC(14, 2)  NOT NULL,
    created_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_created ON commissions (created_at);

-- Append-only money movement journal. account identifies whose "bucket" moved.
CREATE TABLE ledger_entries (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         UUID,
    account         VARCHAR(20)     NOT NULL CHECK (account IN ('WALLET', 'ESCROW', 'PLATFORM_REVENUE', 'TAX_PAYABLE', 'PAYOUT_PENDING', 'EXTERNAL')),
    entry_type      VARCHAR(40)     NOT NULL,
    direction       VARCHAR(6)      NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    amount          NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    balance_after   NUMERIC(14, 2),
    reference_type  VARCHAR(30)     NOT NULL,
    reference_id    UUID            NOT NULL,
    description     VARCHAR(300),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_user ON ledger_entries (user_id, created_at DESC);
CREATE INDEX idx_ledger_reference ON ledger_entries (reference_type, reference_id);

CREATE OR REPLACE FUNCTION trg_ledger_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only' USING ERRCODE = '42501';
END;
$$;
CREATE TRIGGER trg_ledger_no_update BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION trg_ledger_immutable();

CREATE TABLE payout_accounts (
    id                        UUID          PRIMARY KEY,
    user_id                   UUID          NOT NULL,
    type                      VARCHAR(10)   NOT NULL CHECK (type IN ('BANK', 'UPI')),
    account_holder_name       VARCHAR(150)  NOT NULL,
    account_number_encrypted  VARCHAR(500),
    account_last4             CHAR(4),
    ifsc                      VARCHAR(11)   CHECK (ifsc IS NULL OR ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    upi_id                    VARCHAR(100),
    provider_contact_id       VARCHAR(100),
    provider_fund_account_id  VARCHAR(100),
    is_default                BOOLEAN       NOT NULL DEFAULT FALSE,
    active                    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_payout_account_fields CHECK (
        (type = 'BANK' AND account_number_encrypted IS NOT NULL AND ifsc IS NOT NULL) OR
        (type = 'UPI' AND upi_id IS NOT NULL))
);
CREATE INDEX idx_payout_accounts_user ON payout_accounts (user_id) WHERE active;

CREATE TABLE withdrawals (
    id                 UUID            PRIMARY KEY,
    user_id            UUID            NOT NULL,
    payout_account_id  UUID            NOT NULL REFERENCES payout_accounts (id),
    amount             NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    status             VARCHAR(20)     NOT NULL CHECK (status IN ('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED')),
    provider_payout_id VARCHAR(100)    UNIQUE,
    failure_reason     VARCHAR(500),
    reviewed_by        UUID,
    reviewed_at        TIMESTAMPTZ,
    processed_at       TIMESTAMPTZ,
    version            BIGINT          NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_withdrawals_user ON withdrawals (user_id, created_at DESC);
CREATE INDEX idx_withdrawals_status ON withdrawals (status, created_at);

CREATE TABLE refunds (
    id                  UUID            PRIMARY KEY,
    escrow_id           UUID            NOT NULL REFERENCES escrow_holdings (id),
    payment_order_id    UUID            NOT NULL REFERENCES payment_orders (id),
    amount              NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    reason              VARCHAR(500)    NOT NULL,
    status              VARCHAR(20)     NOT NULL CHECK (status IN ('REQUESTED', 'PROCESSED', 'REJECTED', 'FAILED')),
    provider_refund_id  VARCHAR(100),
    requested_by        UUID            NOT NULL,
    reviewed_by         UUID,
    reviewed_at         TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_refunds_one_open_per_escrow ON refunds (escrow_id) WHERE status = 'REQUESTED';

CREATE TABLE direct_payments (
    id             UUID            PRIMARY KEY,
    project_id     UUID            NOT NULL,
    client_id      UUID            NOT NULL,
    freelancer_id  UUID            NOT NULL,
    amount         NUMERIC(14, 2)  NOT NULL CHECK (amount > 0),
    method         VARCHAR(30)     NOT NULL,
    reference      VARCHAR(120),
    note           VARCHAR(500),
    status         VARCHAR(20)     NOT NULL CHECK (status IN ('RECORDED', 'CONFIRMED', 'DISPUTED')),
    confirmed_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_direct_payments_project ON direct_payments (project_id);

-- ---------------------------------------------------------------------
-- Invoices with gap-free numbering per Indian financial year (Apr-Mar),
-- e.g. TNU/2026-27/000042, generated by a PL/pgSQL function.
-- ---------------------------------------------------------------------
CREATE TABLE invoice_sequences (
    financial_year  VARCHAR(7)  PRIMARY KEY,
    last_value      INT         NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_invoice_number(p_prefix VARCHAR) RETURNS VARCHAR
LANGUAGE plpgsql AS $$
DECLARE
    v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    v_start INT;
    v_fy    VARCHAR(7);
    v_next  INT;
BEGIN
    v_start := CASE WHEN EXTRACT(MONTH FROM v_today) >= 4 THEN EXTRACT(YEAR FROM v_today)::INT
                    ELSE EXTRACT(YEAR FROM v_today)::INT - 1 END;
    v_fy := v_start || '-' || lpad(((v_start + 1) % 100)::TEXT, 2, '0');
    INSERT INTO invoice_sequences (financial_year, last_value) VALUES (v_fy, 1)
    ON CONFLICT (financial_year) DO UPDATE SET last_value = invoice_sequences.last_value + 1
    RETURNING last_value INTO v_next;
    RETURN p_prefix || '/' || v_fy || '/' || lpad(v_next::TEXT, 6, '0');
END;
$$;

CREATE TABLE invoices (
    id              UUID            PRIMARY KEY,
    invoice_number  VARCHAR(40)     NOT NULL UNIQUE,
    type            VARCHAR(30)     NOT NULL CHECK (type IN ('PROJECT_PAYMENT', 'WITHDRAWAL', 'COMMISSION', 'CREDIT_PURCHASE')),
    user_id         UUID            NOT NULL,
    reference_type  VARCHAR(30)     NOT NULL,
    reference_id    UUID            NOT NULL,
    description     VARCHAR(300)    NOT NULL,
    subtotal        NUMERIC(14, 2)  NOT NULL,
    tax_rate        NUMERIC(5, 4)   NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    total           NUMERIC(14, 2)  NOT NULL,
    currency        CHAR(3)         NOT NULL DEFAULT 'INR',
    issued_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT uq_invoices_reference UNIQUE (type, reference_id, user_id)
);
CREATE INDEX idx_invoices_user ON invoices (user_id, issued_at DESC);

-- Webhook de-duplication (providers retry deliveries).
CREATE TABLE webhook_events (
    id            BIGSERIAL     PRIMARY KEY,
    provider      VARCHAR(20)   NOT NULL,
    event_id      VARCHAR(150)  NOT NULL,
    event_type    VARCHAR(80)   NOT NULL,
    payload       JSONB         NOT NULL,
    received_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);
