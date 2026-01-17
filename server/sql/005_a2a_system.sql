-- Migration: 005_a2a_system.sql
-- Description: A2A Protocol v1.0 session tracking, artifact persistence, message history
-- Author: LiquidCrypto System
-- Date: 2026-01-17

-- ============================================================================
-- A2A Sessions Table
-- ============================================================================
-- High-level session tracking for A2A interactions

CREATE TABLE IF NOT EXISTS a2a_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

-- Agent identification
agent_name VARCHAR(255),
agent_version VARCHAR(50),
protocol_version VARCHAR(10) DEFAULT '1.0',

-- Session state
status VARCHAR(30) DEFAULT 'active' CHECK (
    status IN (
        'active',
        'completed',
        'expired',
        'error'
    )
),

-- Statistics
total_tasks INTEGER DEFAULT 0,
total_messages INTEGER DEFAULT 0,
total_artifacts INTEGER DEFAULT 0,
total_tokens_used INTEGER DEFAULT 0,

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_a2a_sessions_context ON a2a_sessions (context_id);

CREATE INDEX idx_a2a_sessions_user ON a2a_sessions (user_id);

CREATE INDEX idx_a2a_sessions_status ON a2a_sessions (status);

CREATE INDEX idx_a2a_sessions_created ON a2a_sessions (created_at DESC);

CREATE INDEX idx_a2a_sessions_active ON a2a_sessions (user_id, status)
WHERE
    status = 'active';

-- ============================================================================
-- A2A Artifacts Table
-- ============================================================================
-- Normalized artifact storage with full content

CREATE TABLE IF NOT EXISTS a2a_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id VARCHAR(255) NOT NULL,
    task_id VARCHAR(255) NOT NULL,
    session_id UUID REFERENCES a2a_sessions(id) ON DELETE SET NULL,

-- Artifact metadata
name VARCHAR(500), description TEXT,

-- Content (JSONB for flexibility)
parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    extensions TEXT[] DEFAULT '{}',

-- File storage (for large binary artifacts)
file_path TEXT, file_size BIGINT, media_type VARCHAR(200),

-- Streaming support
is_complete BOOLEAN DEFAULT TRUE,
chunk_index INTEGER DEFAULT 0,
total_chunks INTEGER,

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Unique per task
UNIQUE(task_id, artifact_id) );

-- Foreign key to a2a_tasks (will be created if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'a2a_tasks') THEN
        ALTER TABLE a2a_artifacts 
        ADD CONSTRAINT fk_a2a_artifacts_task 
        FOREIGN KEY (task_id) REFERENCES a2a_tasks(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

CREATE INDEX idx_a2a_artifacts_task ON a2a_artifacts (task_id);

CREATE INDEX idx_a2a_artifacts_session ON a2a_artifacts (session_id);

CREATE INDEX idx_a2a_artifacts_created ON a2a_artifacts (created_at DESC);

CREATE INDEX idx_a2a_artifacts_incomplete ON a2a_artifacts (task_id, is_complete)
WHERE
    is_complete = FALSE;

-- ============================================================================
-- A2A Messages Table
-- ============================================================================
-- Complete message history for session review

CREATE TABLE IF NOT EXISTS a2a_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) NOT NULL UNIQUE,
    task_id VARCHAR(255),
    context_id VARCHAR(255),
    session_id UUID REFERENCES a2a_sessions(id) ON DELETE SET NULL,

-- Message content
role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'agent')),
    parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    extensions TEXT[] DEFAULT '{}',
    reference_task_ids TEXT[] DEFAULT '{}',

-- Order tracking
sequence_number INTEGER,

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW() );

-- Foreign key to a2a_tasks (will be created if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'a2a_tasks') THEN
        ALTER TABLE a2a_messages 
        ADD CONSTRAINT fk_a2a_messages_task 
        FOREIGN KEY (task_id) REFERENCES a2a_tasks(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

CREATE INDEX idx_a2a_messages_task ON a2a_messages (task_id);

CREATE INDEX idx_a2a_messages_context ON a2a_messages (context_id);

CREATE INDEX idx_a2a_messages_session ON a2a_messages (session_id);

CREATE INDEX idx_a2a_messages_created ON a2a_messages (created_at DESC);

CREATE INDEX idx_a2a_messages_role ON a2a_messages (task_id, role);

-- ============================================================================
-- Data Migration: Move inline artifacts to new table
-- ============================================================================

DO $$
DECLARE
    task_row RECORD;
    artifact_item JSONB;
    artifact_index INTEGER;
BEGIN
    -- Check if a2a_tasks table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'a2a_tasks') THEN
        FOR task_row IN 
            SELECT id, context_id, artifacts 
            FROM a2a_tasks 
            WHERE artifacts IS NOT NULL 
              AND artifacts != '[]'::jsonb
        LOOP
            artifact_index := 0;
            FOR artifact_item IN SELECT * FROM jsonb_array_elements(task_row.artifacts)
            LOOP
                INSERT INTO a2a_artifacts (
                    artifact_id,
                    task_id,
                    name,
                    description,
                    parts,
                    metadata,
                    is_complete,
                    chunk_index
                ) VALUES (
                    COALESCE(artifact_item->>'artifactId', artifact_item->>'id', gen_random_uuid()::text),
                    task_row.id,
                    artifact_item->>'name',
                    artifact_item->>'description',
                    COALESCE(artifact_item->'parts', '[]'::jsonb),
                    COALESCE(artifact_item->'metadata', '{}'::jsonb),
                    TRUE,
                    artifact_index
                )
                ON CONFLICT (task_id, artifact_id) DO NOTHING;
                
                artifact_index := artifact_index + 1;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Migrated artifacts from a2a_tasks to a2a_artifacts';
    END IF;
END $$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamps on session update
CREATE TRIGGER update_a2a_sessions_updated_at
    BEFORE UPDATE ON a2a_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update session last_activity on message insert
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_id IS NOT NULL THEN
        UPDATE a2a_sessions 
        SET last_activity_at = NOW(),
            total_messages = total_messages + 1
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_a2a_session_on_message
    AFTER INSERT ON a2a_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Update session artifact count on artifact insert
CREATE OR REPLACE FUNCTION update_session_artifact_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_id IS NOT NULL THEN
        UPDATE a2a_sessions 
        SET total_artifacts = total_artifacts + 1,
            last_activity_at = NOW()
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_a2a_session_on_artifact
    AFTER INSERT ON a2a_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_session_artifact_count();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get session with full statistics
CREATE OR REPLACE FUNCTION get_a2a_session_details(p_session_id UUID)
RETURNS TABLE (
    session_id UUID,
    context_id VARCHAR(255),
    agent_name VARCHAR(255),
    status VARCHAR(30),
    total_tasks INTEGER,
    total_messages INTEGER,
    total_artifacts INTEGER,
    created_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    duration_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.context_id,
        s.agent_name,
        s.status,
        s.total_tasks,
        s.total_messages,
        s.total_artifacts,
        s.created_at,
        s.last_activity_at,
        EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.created_at))::INTEGER
    FROM a2a_sessions s
    WHERE s.id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Get recent sessions for a user
CREATE OR REPLACE FUNCTION get_recent_a2a_sessions(
    p_user_id UUID, 
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    session_id UUID,
    context_id VARCHAR(255),
    agent_name VARCHAR(255),
    status VARCHAR(30),
    total_messages INTEGER,
    total_artifacts INTEGER,
    created_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.context_id,
        s.agent_name,
        s.status,
        s.total_messages,
        s.total_artifacts,
        s.created_at,
        s.last_activity_at
    FROM a2a_sessions s
    WHERE s.user_id = p_user_id
    ORDER BY s.last_activity_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get complete message history for a session
CREATE OR REPLACE FUNCTION get_a2a_session_messages(
    p_session_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    message_id VARCHAR(255),
    task_id VARCHAR(255),
    role VARCHAR(20),
    parts JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.message_id,
        m.task_id,
        m.role,
        m.parts,
        m.created_at
    FROM a2a_messages m
    WHERE m.session_id = p_session_id
    ORDER BY m.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get all artifacts for a session
CREATE OR REPLACE FUNCTION get_a2a_session_artifacts(p_session_id UUID)
RETURNS TABLE (
    artifact_id VARCHAR(255),
    task_id VARCHAR(255),
    name VARCHAR(500),
    parts JSONB,
    media_type VARCHAR(200),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.artifact_id,
        a.task_id,
        a.name,
        a.parts,
        a.media_type,
        a.created_at
    FROM a2a_artifacts a
    WHERE a.session_id = p_session_id
    ORDER BY a.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON
TABLE a2a_sessions IS 'A2A protocol sessions grouping related tasks and messages for review';

COMMENT ON
TABLE a2a_artifacts IS 'Normalized artifact storage for A2A task outputs with file support';

COMMENT ON
TABLE a2a_messages IS 'Complete message history for A2A sessions enabling session replay';

COMMENT ON FUNCTION get_a2a_session_details (UUID) IS 'Returns detailed statistics for an A2A session';

COMMENT ON FUNCTION get_recent_a2a_sessions (UUID, INTEGER) IS 'Returns recent A2A sessions for user history view';

COMMENT ON FUNCTION get_a2a_session_messages (UUID, INTEGER) IS 'Returns complete message history for session review';

COMMENT ON FUNCTION get_a2a_session_artifacts (UUID) IS 'Returns all artifacts produced in a session';