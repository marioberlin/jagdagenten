-- 008_ai_resources.sql
-- Unified AI Resource Management System
-- Consolidates prompts, memory, context, knowledge, artifacts (refs), skills, and MCP tools

-- ============================================================================
-- Main Resources Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource type discriminator
  resource_type VARCHAR(50) NOT NULL,
  -- Valid: 'prompt' | 'memory' | 'context' | 'knowledge' | 'artifact' | 'skill' | 'mcp'

  -- Ownership / targeting
  owner_type VARCHAR(20) NOT NULL DEFAULT 'system',
  -- Valid: 'app' | 'agent' | 'system' | 'user'
  owner_id VARCHAR(255),

  -- Core fields
  name VARCHAR(512) NOT NULL,
  description TEXT,
  content TEXT,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Type-specific metadata (discriminated by resource_type)
  type_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Versioning
  version INT NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES ai_resources(id) ON DELETE SET NULL,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

  -- Tags for cross-cutting categorization
  tags TEXT[] DEFAULT '{}',

  -- Full-text search vector (auto-generated)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(content, '')
    )
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Provenance tracking (MemOS-inspired)
  provenance VARCHAR(50) DEFAULT 'user_input',
  -- Valid: 'user_input' | 'agent_generated' | 'extracted' | 'consolidated' | 'imported'
  usage_frequency INT NOT NULL DEFAULT 0,

  -- Sync control
  sync_to_file BOOLEAN NOT NULL DEFAULT FALSE,

  -- Uniqueness constraint: one active version per name per owner
  CONSTRAINT unique_resource_active UNIQUE (owner_type, owner_id, resource_type, name, version)
);

-- ============================================================================
-- Indices
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_resources_type ON ai_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_ai_resources_owner ON ai_resources(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_resources_active ON ai_resources(is_active, resource_type);
CREATE INDEX IF NOT EXISTS idx_ai_resources_created ON ai_resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_resources_accessed ON ai_resources(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_resources_search ON ai_resources USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_ai_resources_tags ON ai_resources USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_ai_resources_metadata ON ai_resources USING gin(type_metadata);
CREATE INDEX IF NOT EXISTS idx_ai_resources_parent ON ai_resources(parent_id);
CREATE INDEX IF NOT EXISTS idx_ai_resources_pinned ON ai_resources(is_pinned) WHERE is_pinned = TRUE;

-- ============================================================================
-- Sharing Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_resource_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES ai_resources(id) ON DELETE CASCADE,

  -- Share target
  target_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(255) NOT NULL,

  -- Permissions
  permission VARCHAR(20) NOT NULL DEFAULT 'read',
  -- Valid: 'read' | 'write' | 'copy'

  -- Audit
  shared_by VARCHAR(255),
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_share UNIQUE (resource_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_shares_target ON ai_resource_shares(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_shares_resource ON ai_resource_shares(resource_id);

-- ============================================================================
-- Version History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_resource_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES ai_resources(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content TEXT,
  parts JSONB,
  type_metadata JSONB,
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_version UNIQUE (resource_id, version)
);

CREATE INDEX IF NOT EXISTS idx_ai_versions_resource ON ai_resource_versions(resource_id, version DESC);

-- ============================================================================
-- Resource Dependencies (for context compilation ordering)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_resource_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES ai_resources(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES ai_resources(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) NOT NULL DEFAULT 'requires',
  -- Valid: 'requires' | 'extends' | 'overrides' | 'consolidated_from'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_dependency UNIQUE (resource_id, depends_on_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_deps_resource ON ai_resource_dependencies(resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_deps_depends ON ai_resource_dependencies(depends_on_id);

-- ============================================================================
-- Updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ai_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_resources_updated_at ON ai_resources;
CREATE TRIGGER trigger_ai_resources_updated_at
  BEFORE UPDATE ON ai_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_resources_updated_at();
