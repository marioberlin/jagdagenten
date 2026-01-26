-- ============================================================================
-- Schema Migrations Tracking Table
-- ============================================================================
-- This table tracks which SQL migrations have been applied to the database.
-- Used by the auto-migration script in CI/CD to avoid re-running migrations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64), -- Optional: MD5 of migration file for drift detection
    execution_time_ms INTEGER
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations (applied_at DESC);

-- Comment for documentation
COMMENT ON
TABLE schema_migrations IS 'Tracks applied SQL migrations for CI/CD auto-migration';