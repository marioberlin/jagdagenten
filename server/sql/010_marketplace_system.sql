-- Migration: 010_marketplace_system.sql
-- Description: Skill marketplace tables for publishing, versioning, and community features

-- ============================================================================
-- Skills Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    category VARCHAR(50) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    triggers TEXT[] DEFAULT '{}',
    tool_names TEXT[] DEFAULT '{}',
    parameters JSONB DEFAULT '[]',
    content TEXT NOT NULL,
    examples JSONB DEFAULT '[]',
    dependencies TEXT[] DEFAULT '{}',

-- Author info
author_id VARCHAR(255) NOT NULL,
author_username VARCHAR(100) NOT NULL,
author_display_name VARCHAR(200),
author_avatar_url TEXT,

-- Status
is_published BOOLEAN DEFAULT true,
is_verified BOOLEAN DEFAULT false,

-- Stats
stars_count INTEGER DEFAULT 0,
downloads_count INTEGER DEFAULT 0,
usages_count INTEGER DEFAULT 0,
comments_count INTEGER DEFAULT 0,
rating DECIMAL(3, 2) DEFAULT 0,
rating_count INTEGER DEFAULT 0,

-- Timestamps
published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_marketplace_skills_name ON marketplace_skills (name);

CREATE INDEX IF NOT EXISTS idx_marketplace_skills_category ON marketplace_skills (category);

CREATE INDEX IF NOT EXISTS idx_marketplace_skills_author ON marketplace_skills (author_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_skills_published ON marketplace_skills (is_published);

CREATE INDEX IF NOT EXISTS idx_marketplace_skills_verified ON marketplace_skills (is_verified);

CREATE INDEX IF NOT EXISTS idx_marketplace_skills_tags ON marketplace_skills USING GIN (tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_marketplace_skills_search ON marketplace_skills USING GIN (
    to_tsvector (
        'english',
        name || ' ' || display_name || ' ' || description
    )
);

-- ============================================================================
-- Skill Versions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_skill_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    skill_id UUID NOT NULL REFERENCES marketplace_skills (id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    changelog TEXT NOT NULL,
    content TEXT, -- Optional: store content snapshot per version
    download_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (skill_id, version)
);

CREATE INDEX IF NOT EXISTS idx_skill_versions_skill ON marketplace_skill_versions (skill_id);

-- ============================================================================
-- Skill Stars Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_skill_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    skill_id UUID NOT NULL REFERENCES marketplace_skills (id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (skill_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_stars_skill ON marketplace_skill_stars (skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_stars_user ON marketplace_skill_stars (user_id);

-- ============================================================================
-- Skill Comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_skill_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    skill_id UUID NOT NULL REFERENCES marketplace_skills (id) ON DELETE CASCADE,
    author_id VARCHAR(255) NOT NULL,
    author_username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_comments_skill ON marketplace_skill_comments (skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_comments_author ON marketplace_skill_comments (author_id);

-- ============================================================================
-- Skill Installations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_skill_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    skill_id UUID NOT NULL REFERENCES marketplace_skills (id) ON DELETE CASCADE,
    owner_type VARCHAR(20) NOT NULL CHECK (
        owner_type IN ('agent', 'app', 'user')
    ),
    owner_id VARCHAR(255) NOT NULL,
    resource_id UUID, -- Reference to ai_resources table
    version VARCHAR(20) NOT NULL,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (
        skill_id,
        owner_type,
        owner_id
    )
);

CREATE INDEX IF NOT EXISTS idx_skill_installations_skill ON marketplace_skill_installations (skill_id);

CREATE INDEX IF NOT EXISTS idx_skill_installations_owner ON marketplace_skill_installations (owner_type, owner_id);

-- ============================================================================
-- Trigger to update stats
-- ============================================================================

-- Update stars_count when stars change
CREATE OR REPLACE FUNCTION update_skill_stars_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_skills SET stars_count = stars_count + 1 WHERE id = NEW.skill_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_skills SET stars_count = stars_count - 1 WHERE id = OLD.skill_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_skill_stars_count ON marketplace_skill_stars;

CREATE TRIGGER trigger_skill_stars_count
AFTER INSERT OR DELETE ON marketplace_skill_stars
FOR EACH ROW EXECUTE FUNCTION update_skill_stars_count();

-- Update comments_count and rating when comments change
CREATE OR REPLACE FUNCTION update_skill_comments_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE marketplace_skills 
        SET 
            comments_count = (SELECT COUNT(*) FROM marketplace_skill_comments WHERE skill_id = NEW.skill_id),
            rating = COALESCE(
                (SELECT AVG(rating)::DECIMAL(3,2) FROM marketplace_skill_comments WHERE skill_id = NEW.skill_id AND rating IS NOT NULL),
                0
            ),
            rating_count = (SELECT COUNT(*) FROM marketplace_skill_comments WHERE skill_id = NEW.skill_id AND rating IS NOT NULL)
        WHERE id = NEW.skill_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_skills 
        SET 
            comments_count = (SELECT COUNT(*) FROM marketplace_skill_comments WHERE skill_id = OLD.skill_id),
            rating = COALESCE(
                (SELECT AVG(rating)::DECIMAL(3,2) FROM marketplace_skill_comments WHERE skill_id = OLD.skill_id AND rating IS NOT NULL),
                0
            ),
            rating_count = (SELECT COUNT(*) FROM marketplace_skill_comments WHERE skill_id = OLD.skill_id AND rating IS NOT NULL)
        WHERE id = OLD.skill_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_skill_comments_stats ON marketplace_skill_comments;

CREATE TRIGGER trigger_skill_comments_stats
AFTER INSERT OR UPDATE OR DELETE ON marketplace_skill_comments
FOR EACH ROW EXECUTE FUNCTION update_skill_comments_stats();

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_skills_updated ON marketplace_skills;

CREATE TRIGGER trigger_marketplace_skills_updated
BEFORE UPDATE ON marketplace_skills
FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();