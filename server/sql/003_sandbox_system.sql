-- Migration: 003_sandbox_system.sql
-- Description: Isolated staging/sandbox system for safe agent execution
-- Author: LiquidCrypto System
-- Date: 2026-01-16

-- ============================================================================
-- Sandbox Sessions Table
-- ============================================================================
-- Tracks the lifecycle of isolated work environments

CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cowork_session_id TEXT,  -- Links to cowork session (string ID format)

    -- Source information
    source_path TEXT NOT NULL,
    source_hash TEXT NOT NULL,  -- Hash of file manifest at creation

    -- Sandbox paths
    sandbox_root TEXT NOT NULL,  -- /tmp/liquid-sandboxes/session_[id]
    work_path TEXT NOT NULL,     -- sandbox_root/work
    baseline_path TEXT NOT NULL, -- sandbox_root/baseline

    -- State management
    status TEXT NOT NULL DEFAULT 'creating'
        CHECK (status IN ('creating', 'active', 'merging', 'completed', 'failed', 'expired')),

    -- Configuration (stored as JSONB)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
        {
            "excludePatterns": ["node_modules", ".git", "dist"],
            "maxSizeBytes": 524288000,
            "secretsHandling": "exclude",  -- or "inject_env" or "readonly_mount"
            "watchSource": true,
            "expirationHours": 24
        }
    */

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Metrics
    files_copied INTEGER,
    total_size_bytes BIGINT,
    copy_duration_ms INTEGER
);

CREATE INDEX idx_sandbox_sessions_user ON sandbox_sessions(user_id);
CREATE INDEX idx_sandbox_sessions_status ON sandbox_sessions(status);
CREATE INDEX idx_sandbox_sessions_cowork ON sandbox_sessions(cowork_session_id);
CREATE INDEX idx_sandbox_sessions_expires ON sandbox_sessions(expires_at)
    WHERE status = 'active';

-- ============================================================================
-- Sandbox Files Table
-- ============================================================================
-- Track individual file states for granular merge control

CREATE TABLE IF NOT EXISTS sandbox_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- File identification
    relative_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'file'
        CHECK (file_type IN ('file', 'directory', 'symlink')),

    -- State tracking
    baseline_hash TEXT,      -- Hash at sandbox creation (null if new file)
    current_hash TEXT,       -- Hash in work directory
    source_hash TEXT,        -- Current hash in original source (for conflict detection)

    -- Change classification
    change_type TEXT DEFAULT 'unchanged'
        CHECK (change_type IN ('added', 'modified', 'deleted', 'renamed', 'unchanged')),

    -- Merge status
    merge_status TEXT DEFAULT 'pending'
        CHECK (merge_status IN ('pending', 'approved', 'rejected', 'conflicted', 'applied')),
    conflict_resolution TEXT,  -- User's resolution choice if conflicted

    -- Metadata
    size_bytes BIGINT,
    mode INTEGER,  -- Unix file permissions
    modified_at TIMESTAMPTZ,

    UNIQUE(sandbox_id, relative_path)
);

CREATE INDEX idx_sandbox_files_sandbox ON sandbox_files(sandbox_id);
CREATE INDEX idx_sandbox_files_changed ON sandbox_files(sandbox_id, change_type)
    WHERE change_type != 'unchanged';
CREATE INDEX idx_sandbox_files_status ON sandbox_files(sandbox_id, merge_status);

-- ============================================================================
-- Sandbox Audit Log Table
-- ============================================================================
-- Full audit trail for compliance and debugging

CREATE TABLE IF NOT EXISTS sandbox_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Event information
    event_type TEXT NOT NULL,
    /*
        Event types:
        - 'created': Sandbox created
        - 'file_modified': File modified in sandbox
        - 'file_deleted': File deleted in sandbox
        - 'file_added': New file added in sandbox
        - 'conflict_detected': Source changed while sandbox active
        - 'merge_started': User started merge process
        - 'file_applied': File change applied to source
        - 'file_rejected': File change rejected by user
        - 'rollback_initiated': Rollback to backup started
        - 'expired': Sandbox expired automatically
        - 'cleaned_up': Sandbox files cleaned up
    */

    -- Context
    file_path TEXT,
    details JSONB,
    /*
        For file_modified: { "before_hash": "...", "after_hash": "...", "diff_summary": "..." }
        For conflict_detected: { "source_changed": true, "work_changed": true }
        For file_applied: { "backup_id": "..." }
    */

    -- Attribution
    actor TEXT NOT NULL DEFAULT 'system',  -- 'system', 'agent', 'user'
    agent_task_id TEXT,  -- Links to cowork sub-task if applicable

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sandbox_audit_sandbox ON sandbox_audit_log(sandbox_id);
CREATE INDEX idx_sandbox_audit_type ON sandbox_audit_log(event_type);
CREATE INDEX idx_sandbox_audit_timestamp ON sandbox_audit_log(created_at DESC);
CREATE INDEX idx_sandbox_audit_file ON sandbox_audit_log(sandbox_id, file_path)
    WHERE file_path IS NOT NULL;

-- ============================================================================
-- Sandbox Backups Table
-- ============================================================================
-- Backup snapshots for rollback capability

CREATE TABLE IF NOT EXISTS sandbox_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Backup location
    backup_path TEXT NOT NULL,  -- Path to backup archive or directory
    backup_type TEXT NOT NULL
        CHECK (backup_type IN ('pre_merge', 'checkpoint', 'rollback_point')),

    -- Contents
    files_included TEXT[] NOT NULL DEFAULT '{}',  -- Array of relative paths
    total_size_bytes BIGINT NOT NULL DEFAULT 0,

    -- State
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'restored', 'expired')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sandbox_backups_sandbox ON sandbox_backups(sandbox_id);
CREATE INDEX idx_sandbox_backups_status ON sandbox_backups(status);
CREATE INDEX idx_sandbox_backups_expires ON sandbox_backups(expires_at)
    WHERE status = 'active';

-- ============================================================================
-- Add sandbox reference to cowork sessions (if cowork_sessions table exists)
-- ============================================================================
-- Note: This is optional and depends on whether cowork_sessions table exists
-- The cowork module currently uses in-memory storage

-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cowork_sessions') THEN
--         ALTER TABLE cowork_sessions
--         ADD COLUMN IF NOT EXISTS active_sandbox_id UUID REFERENCES sandbox_sessions(id);
--     END IF;
-- END $$;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get sandbox summary
CREATE OR REPLACE FUNCTION get_sandbox_summary(p_sandbox_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    added_files BIGINT,
    modified_files BIGINT,
    deleted_files BIGINT,
    conflicted_files BIGINT,
    pending_files BIGINT,
    applied_files BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_files,
        COUNT(*) FILTER (WHERE change_type = 'added')::BIGINT as added_files,
        COUNT(*) FILTER (WHERE change_type = 'modified')::BIGINT as modified_files,
        COUNT(*) FILTER (WHERE change_type = 'deleted')::BIGINT as deleted_files,
        COUNT(*) FILTER (WHERE merge_status = 'conflicted')::BIGINT as conflicted_files,
        COUNT(*) FILTER (WHERE merge_status = 'pending' AND change_type != 'unchanged')::BIGINT as pending_files,
        COUNT(*) FILTER (WHERE merge_status = 'applied')::BIGINT as applied_files
    FROM sandbox_files
    WHERE sandbox_id = p_sandbox_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sandboxes (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sandboxes()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE sandbox_sessions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW();

    GET DIAGNOSTICS cleaned_count = ROW_COUNT;

    -- Log cleanup in audit
    INSERT INTO sandbox_audit_log (sandbox_id, event_type, actor, details)
    SELECT id, 'expired', 'system', jsonb_build_object('reason', 'auto_expiry')
    FROM sandbox_sessions
    WHERE status = 'expired'
      AND expires_at < NOW()
      AND NOT EXISTS (
          SELECT 1 FROM sandbox_audit_log
          WHERE sandbox_audit_log.sandbox_id = sandbox_sessions.id
            AND event_type = 'expired'
      );

    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE sandbox_sessions IS
    'Isolated work environments for safe agent execution with full audit trails';

COMMENT ON TABLE sandbox_files IS
    'Individual file tracking within sandboxes for granular merge control';

COMMENT ON TABLE sandbox_audit_log IS
    'Complete audit trail of all sandbox operations for compliance and debugging';

COMMENT ON TABLE sandbox_backups IS
    'Backup snapshots enabling rollback after merge operations';

COMMENT ON FUNCTION get_sandbox_summary(UUID) IS
    'Returns change summary statistics for a sandbox session';

COMMENT ON FUNCTION cleanup_expired_sandboxes() IS
    'Marks expired sandboxes and logs expiration events - call via cron';
