-- UCP Merchant Discovery System
-- Migration: 013_ucp_discovery
--
-- Tables for storing merchant registry, profiles, and crawl history

-- ============================================================================
-- Merchants Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_merchants (
    id TEXT PRIMARY KEY,
    domain TEXT UNIQUE NOT NULL,
    region TEXT NOT NULL CHECK (region IN ('EU', 'US', 'CA', 'OTHER')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ucp_merchants_domain ON ucp_merchants(domain);
CREATE INDEX IF NOT EXISTS idx_ucp_merchants_region ON ucp_merchants(region);
CREATE INDEX IF NOT EXISTS idx_ucp_merchants_score ON ucp_merchants(score DESC);
CREATE INDEX IF NOT EXISTS idx_ucp_merchants_active ON ucp_merchants(is_active) WHERE is_active = true;

-- ============================================================================
-- Merchant Sources (where we discovered the merchant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_merchant_sources (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('github_dir', 'ucpchecker', 'ucptools', 'search', 'manual')),
    source_url TEXT NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ucp_sources_merchant ON ucp_merchant_sources(merchant_id);

-- ============================================================================
-- UCP Profile Snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_profiles (
    merchant_id TEXT PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    ucp_version TEXT NOT NULL,
    services JSONB NOT NULL DEFAULT '{}',
    capabilities JSONB NOT NULL DEFAULT '[]',
    payment JSONB,
    signing_keys JSONB,
    has_a2a BOOLEAN DEFAULT false,
    a2a_agent_card_url TEXT,
    rest_endpoint TEXT,
    mcp_endpoint TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ucp_profiles_has_a2a ON ucp_profiles(has_a2a) WHERE has_a2a = true;

-- ============================================================================
-- Agent Card Snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_agent_cards (
    merchant_id TEXT PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    protocol_versions JSONB NOT NULL DEFAULT '["1.0"]',
    supported_interfaces JSONB NOT NULL DEFAULT '[]',
    capabilities JSONB NOT NULL DEFAULT '{}',
    extensions JSONB NOT NULL DEFAULT '{}',
    skills JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Validation Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_validation_results (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    target TEXT NOT NULL CHECK (target IN ('ucp_profile', 'agent_card')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'error')),
    code TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_ucp_validation_merchant ON ucp_validation_results(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ucp_validation_severity ON ucp_validation_results(severity);

-- ============================================================================
-- Crawl State (scheduling)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_crawl_state (
    merchant_id TEXT PRIMARY KEY REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    next_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consecutive_failures INTEGER DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    health_tier TEXT NOT NULL DEFAULT 'A' CHECK (health_tier IN ('A', 'B', 'C'))
);

CREATE INDEX IF NOT EXISTS idx_ucp_crawl_next_check ON ucp_crawl_state(next_check_at);
CREATE INDEX IF NOT EXISTS idx_ucp_crawl_health_tier ON ucp_crawl_state(health_tier);

-- ============================================================================
-- Fetch History (for tracking latency, status, conditional requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_fetch_history (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES ucp_merchants(id) ON DELETE CASCADE,
    fetch_type TEXT NOT NULL CHECK (fetch_type IN ('ucp_profile', 'agent_card')),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    url TEXT NOT NULL,
    final_url TEXT,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    etag TEXT,
    last_modified TEXT,
    cache_control TEXT,
    body_sha256 TEXT,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_ucp_fetch_merchant ON ucp_fetch_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ucp_fetch_time ON ucp_fetch_history(fetched_at DESC);

-- Only keep last 10 fetch records per merchant (cleanup trigger)
CREATE OR REPLACE FUNCTION cleanup_ucp_fetch_history()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM ucp_fetch_history
    WHERE merchant_id = NEW.merchant_id
    AND id NOT IN (
        SELECT id FROM ucp_fetch_history
        WHERE merchant_id = NEW.merchant_id
        ORDER BY fetched_at DESC
        LIMIT 10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_ucp_fetch ON ucp_fetch_history;
CREATE TRIGGER trg_cleanup_ucp_fetch
    AFTER INSERT ON ucp_fetch_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_ucp_fetch_history();

-- ============================================================================
-- Crawler Run History
-- ============================================================================
CREATE TABLE IF NOT EXISTS ucp_crawler_runs (
    id SERIAL PRIMARY KEY,
    run_type TEXT NOT NULL CHECK (run_type IN ('full', 'incremental')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    domains_discovered INTEGER DEFAULT 0,
    domains_processed INTEGER DEFAULT 0,
    new_merchants INTEGER DEFAULT 0,
    updated_merchants INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_ucp_crawler_runs_time ON ucp_crawler_runs(started_at DESC);

-- ============================================================================
-- Statistics View
-- ============================================================================
CREATE OR REPLACE VIEW ucp_stats AS
SELECT
    (SELECT COUNT(*) FROM ucp_merchants) AS total_merchants,
    (SELECT COUNT(*) FROM ucp_merchants WHERE is_active = true) AS active_merchants,
    (SELECT COUNT(*) FROM ucp_merchants WHERE region = 'EU') AS eu_merchants,
    (SELECT COUNT(*) FROM ucp_merchants WHERE region = 'US') AS us_merchants,
    (SELECT COUNT(*) FROM ucp_merchants WHERE region = 'CA') AS ca_merchants,
    (SELECT COUNT(*) FROM ucp_merchants WHERE region = 'OTHER') AS other_merchants,
    (SELECT COUNT(*) FROM ucp_crawl_state WHERE health_tier = 'A') AS tier_a_count,
    (SELECT COUNT(*) FROM ucp_crawl_state WHERE health_tier = 'B') AS tier_b_count,
    (SELECT COUNT(*) FROM ucp_crawl_state WHERE health_tier = 'C') AS tier_c_count,
    (SELECT COUNT(*) FROM ucp_profiles WHERE has_a2a = true) AS with_a2a,
    (SELECT COALESCE(
        ROUND(100.0 * COUNT(*) FILTER (WHERE p.merchant_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1),
        0
    ) FROM ucp_merchants m LEFT JOIN ucp_profiles p ON m.id = p.merchant_id) AS valid_percentage;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get merchants due for recheck
CREATE OR REPLACE FUNCTION get_merchants_due_for_check(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    merchant_id TEXT,
    domain TEXT,
    region TEXT,
    health_tier TEXT,
    next_check_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.domain,
        m.region,
        cs.health_tier,
        cs.next_check_at
    FROM ucp_merchants m
    JOIN ucp_crawl_state cs ON m.id = cs.merchant_id
    WHERE m.is_active = true
    AND cs.next_check_at <= NOW()
    ORDER BY cs.next_check_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Update merchant score and health tier
CREATE OR REPLACE FUNCTION update_merchant_health(
    p_merchant_id TEXT,
    p_score INTEGER,
    p_consecutive_failures INTEGER
) RETURNS TEXT AS $$
DECLARE
    new_tier TEXT;
BEGIN
    -- Determine health tier based on failures
    IF p_consecutive_failures = 0 THEN
        new_tier := 'A';
    ELSIF p_consecutive_failures <= 2 THEN
        new_tier := 'B';
    ELSE
        new_tier := 'C';
    END IF;

    -- Update merchant score
    UPDATE ucp_merchants
    SET score = p_score, updated_at = NOW()
    WHERE id = p_merchant_id;

    -- Update crawl state
    UPDATE ucp_crawl_state
    SET health_tier = new_tier
    WHERE merchant_id = p_merchant_id;

    RETURN new_tier;
END;
$$ LANGUAGE plpgsql;
