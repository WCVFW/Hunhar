-- =====================================================================
-- credit_db : credit wallets + immutable ledger (credits pay for bids)
-- =====================================================================

CREATE TABLE credit_accounts (
    user_id          UUID         PRIMARY KEY,
    balance          INT          NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned  INT          NOT NULL DEFAULT 0,
    lifetime_spent   INT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_credit_accounts_updated_at BEFORE UPDATE ON credit_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append-only ledger: balance_after makes every statement auditable/reconcilable.
CREATE TABLE credit_transactions (
    id               UUID          PRIMARY KEY,
    user_id          UUID          NOT NULL REFERENCES credit_accounts (user_id),
    type             VARCHAR(30)   NOT NULL CHECK (type IN ('STARTER_GRANT', 'BID_DEBIT', 'BID_REFUND', 'PURCHASE',
                                                            'ADMIN_ALLOCATION', 'ADMIN_DEDUCTION')),
    amount           INT           NOT NULL CHECK (amount <> 0),
    balance_after    INT           NOT NULL CHECK (balance_after >= 0),
    reference        VARCHAR(120),
    idempotency_key  VARCHAR(150)  NOT NULL UNIQUE,
    description      VARCHAR(300),
    created_by       UUID,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tx_user ON credit_transactions (user_id, created_at DESC);
CREATE INDEX idx_credit_tx_type ON credit_transactions (type, created_at DESC);

-- Ledger rows are immutable.
CREATE OR REPLACE FUNCTION trg_credit_tx_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'credit_transactions is append-only' USING ERRCODE = '42501';
END;
$$;
CREATE TRIGGER trg_credit_tx_no_update BEFORE UPDATE OR DELETE ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION trg_credit_tx_immutable();

CREATE TABLE credit_packages (
    id             UUID            PRIMARY KEY,
    name           VARCHAR(100)    NOT NULL,
    credits        INT             NOT NULL CHECK (credits > 0),
    bonus_credits  INT             NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
    price          NUMERIC(12, 2)  NOT NULL CHECK (price > 0),
    active         BOOLEAN         NOT NULL DEFAULT TRUE,
    position       INT             NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE credit_purchases (
    id                UUID            PRIMARY KEY,
    user_id           UUID            NOT NULL,
    package_id        UUID            NOT NULL REFERENCES credit_packages (id),
    credits           INT             NOT NULL CHECK (credits > 0),
    price             NUMERIC(12, 2)  NOT NULL,
    status            VARCHAR(20)     NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    payment_order_id  UUID,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_purchases_user ON credit_purchases (user_id, created_at DESC);

/*
 * Single entry point for every balance change (PL/pgSQL):
 *  - idempotent: an already-used key returns the original transaction (duplicate = true)
 *  - atomic: conditional UPDATE never lets the balance go negative under concurrency
 *  - raises INSUFFICIENT_CREDITS (SQLSTATE P0001) when a debit cannot be covered
 */
CREATE OR REPLACE FUNCTION apply_credit_transaction(
    p_user UUID, p_amount INT, p_type VARCHAR, p_key VARCHAR,
    p_reference VARCHAR, p_description VARCHAR, p_created_by UUID
) RETURNS TABLE (transaction_id UUID, new_balance INT, duplicate BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
    v_existing credit_transactions%ROWTYPE;
    v_balance  INT;
    v_id       UUID := gen_random_uuid();
BEGIN
    IF p_amount = 0 THEN
        RAISE EXCEPTION 'Amount must be non-zero' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_existing FROM credit_transactions WHERE idempotency_key = p_key;
    IF FOUND THEN
        RETURN QUERY SELECT v_existing.id, v_existing.balance_after, TRUE;
        RETURN;
    END IF;

    INSERT INTO credit_accounts (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;

    BEGIN
        UPDATE credit_accounts
           SET balance         = balance + p_amount,
               lifetime_earned = lifetime_earned + GREATEST(p_amount, 0),
               lifetime_spent  = lifetime_spent + GREATEST(-p_amount, 0)
         WHERE user_id = p_user AND balance + p_amount >= 0
        RETURNING balance INTO v_balance;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
        END IF;

        INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, reference, idempotency_key,
                                         description, created_by)
        VALUES (v_id, p_user, p_type, p_amount, v_balance, p_reference, p_key, p_description, p_created_by);
    EXCEPTION WHEN unique_violation THEN
        -- concurrent call with the same key won the race: the sub-transaction (balance change) is rolled back
        SELECT * INTO v_existing FROM credit_transactions WHERE idempotency_key = p_key;
        RETURN QUERY SELECT v_existing.id, v_existing.balance_after, TRUE;
        RETURN;
    END;

    RETURN QUERY SELECT v_id, v_balance, FALSE;
END;
$$;

INSERT INTO credit_packages (id, name, credits, bonus_credits, price, position) VALUES
    (gen_random_uuid(), 'Starter Pack', 20, 0, 199.00, 1),
    (gen_random_uuid(), 'Pro Pack', 60, 10, 499.00, 2),
    (gen_random_uuid(), 'Agency Pack', 150, 40, 999.00, 3);
