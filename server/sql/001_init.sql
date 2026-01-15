-- LiquidCrypto A2A Database Schema
-- This script runs automatically when PostgreSQL container starts

-- A2A Tasks table
CREATE TABLE IF NOT EXISTS a2a_tasks (
  id VARCHAR(255) PRIMARY KEY,
  context_id VARCHAR(255) NOT NULL,
  status_state VARCHAR(100) NOT NULL,
  status_message JSONB,
  status_timestamp TIMESTAMPTZ,
  artifacts JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_context_id ON a2a_tasks (context_id);
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_status_state ON a2a_tasks (status_state);
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_created_at ON a2a_tasks (created_at DESC);

-- A2A Push Notifications table
CREATE TABLE IF NOT EXISTS a2a_push_notifications (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL REFERENCES a2a_tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  authentication JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_a2a_push_notifications_task_id ON a2a_push_notifications (task_id);

-- Artifacts table for standalone artifact storage
CREATE TABLE IF NOT EXISTS a2a_artifacts (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) REFERENCES a2a_tasks(id) ON DELETE SET NULL,
  artifact_id VARCHAR(255) NOT NULL,
  name VARCHAR(500),
  description TEXT,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  is_streaming BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_artifacts_task_id ON a2a_artifacts (task_id);
CREATE INDEX IF NOT EXISTS idx_a2a_artifacts_artifact_id ON a2a_artifacts (artifact_id);
CREATE INDEX IF NOT EXISTS idx_a2a_artifacts_created_at ON a2a_artifacts (created_at DESC);

-- Artifact versions for history tracking
CREATE TABLE IF NOT EXISTS a2a_artifact_versions (
  id SERIAL PRIMARY KEY,
  artifact_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  parts JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, version)
);

CREATE INDEX IF NOT EXISTS idx_a2a_artifact_versions_artifact_id ON a2a_artifact_versions (artifact_id);

-- Pinned artifacts for user preferences
CREATE TABLE IF NOT EXISTS a2a_pinned_artifacts (
  id SERIAL PRIMARY KEY,
  artifact_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, user_id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_a2a_tasks_updated_at ON a2a_tasks;
CREATE TRIGGER update_a2a_tasks_updated_at
    BEFORE UPDATE ON a2a_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_a2a_artifacts_updated_at ON a2a_artifacts;
CREATE TRIGGER update_a2a_artifacts_updated_at
    BEFORE UPDATE ON a2a_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if needed for specific roles)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO liquidcrypto;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO liquidcrypto;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'LiquidCrypto A2A database schema initialized successfully';
END $$;
