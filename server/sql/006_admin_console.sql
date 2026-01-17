-- Migration: 006_admin_console.sql
-- Description: Tables for A2A Admin Console (agent keys)
-- Author: LiquidCrypto System
-- Date: 2026-01-17

-- ============================================================================
-- A2A Agent Keys Table
-- ============================================================================
-- Stores connected remote A2A agents for the console

CREATE TABLE IF NOT EXISTS a2a_agent_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    agent_card JSONB, -- Cached agent card data
    status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('up', 'down', 'unknown')),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_a2a_agent_keys_status ON a2a_agent_keys (status);

CREATE INDEX idx_a2a_agent_keys_url ON a2a_agent_keys (url);

-- Trigger for updated_at
CREATE TRIGGER update_a2a_agent_keys_updated_at
    BEFORE UPDATE ON a2a_agent_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON
TABLE a2a_agent_keys IS 'Connected remote A2A agents for console monitoring';