-- A2A Video Rendering System
-- Migration: 013_a2a_video_system
-- Description: Tables for A2A video rendering infrastructure

-- ============================================================================
-- Composition Registry
-- Stores video composition templates (Remotion-compatible)
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    fps NUMERIC(5,2) NOT NULL,
    duration_in_frames INTEGER NOT NULL,
    default_props JSONB DEFAULT '{}',
    schema JSONB,  -- Zod schema definition for input validation
    source_code TEXT,  -- Scene definition code
    owner_type VARCHAR(20) NOT NULL,  -- app, agent, user
    owner_id VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_compositions_owner ON a2a_video_compositions(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_compositions_active ON a2a_video_compositions(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_a2a_video_compositions_name ON a2a_video_compositions(name);

-- ============================================================================
-- Render Jobs
-- Tracks video render requests and their status
-- ============================================================================

CREATE TYPE a2a_video_render_status AS ENUM (
    'queued',
    'initializing',
    'rendering',
    'encoding',
    'uploading',
    'completed',
    'failed',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS a2a_video_renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id VARCHAR(255) UNIQUE NOT NULL,
    composition_id UUID REFERENCES a2a_video_compositions(id) ON DELETE SET NULL,
    input_props JSONB DEFAULT '{}',
    output_format VARCHAR(20) NOT NULL,  -- mp4, webm, gif, mov, png-sequence
    codec VARCHAR(20),  -- h264, h265, vp8, vp9, prores
    quality_settings JSONB,  -- crf, bitrate settings
    resolution JSONB,  -- width, height, scale
    frame_range INT4RANGE,  -- [start, end)
    status a2a_video_render_status NOT NULL DEFAULT 'queued',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    output_path TEXT,
    output_url TEXT,
    file_size_bytes BIGINT,
    duration_seconds NUMERIC(10,3),
    error TEXT,
    container_id VARCHAR(255),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    webhook_url TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_renders_status ON a2a_video_renders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_a2a_video_renders_composition ON a2a_video_renders(composition_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_renders_render_id ON a2a_video_renders(render_id);

-- ============================================================================
-- Asset Storage
-- Stores uploaded assets (images, videos, audio, fonts, lottie)
-- ============================================================================

CREATE TYPE a2a_video_asset_type AS ENUM (
    'image',
    'video',
    'audio',
    'font',
    'lottie',
    'data'
);

CREATE TABLE IF NOT EXISTS a2a_video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type a2a_video_asset_type NOT NULL,
    mime_type VARCHAR(100),
    file_path TEXT,
    public_url TEXT,
    file_size_bytes BIGINT,
    dimensions JSONB,  -- { width, height } for images/videos
    duration_seconds NUMERIC(10,3),  -- for audio/video
    metadata JSONB DEFAULT '{}',
    owner_type VARCHAR(20) NOT NULL,  -- app, agent, user
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_assets_owner ON a2a_video_assets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_assets_type ON a2a_video_assets(type);
CREATE INDEX IF NOT EXISTS idx_a2a_video_assets_asset_id ON a2a_video_assets(asset_id);

-- ============================================================================
-- Render Logs
-- Debugging and monitoring logs for renders
-- ============================================================================

CREATE TYPE a2a_video_log_level AS ENUM ('debug', 'info', 'warn', 'error');

CREATE TABLE IF NOT EXISTS a2a_video_render_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id UUID REFERENCES a2a_video_renders(id) ON DELETE CASCADE,
    level a2a_video_log_level NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_render_logs_render ON a2a_video_render_logs(render_id, timestamp DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_a2a_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_a2a_video_compositions_updated_at
    BEFORE UPDATE ON a2a_video_compositions
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

CREATE TRIGGER trigger_a2a_video_renders_updated_at
    BEFORE UPDATE ON a2a_video_renders
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

CREATE TRIGGER trigger_a2a_video_assets_updated_at
    BEFORE UPDATE ON a2a_video_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

-- ============================================================================
-- Sample Composition (for testing)
-- ============================================================================

INSERT INTO a2a_video_compositions (
    composition_id,
    name,
    description,
    width,
    height,
    fps,
    duration_in_frames,
    default_props,
    owner_type,
    owner_id
) VALUES (
    'test-composition',
    'Test Composition',
    'A simple test composition for verification',
    1920,
    1080,
    30,
    150,  -- 5 seconds at 30fps
    '{"title": "Hello A2A Video", "backgroundColor": "#000000"}'::jsonb,
    'system',
    'liquid-motion'
) ON CONFLICT (composition_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE a2a_video_compositions IS 'Video composition templates (Remotion-compatible)';
COMMENT ON TABLE a2a_video_renders IS 'Video render job tracking';
COMMENT ON TABLE a2a_video_assets IS 'Uploaded media assets';
COMMENT ON TABLE a2a_video_render_logs IS 'Render debugging logs';

COMMENT ON COLUMN a2a_video_compositions.schema IS 'Zod schema for validating input props';
COMMENT ON COLUMN a2a_video_compositions.source_code IS 'Scene definition code (optional)';
COMMENT ON COLUMN a2a_video_renders.frame_range IS 'Frame range to render [start, end)';
COMMENT ON COLUMN a2a_video_renders.quality_settings IS 'CRF, bitrate, preset settings';
