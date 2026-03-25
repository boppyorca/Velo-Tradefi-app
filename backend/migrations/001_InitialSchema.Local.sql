-- ============================================================
-- VeloTradeFi Database Migration
-- Target: Standalone PostgreSQL (Docker Compose)
-- Version: 001_InitialSchema.Local
-- Description: Standalone schema without Supabase auth.uid()
-- ============================================================

-- ── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    wallet_address  VARCHAR(42),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ── Stock Watchlist table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_watchlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol      VARCHAR(20) NOT NULL,
    market      VARCHAR(4) NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_stock_watchlist UNIQUE (user_id, symbol, market)
);

CREATE INDEX IF NOT EXISTS idx_stock_watchlist_user ON stock_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchlist_symbol ON stock_watchlists(symbol);

-- ── Memecoin Watchlist table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memecoin_watchlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id     VARCHAR(100) NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_memecoin_watchlist UNIQUE (user_id, coin_id)
);

CREATE INDEX IF NOT EXISTS idx_memecoin_watchlist_user ON memecoin_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_watchlist_coin ON memecoin_watchlists(coin_id);

-- ── Prediction History table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prediction_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(20) NOT NULL,
    model_used      VARCHAR(20) NOT NULL,
    confidence      DECIMAL(5,4),
    current_price   DECIMAL(18,6),
    predicted_price DECIMAL(18,6),
    predicted_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prediction_user ON prediction_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_symbol ON prediction_histories(symbol);
CREATE INDEX IF NOT EXISTS idx_prediction_created ON prediction_histories(created_at DESC);

-- ── Audit: Updated At trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security (stand-alone — no Supabase auth) ───────────────────────
-- For Docker Compose / local dev: RLS enabled but no auth.uid() available.
-- JWT validation is done at the API layer instead.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE memecoin_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_histories ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (auth is enforced at API level via JWT)
CREATE POLICY "docker_compose_all_users" ON users FOR ALL TO PUBLIC USING (true);
CREATE POLICY "docker_compose_all_stock_watchlist" ON stock_watchlists FOR ALL TO PUBLIC USING (true);
CREATE POLICY "docker_compose_all_memecoin_watchlist" ON memecoin_watchlists FOR ALL TO PUBLIC USING (true);
CREATE POLICY "docker_compose_all_prediction_history" ON prediction_histories FOR ALL TO PUBLIC USING (true);

-- ── Comments ─────────────────────────────────────────────────────────────────
COMMENT ON TABLE users IS 'User accounts with authentication and wallet info';
COMMENT ON TABLE stock_watchlists IS 'User stock watchlist with VN/US market support';
COMMENT ON TABLE memecoin_watchlists IS 'User memecoin watchlist via CoinGecko';
COMMENT ON TABLE prediction_histories IS 'AI prediction history for tracking forecasts';
