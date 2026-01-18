-- Migration: 004_sandbox_container_integration.sql
-- Description: Add container attachment and A2A task tracking to sandbox sessions
-- Author: LiquidCrypto System
-- Date: 2026-01-18

-- ============================================================================
-- Extend Sandbox Sessions for Container Integration
-- ============================================================================

-- Add container attachment columns
ALTER TABLE sandbox_sessions
ADD COLUMN IF NOT EXISTS container_id TEXT,
ADD COLUMN IF NOT EXISTS container_state TEXT DEFAULT 'pending' CHECK (
    container_state IS NULL
    OR container_state IN (
        'pending',
        'attached',
        'detached',
        'error'
    )
),
ADD COLUMN IF NOT EXISTS container_attached_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS container_host TEXT,
ADD COLUMN IF NOT EXISTS container_port INTEGER;

-- Add A2A task tracking columns
ALTER TABLE sandbox_sessions
ADD COLUMN IF NOT EXISTS last_a2a_task_id TEXT,
ADD COLUMN IF NOT EXISTS last_a2a_task_status TEXT;

-- Update status check constraint to include 'pending_resume'
ALTER TABLE sandbox_sessions
DROP CONSTRAINT IF EXISTS sandbox_sessions_status_check;

ALTER TABLE sandbox_sessions
ADD CONSTRAINT sandbox_sessions_status_check CHECK (
    status IN (
        'creating',
        'active',
        'merging',
        'completed',
        'failed',
        'expired',
        'pending_resume'
    )
);

-- Create index for container lookups
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_container ON sandbox_sessions (container_id)
WHERE
    container_id IS NOT NULL;

-- Create index for pending resume sessions
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_pending_resume ON sandbox_sessions (user_id, status)
WHERE
    status = 'pending_resume';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN sandbox_sessions.container_id IS 'Docker container ID attached to this sandbox for agent execution';

COMMENT ON COLUMN sandbox_sessions.container_state IS 'Current state of container attachment: pending, attached, detached, error';

COMMENT ON COLUMN sandbox_sessions.container_attached_at IS 'Timestamp when container was attached to sandbox';

COMMENT ON COLUMN sandbox_sessions.container_host IS 'Hostname where container is running (for remote scenarios)';

COMMENT ON COLUMN sandbox_sessions.container_port IS 'Port where container runtime API is exposed';

COMMENT ON COLUMN sandbox_sessions.last_a2a_task_id IS 'ID of the last A2A task executed in this sandbox';

COMMENT ON COLUMN sandbox_sessions.last_a2a_task_status IS 'Status of the last A2A task (completed, failed, running, etc.)';