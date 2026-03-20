-- ============================================================
-- VeloTradeFi Database Schema v4
-- Supabase Auth Integration
-- Updated: March 2026
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop existing objects (for clean re-run) ───────────────────
-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users manage own stock watchlists" ON stock_watchlists;
DROP POLICY IF EXISTS "Users manage own memecoin watchlists" ON memecoin_watchlists;
DROP POLICY IF EXISTS "Users manage own predictions" ON prediction_histories;
DROP POLICY IF EXISTS "Users manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own API logs" ON api_request_logs;
DROP POLICY IF EXISTS "Service can manage API logs" ON api_request_logs;

-- ── Users ────────────────────────────────────────────────────
-- Notes:
-- - id references auth.users (Supabase manages auth)
-- - password_hash kept for compatibility but can be empty with Supabase Auth
CREATE TABLE IF NOT EXISTS users (
    id                UUID            PRIMARY KEY,
    email             VARCHAR(255)     NOT NULL UNIQUE,
    password_hash     VARCHAR(255),    -- Empty when using Supabase Auth
    full_name         VARCHAR(255)     NOT NULL DEFAULT '',
    wallet_address    VARCHAR(42),
    avatar_url        TEXT,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;

-- ── Stock Watchlists ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_watchlists (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol     VARCHAR(20) NOT NULL,
    market     VARCHAR(4)  NOT NULL,
    name       VARCHAR(255),
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, symbol, market)
);
CREATE INDEX IF NOT EXISTS idx_stock_watchlists_user   ON stock_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_watchlists_symbol ON stock_watchlists(symbol);

-- ── Memecoin Watchlists ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS memecoin_watchlists (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id    VARCHAR(100) NOT NULL,
    symbol     VARCHAR(20),
    name       VARCHAR(255),
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, coin_id)
);
CREATE INDEX IF NOT EXISTS idx_memecoin_watchlists_user ON memecoin_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_watchlists_coin ON memecoin_watchlists(coin_id);

-- ── Prediction History ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS prediction_histories (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol           VARCHAR(20) NOT NULL,
    model_used       VARCHAR(20) NOT NULL,
    confidence       DOUBLE PRECISION NOT NULL,
    current_price    DOUBLE PRECISION NOT NULL,
    predicted_price  DOUBLE PRECISION NOT NULL,
    predicted_date   TIMESTAMPTZ NOT NULL,
    trend            VARCHAR(10),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prediction_histories_user   ON prediction_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_histories_symbol ON prediction_histories(symbol);
CREATE INDEX IF NOT EXISTS idx_prediction_histories_date   ON prediction_histories(created_at DESC);

-- ── User Sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(64) NOT NULL UNIQUE,
    device_info  VARCHAR(255),
    ip_address   VARCHAR(45),
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user    ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE revoked_at IS NULL;

-- ── API Request Logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_request_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    endpoint     VARCHAR(255) NOT NULL,
    method       VARCHAR(10) NOT NULL,
    status_code  INTEGER,
    response_ms  INTEGER,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_logs_user     ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_date     ON api_request_logs(created_at DESC);

-- ── Triggers ─────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SUPABASE AUTH INTEGRATION
-- Automatically create public.users when Supabase Auth creates auth.users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, password_hash)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        ''  -- Supabase Auth manages password, no hash needed
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run trigger when new user signs up via Supabase Auth
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update public.users when user updates their profile in auth.users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Uses auth.uid() for Supabase Auth
-- ============================================================

-- Enable RLS
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_watchlists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE memecoin_watchlists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs     ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────

-- USERS
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Supabase Auth handles inserts via trigger
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- STOCK WATCHLISTS
CREATE POLICY "Users manage own stock watchlists" ON stock_watchlists
    FOR ALL USING (auth.uid() = user_id);

-- MEMECOIN WATCHLISTS
CREATE POLICY "Users manage own memecoin watchlists" ON memecoin_watchlists
    FOR ALL USING (auth.uid() = user_id);

-- PREDICTION HISTORIES
CREATE POLICY "Users manage own predictions" ON prediction_histories
    FOR ALL USING (auth.uid() = user_id);

-- USER SESSIONS
CREATE POLICY "Users manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- API LOGS
CREATE POLICY "Users can view own API logs" ON api_request_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do anything
CREATE POLICY "Service can manage API logs" ON api_request_logs
    FOR ALL USING (true);

-- ── Grant Permissions ─────────────────────────────────────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM auth.users;
-- SELECT * FROM public.users;
