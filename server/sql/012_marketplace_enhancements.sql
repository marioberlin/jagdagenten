-- ============================================================================
-- Marketplace Enhancements Migration
-- ============================================================================
-- Adds: visibility for public registry, recommendations materialized view,
-- source tracking for remote installations
-- ============================================================================

-- Add visibility column for public/private skills
ALTER TABLE marketplace_skills
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';

-- Add index for public skills queries
CREATE INDEX IF NOT EXISTS idx_skills_visibility ON marketplace_skills (visibility)
WHERE
    visibility = 'public';

-- Track installation source (for remote installs)
ALTER TABLE marketplace_skill_installations
ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);

-- ============================================================================
-- Recommendation Engine - Materialized View
-- ============================================================================

-- Drop if exists for clean recreation
DROP MATERIALIZED VIEW IF EXISTS skill_coinstallations;

-- Materialized view for "users also installed" recommendations
CREATE MATERIALIZED VIEW skill_coinstallations AS
SELECT
    i1.skill_id AS base_skill,
    i2.skill_id AS related_skill,
    COUNT(DISTINCT i1.owner_id) AS coinstall_count
FROM
    marketplace_skill_installations i1
    JOIN marketplace_skill_installations i2 ON i1.owner_id = i2.owner_id
    AND i1.skill_id != i2.skill_id
GROUP BY
    i1.skill_id,
    i2.skill_id
HAVING
    COUNT(DISTINCT i1.owner_id) >= 2;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_coinstall_pk ON skill_coinstallations (base_skill, related_skill);

-- Index for fast lookups by base skill
CREATE INDEX IF NOT EXISTS idx_coinstall_base ON skill_coinstallations (base_skill);

-- ============================================================================
-- Gemini Corpus Tracking
-- ============================================================================

-- Track which skills are indexed in Gemini corpus
ALTER TABLE marketplace_skills
ADD COLUMN IF NOT EXISTS gemini_document_id VARCHAR(255);

ALTER TABLE marketplace_skills
ADD COLUMN IF NOT EXISTS gemini_indexed_at TIMESTAMPTZ;

-- ============================================================================
-- Helper function to refresh recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_skill_recommendations()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY skill_coinstallations;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON MATERIALIZED VIEW skill_coinstallations IS 'Co-installation patterns for skill recommendations. Refresh daily via cron.';