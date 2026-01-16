-- Migration: 002_core_tables.sql
-- Description: Add users, sessions, audit_log, and installed_plugins tables
-- Author: LiquidCrypto System
-- Date: 2026-01-16

-- ============================================================================
-- Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_status ON users (status);

-- ============================================================================
-- OAuth Accounts Table (for Google, GitHub, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_oauth_user ON oauth_accounts (user_id);

CREATE INDEX idx_oauth_provider ON oauth_accounts (provider, provider_account_id);

-- ============================================================================
-- Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL, -- sha256 of session token
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sessions_user ON sessions (user_id);

CREATE INDEX idx_sessions_token ON sessions (token_hash);

CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- Cleanup expired sessions
CREATE INDEX idx_sessions_cleanup ON sessions (expires_at)
WHERE
    expires_at < NOW();

-- ============================================================================
-- Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning'))
);

CREATE INDEX idx_audit_timestamp ON audit_log (timestamp DESC);

CREATE INDEX idx_audit_user ON audit_log (user_id);

CREATE INDEX idx_audit_action ON audit_log (action);

CREATE INDEX idx_audit_resource ON audit_log (resource_type, resource_id);

CREATE INDEX idx_audit_request ON audit_log (request_id);

-- Partition by month for large-scale deployments (optional)
-- CREATE INDEX idx_audit_timestamp_month ON audit_log(date_trunc('month', timestamp));

-- ============================================================================
-- Installed Plugins Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS installed_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plugin_name VARCHAR(255) NOT NULL,
    plugin_version VARCHAR(50) NOT NULL,
    source VARCHAR(50) DEFAULT 'registry', -- 'registry', 'local', 'git'
    source_url TEXT,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, plugin_name)
);

CREATE INDEX idx_plugins_user ON installed_plugins (user_id);

CREATE INDEX idx_plugins_name ON installed_plugins (plugin_name);

CREATE INDEX idx_plugins_enabled ON installed_plugins (enabled);

-- ============================================================================
-- API Keys Table (for external API access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL, -- sha256 of the actual key
    key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for identification
    scopes TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_apikeys_user ON api_keys (user_id);

CREATE INDEX idx_apikeys_hash ON api_keys (key_hash);

CREATE INDEX idx_apikeys_prefix ON api_keys (key_prefix);

-- ============================================================================
-- Container Metrics Table (for LiquidContainer monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS container_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    cpu_usage_percent NUMERIC(5,2),
    memory_usage_mb NUMERIC(10,2),
    memory_limit_mb INTEGER,
    network_rx_bytes BIGINT,
    network_tx_bytes BIGINT,
    status VARCHAR(20),
    runtime_seconds INTEGER,
    provider VARCHAR(50),
    region VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_container_metrics_container ON container_metrics (container_id);

CREATE INDEX idx_container_metrics_user ON container_metrics (user_id);

CREATE INDEX idx_container_metrics_timestamp ON container_metrics (timestamp DESC);

-- Hypertable for TimescaleDB (if available)
-- SELECT create_hypertable('container_metrics', 'timestamp', if_not_exists => TRUE);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_updated_at
    BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plugins_updated_at
    BEFORE UPDATE ON installed_plugins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON
TABLE users IS 'Core user accounts with authentication and profile data';

COMMENT ON
TABLE oauth_accounts IS 'OAuth provider connections for users (Google, GitHub, etc.)';

COMMENT ON
TABLE sessions IS 'Active user sessions with expiry tracking';

COMMENT ON
TABLE audit_log IS 'Security and action audit trail for compliance';

COMMENT ON
TABLE installed_plugins IS 'User-installed plugins from registry or local sources';

COMMENT ON
TABLE api_keys IS 'API keys for programmatic access with scopes and rate limits';

COMMENT ON
TABLE container_metrics IS 'Runtime metrics for LiquidContainer instances';