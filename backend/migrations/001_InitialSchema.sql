-- ============================================================
-- VeloTradeFi Database Migration
-- Target: Supabase PostgreSQL
-- Version: 001_InitialSchema
-- Description: Initial database schema for VeloTradeFi app
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
    market      VARCHAR(4) NOT NULL,        -- 'VN' | 'US'
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Prevent duplicate entries
    CONSTRAINT uq_stock_watchlist UNIQUE (user_id, symbol, market)
);

CREATE INDEX IF NOT EXISTS idx_stock_watchlist_user ON stock_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchlist_symbol ON stock_watchlists(symbol);

-- ── Memecoin Watchlist table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memecoin_watchlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id     VARCHAR(100) NOT NULL,       -- CoinGecko ID, e.g. "dogecoin"
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Prevent duplicate entries
    CONSTRAINT uq_memecoin_watchlist UNIQUE (user_id, coin_id)
);

CREATE INDEX IF NOT EXISTS idx_memecoin_watchlist_user ON memecoin_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_watchlist_coin ON memecoin_watchlists(coin_id);

-- ── Prediction History table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prediction_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(20) NOT NULL,
    model_used      VARCHAR(20) NOT NULL,    -- 'lstm' | 'prophet'
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

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE memecoin_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_histories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/update their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Users can only manage their own watchlists
CREATE POLICY "Users can manage own stock watchlist"
    ON stock_watchlists FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memecoin watchlist"
    ON memecoin_watchlists FOR ALL
    USING (auth.uid() = user_id);

-- Policy: Users can only see their own prediction history
CREATE POLICY "Users can view own prediction history"
    ON prediction_histories FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated inserts (users can create their own records)
CREATE POLICY "Users can insert own prediction history"
    ON prediction_histories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON TABLE users IS 'User accounts with authentication and wallet info';
COMMENT ON TABLE stock_watchlists IS 'User stock watchlist with VN/US market support';
COMMENT ON TABLE memecoin_watchlists IS 'User memecoin watchlist via CoinGecko';
COMMENT ON TABLE prediction_histories IS 'AI prediction history for tracking forecasts';
