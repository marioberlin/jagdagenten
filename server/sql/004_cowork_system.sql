-- Migration: 004_cowork_system.sql
-- Description: Cowork deep work mode - sessions, subtasks, artifacts, notifications
-- Author: LiquidCrypto System
-- Date: 2026-01-16

-- ============================================================================
-- Cowork Sessions Table
-- ============================================================================
-- Main table for tracking deep work sessions

CREATE TABLE IF NOT EXISTS cowork_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session identification
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- State management
    status VARCHAR(30) NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'awaiting_approval', 'executing', 'paused', 'merging', 'completed', 'failed', 'cancelled')),
    phase VARCHAR(30) NOT NULL DEFAULT 'task_analysis'
        CHECK (phase IN ('task_analysis', 'plan_generation', 'user_review', 'agent_dispatch', 'parallel_execution', 'result_aggregation', 'output_delivery')),

    -- Progress tracking
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    progress NUMERIC(5,2) DEFAULT 0, -- 0-100 percentage

    -- Plan (stored as JSONB for flexibility)
    plan JSONB,
    /*
        {
            "id": "...",
            "taskType": "code_generation",
            "complexity": "moderate",
            "estimatedDuration": "15 minutes",
            "estimatedTurns": 10,
            "estimatedCost": 0.50,
            "filesAffected": 5,
            "steps": [...],
            "approach": "...",
            "risks": [...],
            "alternatives": [...]
        }
    */

    -- Workspace configuration
    workspace_config JSONB DEFAULT '{}'::jsonb,
    /*
        {
            "inputPaths": ["./src"],
            "outputPath": "./output",
            "tempPath": "/tmp/cowork",
            "permissions": { "read": true, "write": true, "delete": false, "execute": false, "network": true },
            "allowedExtensions": [".ts", ".tsx", ".js"],
            "blockedExtensions": [".exe", ".sh"],
            "maxFileSize": 10485760,
            "syncMode": "auto"
        }
    */

    -- Context items (files, tools, websites attached)
    context JSONB DEFAULT '[]'::jsonb,
    /*
        [
            { "type": "file", "name": "config.ts", "path": "./src/config.ts" },
            { "type": "website", "name": "API Docs", "url": "https://..." }
        ]
    */

    -- Cost tracking
    tokens_used INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10,4) DEFAULT 0,

    -- Agent info
    selected_agent JSONB,
    /*
        { "type": "local" }
        OR
        { "type": "remote", "url": "...", "card": { "name": "...", "description": "..." } }
    */
    current_thought TEXT,  -- Latest agent thought for display

    -- Sandbox reference (links to sandbox system)
    active_sandbox_id UUID REFERENCES sandbox_sessions(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Duration tracking (in seconds)
    elapsed_time INTEGER DEFAULT 0
);

CREATE INDEX idx_cowork_sessions_user ON cowork_sessions(user_id);
CREATE INDEX idx_cowork_sessions_status ON cowork_sessions(status);
CREATE INDEX idx_cowork_sessions_created ON cowork_sessions(created_at DESC);
CREATE INDEX idx_cowork_sessions_active ON cowork_sessions(user_id, status)
    WHERE status IN ('planning', 'awaiting_approval', 'executing', 'paused');
CREATE INDEX idx_cowork_sessions_sandbox ON cowork_sessions(active_sandbox_id)
    WHERE active_sandbox_id IS NOT NULL;

-- ============================================================================
-- Cowork Subtasks Table
-- ============================================================================
-- Individual subtasks within a session

CREATE TABLE IF NOT EXISTS cowork_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cowork_sessions(id) ON DELETE CASCADE,
    plan_step_id VARCHAR(100),  -- References plan step

    -- Task definition
    task_order INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- State
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'waiting_dependency', 'in_progress', 'completed', 'failed', 'skipped')),
    progress NUMERIC(5,2) DEFAULT 0,  -- 0-100

    -- Agent assignment
    agent_id VARCHAR(100),

    -- Result
    result JSONB,
    /*
        {
            "success": true,
            "output": "...",
            "artifacts": ["artifact_id_1"],
            "filesModified": ["./src/file.ts"],
            "tokensUsed": 1500,
            "duration": 45,
            "summary": "..."
        }
    */
    error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_cowork_subtasks_session ON cowork_subtasks(session_id);
CREATE INDEX idx_cowork_subtasks_status ON cowork_subtasks(session_id, status);
CREATE INDEX idx_cowork_subtasks_order ON cowork_subtasks(session_id, task_order);
CREATE INDEX idx_cowork_subtasks_agent ON cowork_subtasks(agent_id)
    WHERE agent_id IS NOT NULL;

-- ============================================================================
-- Cowork Artifacts Table
-- ============================================================================
-- Output artifacts produced during sessions

CREATE TABLE IF NOT EXISTS cowork_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cowork_sessions(id) ON DELETE CASCADE,
    subtask_id UUID REFERENCES cowork_subtasks(id) ON DELETE SET NULL,

    -- Artifact identification
    artifact_type VARCHAR(50) NOT NULL
        CHECK (artifact_type IN ('file', 'document', 'spreadsheet', 'presentation', 'image', 'code', 'data', 'report', 'folder')),
    name VARCHAR(500) NOT NULL,

    -- File details
    file_path TEXT,
    mime_type VARCHAR(200),
    size_bytes BIGINT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    /*
        {
            "language": "typescript",
            "lineCount": 150,
            "functions": ["main", "helper"],
            "dependencies": ["lodash"]
        }
    */

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cowork_artifacts_session ON cowork_artifacts(session_id);
CREATE INDEX idx_cowork_artifacts_type ON cowork_artifacts(artifact_type);
CREATE INDEX idx_cowork_artifacts_subtask ON cowork_artifacts(subtask_id)
    WHERE subtask_id IS NOT NULL;

-- ============================================================================
-- Cowork File Operations Table
-- ============================================================================
-- Track all file operations performed during sessions

CREATE TABLE IF NOT EXISTS cowork_file_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cowork_sessions(id) ON DELETE CASCADE,

    -- Operation details
    operation VARCHAR(20) NOT NULL
        CHECK (operation IN ('create', 'read', 'update', 'delete', 'move', 'copy')),
    source_path TEXT NOT NULL,
    target_path TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_cowork_file_ops_session ON cowork_file_operations(session_id);
CREATE INDEX idx_cowork_file_ops_status ON cowork_file_operations(status);

-- ============================================================================
-- Cowork Agents Table
-- ============================================================================
-- Active agent instances within sessions

CREATE TABLE IF NOT EXISTS cowork_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cowork_sessions(id) ON DELETE CASCADE,
    subtask_id UUID REFERENCES cowork_subtasks(id) ON DELETE SET NULL,

    -- Agent identification
    name VARCHAR(200) NOT NULL,
    agent_type VARCHAR(50)
        CHECK (agent_type IN ('orchestrator', 'data_processor', 'document_writer', 'code_generator', 'file_organizer', 'researcher', 'formatter')),

    -- State
    status VARCHAR(30) NOT NULL DEFAULT 'initializing'
        CHECK (status IN ('initializing', 'thinking', 'working', 'waiting', 'completed', 'failed', 'terminated')),
    progress NUMERIC(5,2) DEFAULT 0,
    current_thought TEXT,

    -- Container reference (if running in isolated environment)
    container_id VARCHAR(100),

    -- Timestamps
    spawned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_cowork_agents_session ON cowork_agents(session_id);
CREATE INDEX idx_cowork_agents_status ON cowork_agents(status);
CREATE INDEX idx_cowork_agents_active ON cowork_agents(session_id, status)
    WHERE status IN ('initializing', 'thinking', 'working', 'waiting');

-- ============================================================================
-- Cowork Notifications Table
-- ============================================================================
-- Persistent notifications for task completion, errors, etc.

CREATE TABLE IF NOT EXISTS cowork_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES cowork_sessions(id) ON DELETE CASCADE,

    -- Notification content
    level VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (level IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,

    -- State
    read BOOLEAN NOT NULL DEFAULT FALSE,

    -- Action (optional CTA)
    action JSONB,
    /*
        { "label": "View Results", "type": "view_session" }
        { "label": "Retry", "type": "retry" }
        { "label": "Dismiss", "type": "dismiss" }
    */

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_cowork_notifications_user ON cowork_notifications(user_id);
CREATE INDEX idx_cowork_notifications_unread ON cowork_notifications(user_id, read)
    WHERE read = FALSE;
CREATE INDEX idx_cowork_notifications_session ON cowork_notifications(session_id)
    WHERE session_id IS NOT NULL;
CREATE INDEX idx_cowork_notifications_created ON cowork_notifications(created_at DESC);

-- ============================================================================
-- Task Queue Priority Table
-- ============================================================================
-- Track task priorities for queue ordering

CREATE TABLE IF NOT EXISTS cowork_task_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cowork_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Queue position and priority
    priority INTEGER NOT NULL DEFAULT 5,  -- 1=critical, 2=high, 5=normal, 10=low
    queue_position INTEGER,  -- Explicit position for manual ordering

    -- State
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'active', 'paused', 'completed', 'failed', 'cancelled')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_cowork_queue_user ON cowork_task_queue(user_id);
CREATE INDEX idx_cowork_queue_status ON cowork_task_queue(status);
CREATE INDEX idx_cowork_queue_priority ON cowork_task_queue(user_id, priority, queue_position)
    WHERE status IN ('queued', 'paused');
CREATE INDEX idx_cowork_queue_active ON cowork_task_queue(user_id, status)
    WHERE status = 'active';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamps on session update
CREATE TRIGGER update_cowork_sessions_updated_at
    BEFORE UPDATE ON cowork_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update agent last_activity_at
CREATE OR REPLACE FUNCTION update_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cowork_agents_activity
    BEFORE UPDATE ON cowork_agents
    FOR EACH ROW
    WHEN (OLD.current_thought IS DISTINCT FROM NEW.current_thought OR OLD.progress IS DISTINCT FROM NEW.progress)
    EXECUTE FUNCTION update_agent_activity();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get session summary statistics
CREATE OR REPLACE FUNCTION get_cowork_session_summary(p_session_id UUID)
RETURNS TABLE (
    total_subtasks BIGINT,
    completed_subtasks BIGINT,
    failed_subtasks BIGINT,
    pending_subtasks BIGINT,
    total_artifacts BIGINT,
    active_agents BIGINT,
    total_tokens INTEGER,
    elapsed_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM cowork_subtasks WHERE session_id = p_session_id)::BIGINT,
        (SELECT COUNT(*) FROM cowork_subtasks WHERE session_id = p_session_id AND status = 'completed')::BIGINT,
        (SELECT COUNT(*) FROM cowork_subtasks WHERE session_id = p_session_id AND status = 'failed')::BIGINT,
        (SELECT COUNT(*) FROM cowork_subtasks WHERE session_id = p_session_id AND status IN ('pending', 'waiting_dependency'))::BIGINT,
        (SELECT COUNT(*) FROM cowork_artifacts WHERE session_id = p_session_id)::BIGINT,
        (SELECT COUNT(*) FROM cowork_agents WHERE session_id = p_session_id AND status IN ('initializing', 'thinking', 'working', 'waiting'))::BIGINT,
        COALESCE((SELECT tokens_used FROM cowork_sessions WHERE id = p_session_id), 0),
        COALESCE((SELECT elapsed_time FROM cowork_sessions WHERE id = p_session_id), 0);
END;
$$ LANGUAGE plpgsql;

-- Get queue statistics for a user
CREATE OR REPLACE FUNCTION get_cowork_queue_stats(p_user_id UUID)
RETURNS TABLE (
    queued_count BIGINT,
    active_count BIGINT,
    paused_count BIGINT,
    completed_today BIGINT,
    failed_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM cowork_task_queue WHERE user_id = p_user_id AND status = 'queued')::BIGINT,
        (SELECT COUNT(*) FROM cowork_task_queue WHERE user_id = p_user_id AND status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM cowork_task_queue WHERE user_id = p_user_id AND status = 'paused')::BIGINT,
        (SELECT COUNT(*) FROM cowork_task_queue WHERE user_id = p_user_id AND status = 'completed' AND completed_at >= CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM cowork_task_queue WHERE user_id = p_user_id AND status = 'failed' AND completed_at >= CURRENT_DATE)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Get recent sessions for history sidebar
CREATE OR REPLACE FUNCTION get_recent_cowork_sessions(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    description TEXT,
    status VARCHAR(30),
    artifact_count BIGINT,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.title,
        s.description,
        s.status,
        (SELECT COUNT(*) FROM cowork_artifacts WHERE session_id = s.id)::BIGINT,
        s.created_at,
        s.completed_at
    FROM cowork_sessions s
    WHERE s.user_id = p_user_id
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_user_id UUID, p_keep_count INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM cowork_notifications
        WHERE user_id = p_user_id
    )
    DELETE FROM cowork_notifications
    WHERE id IN (SELECT id FROM ranked WHERE rn > p_keep_count);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE cowork_sessions IS
    'Main sessions for Cowork deep work mode with plan tracking and cost estimation';

COMMENT ON TABLE cowork_subtasks IS
    'Individual subtasks within Cowork sessions with progress and result tracking';

COMMENT ON TABLE cowork_artifacts IS
    'Output artifacts (files, documents, code) produced during Cowork sessions';

COMMENT ON TABLE cowork_file_operations IS
    'Audit trail of all file operations performed during Cowork sessions';

COMMENT ON TABLE cowork_agents IS
    'Active agent instances running within Cowork sessions';

COMMENT ON TABLE cowork_notifications IS
    'User notifications for task completion, errors, and other events';

COMMENT ON TABLE cowork_task_queue IS
    'Priority queue for managing multiple concurrent Cowork tasks';

COMMENT ON FUNCTION get_cowork_session_summary(UUID) IS
    'Returns summary statistics for a Cowork session';

COMMENT ON FUNCTION get_cowork_queue_stats(UUID) IS
    'Returns queue statistics for a user including counts by status';

COMMENT ON FUNCTION get_recent_cowork_sessions(UUID, INTEGER) IS
    'Returns recent Cowork sessions for history sidebar display';

COMMENT ON FUNCTION cleanup_old_notifications(UUID, INTEGER) IS
    'Removes old notifications keeping only the most recent N per user';
