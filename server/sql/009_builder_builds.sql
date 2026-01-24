-- 009_builder_builds.sql
-- Builder Build Records Persistence
-- Stores build lifecycle state so history survives server restarts.

CREATE TABLE IF NOT EXISTS builder_builds (
  id VARCHAR(64) PRIMARY KEY,
  app_id VARCHAR(255) NOT NULL,

  -- Build request (original user input)
  request JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Build plan (architecture + PRD, populated after planning phase)
  plan JSONB,

  -- Current phase
  phase VARCHAR(50) NOT NULL DEFAULT 'staging',

  -- Progress tracking
  progress_completed INT NOT NULL DEFAULT 0,
  progress_total INT NOT NULL DEFAULT 0,
  progress_current_story VARCHAR(512),

  -- Optional metadata
  rag_store_name VARCHAR(255),
  session_id VARCHAR(255),
  research_report JSONB,
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing builds by app and recency
CREATE INDEX IF NOT EXISTS idx_builder_builds_app_id ON builder_builds(app_id);
CREATE INDEX IF NOT EXISTS idx_builder_builds_phase ON builder_builds(phase);
CREATE INDEX IF NOT EXISTS idx_builder_builds_created ON builder_builds(created_at DESC);
