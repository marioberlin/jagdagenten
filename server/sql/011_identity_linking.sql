-- Migration: 011_identity_linking.sql
-- Description: Cross-channel identity linking for unified user sessions

-- ============================================================================
-- Identity Profiles Table (master identity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS identity_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    display_name VARCHAR(200),
    avatar_url TEXT,
    email VARCHAR(255),
    primary_platform VARCHAR(50), -- Preferred platform for notifications
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_profiles_email ON identity_profiles (email);

-- ============================================================================
-- Platform Links Table (linked accounts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS identity_platform_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    identity_id UUID NOT NULL REFERENCES identity_profiles (id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- telegram, slack, discord, whatsapp, etc.
    platform_user_id VARCHAR(255) NOT NULL, -- User ID on that platform
    platform_username VARCHAR(200),
    platform_display_name VARCHAR(200),
    platform_metadata JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_links_identity ON identity_platform_links (identity_id);

CREATE INDEX IF NOT EXISTS idx_platform_links_platform ON identity_platform_links (platform);

CREATE INDEX IF NOT EXISTS idx_platform_links_user ON identity_platform_links (platform_user_id);

-- ============================================================================
-- Link Tokens Table (for linking process)
-- ============================================================================

CREATE TABLE IF NOT EXISTS identity_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    identity_id UUID NOT NULL REFERENCES identity_profiles (id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    target_platform VARCHAR(50) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_tokens_token ON identity_link_tokens (token);

CREATE INDEX IF NOT EXISTS idx_link_tokens_identity ON identity_link_tokens (identity_id);

-- ============================================================================
-- Gateway Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS gateway_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_key VARCHAR(255) NOT NULL UNIQUE, -- Composite key for lookup
    identity_id UUID REFERENCES identity_profiles(id) ON DELETE SET NULL,
    channel_type VARCHAR(50) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    thread_id VARCHAR(255),
    sender_id VARCHAR(255) NOT NULL,

-- Session state
is_group BOOLEAN DEFAULT false,
activation_mode VARCHAR(20) DEFAULT 'mention',
thinking_level VARCHAR(20) DEFAULT 'medium',
agent_id VARCHAR(255),

-- Token tracking
input_tokens INTEGER DEFAULT 0,
output_tokens INTEGER DEFAULT 0,
context_tokens INTEGER DEFAULT 0,

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_key ON gateway_sessions (session_key);

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_identity ON gateway_sessions (identity_id);

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_channel ON gateway_sessions (channel_type, channel_id);

-- ============================================================================
-- Channel Configurations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS gateway_channel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    channel_type VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}', -- Encrypted in production
    webhook_path VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_configs_type ON gateway_channel_configs (channel_type);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get identity by platform user
CREATE OR REPLACE FUNCTION get_identity_by_platform(
    p_platform VARCHAR(50),
    p_platform_user_id VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
BEGIN
    SELECT identity_id INTO v_identity_id
    FROM identity_platform_links
    WHERE platform = p_platform AND platform_user_id = p_platform_user_id;
    
    RETURN v_identity_id;
END;
$$ LANGUAGE plpgsql;

-- Get all linked platforms for an identity
CREATE OR REPLACE FUNCTION get_linked_platforms(p_identity_id UUID)
RETURNS TABLE (
    platform VARCHAR(50),
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(200),
    verified BOOLEAN,
    last_active_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ipl.platform,
        ipl.platform_user_id,
        ipl.platform_username,
        ipl.verified,
        ipl.last_active_at
    FROM identity_platform_links ipl
    WHERE ipl.identity_id = p_identity_id
    ORDER BY ipl.last_active_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create or get identity for platform user
CREATE OR REPLACE FUNCTION ensure_identity(
    p_platform VARCHAR(50),
    p_platform_user_id VARCHAR(255),
    p_platform_username VARCHAR(200) DEFAULT NULL,
    p_platform_display_name VARCHAR(200) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
    v_existing_link_id UUID;
BEGIN
    -- Check if link already exists
    SELECT identity_id, id INTO v_identity_id, v_existing_link_id
    FROM identity_platform_links
    WHERE platform = p_platform AND platform_user_id = p_platform_user_id;
    
    IF v_identity_id IS NOT NULL THEN
        -- Update last active
        UPDATE identity_platform_links
        SET last_active_at = NOW(),
            platform_username = COALESCE(p_platform_username, platform_username),
            platform_display_name = COALESCE(p_platform_display_name, platform_display_name)
        WHERE id = v_existing_link_id;
        
        RETURN v_identity_id;
    END IF;
    
    -- Create new identity
    INSERT INTO identity_profiles (display_name, primary_platform)
    VALUES (COALESCE(p_platform_display_name, p_platform_username), p_platform)
    RETURNING id INTO v_identity_id;
    
    -- Create platform link
    INSERT INTO identity_platform_links (
        identity_id, platform, platform_user_id, platform_username, platform_display_name
    ) VALUES (
        v_identity_id, p_platform, p_platform_user_id, p_platform_username, p_platform_display_name
    );
    
    RETURN v_identity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_identity_profiles_updated ON identity_profiles;

CREATE TRIGGER trigger_identity_profiles_updated
BEFORE UPDATE ON identity_profiles
FOR EACH ROW EXECUTE FUNCTION update_identity_updated_at();

DROP TRIGGER IF EXISTS trigger_channel_configs_updated ON gateway_channel_configs;

CREATE TRIGGER trigger_channel_configs_updated
BEFORE UPDATE ON gateway_channel_configs
FOR EACH ROW EXECUTE FUNCTION update_identity_updated_at();