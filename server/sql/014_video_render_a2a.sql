-- Video Render A2A Integration
-- Migration: 014_video_render_a2a
-- Description: A2A video rendering task and artifact management

-- ============================================================================
-- A2A Task to Render Job Mapping
-- Links A2A tasks with video render jobs for status synchronization
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,  -- References a2a_tasks (managed by A2A adapter)
    render_id UUID,  -- References a2a_video_renders when available
    composition_id UUID,  -- References a2a_video_compositions when available
    context_id VARCHAR(255),  -- A2A context for task grouping
    skill_id VARCHAR(100),  -- render_video, preview_frame, etc.
    input_text TEXT,  -- Original natural language input
    parsed_intent JSONB,  -- Parsed intent from router
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    artifacts JSONB DEFAULT '[]',  -- A2A artifact references
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_tasks_task ON a2a_video_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_tasks_render ON a2a_video_tasks(render_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_tasks_context ON a2a_video_tasks(context_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_tasks_status ON a2a_video_tasks(status);

-- ============================================================================
-- Frame Preview Cache
-- Stores rendered frames for preview and thumbnail generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id UUID,  -- References a2a_video_renders when available
    composition_id UUID,  -- References a2a_video_compositions when available
    frame_number INTEGER NOT NULL,
    image_format VARCHAR(10) NOT NULL DEFAULT 'png',  -- png, jpeg, webp
    image_data BYTEA,  -- Frame image bytes (for small previews)
    image_uri TEXT,  -- URI for larger frames stored externally
    width INTEGER,
    height INTEGER,
    file_size_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(composition_id, frame_number)
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_frames_render ON a2a_video_frames(render_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_frames_composition ON a2a_video_frames(composition_id, frame_number);

-- ============================================================================
-- Video Artifacts
-- Stores output videos and their metadata for A2A artifact delivery
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id VARCHAR(255) UNIQUE NOT NULL,  -- A2A artifact ID
    task_id UUID,  -- References a2a_video_tasks(id) when available
    render_id UUID,  -- References a2a_video_renders when available
    artifact_type VARCHAR(50) NOT NULL,  -- video, frame, progress, composition
    name VARCHAR(255),
    description TEXT,
    mime_type VARCHAR(100),
    file_uri TEXT,  -- liquid://artifacts/... or https://...
    file_bytes BYTEA,  -- For small artifacts only
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}',
    is_final BOOLEAN DEFAULT false,  -- True for completed render output
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_artifacts_task ON a2a_video_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_artifacts_render ON a2a_video_artifacts(render_id);
CREATE INDEX IF NOT EXISTS idx_a2a_video_artifacts_type ON a2a_video_artifacts(artifact_type);

-- ============================================================================
-- Effect Presets
-- Stores reusable animation effect configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effect_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- transition, filter, motion, text
    effect_type VARCHAR(100) NOT NULL,  -- fade, blur, slide, zoom, spring, etc.
    parameters JSONB NOT NULL DEFAULT '{}',
    preview_uri TEXT,  -- Thumbnail or animated preview
    owner_type VARCHAR(20) NOT NULL DEFAULT 'system',
    owner_id VARCHAR(255) NOT NULL DEFAULT 'liquid-motion',
    is_builtin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_effects_category ON a2a_video_effects(category);
CREATE INDEX IF NOT EXISTS idx_a2a_video_effects_type ON a2a_video_effects(effect_type);
CREATE INDEX IF NOT EXISTS idx_a2a_video_effects_owner ON a2a_video_effects(owner_type, owner_id);

-- ============================================================================
-- Composition Templates
-- Pre-built composition templates for quick video creation
-- ============================================================================

CREATE TABLE IF NOT EXISTS a2a_video_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- intro, outro, chart, caption, social
    thumbnail_uri TEXT,
    preview_uri TEXT,  -- Video preview
    composition JSONB NOT NULL,  -- Full composition definition
    variables JSONB DEFAULT '{}',  -- Customizable variables
    tags TEXT[] DEFAULT '{}',
    owner_type VARCHAR(20) NOT NULL DEFAULT 'system',
    owner_id VARCHAR(255) NOT NULL DEFAULT 'liquid-motion',
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_video_templates_category ON a2a_video_templates(category);
CREATE INDEX IF NOT EXISTS idx_a2a_video_templates_tags ON a2a_video_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_a2a_video_templates_featured ON a2a_video_templates(is_featured, usage_count DESC);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_a2a_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_a2a_video_tasks_updated_at
    BEFORE UPDATE ON a2a_video_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

CREATE TRIGGER trigger_a2a_video_effects_updated_at
    BEFORE UPDATE ON a2a_video_effects
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

CREATE TRIGGER trigger_a2a_video_templates_updated_at
    BEFORE UPDATE ON a2a_video_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_a2a_video_updated_at();

-- ============================================================================
-- Built-in Effects
-- ============================================================================

INSERT INTO a2a_video_effects (effect_id, name, description, category, effect_type, parameters, is_builtin) VALUES
('fade-in', 'Fade In', 'Gradually appear from transparent', 'transition', 'fade', '{"direction": "in", "duration": 30}', true),
('fade-out', 'Fade Out', 'Gradually disappear to transparent', 'transition', 'fade', '{"direction": "out", "duration": 30}', true),
('slide-left', 'Slide Left', 'Slide in from the right', 'transition', 'slide', '{"direction": "left", "duration": 30}', true),
('slide-right', 'Slide Right', 'Slide in from the left', 'transition', 'slide', '{"direction": "right", "duration": 30}', true),
('slide-up', 'Slide Up', 'Slide in from the bottom', 'transition', 'slide', '{"direction": "up", "duration": 30}', true),
('slide-down', 'Slide Down', 'Slide in from the top', 'transition', 'slide', '{"direction": "down", "duration": 30}', true),
('zoom-in', 'Zoom In', 'Zoom in from small to full size', 'transition', 'zoom', '{"direction": "in", "scale": 0.5, "duration": 30}', true),
('zoom-out', 'Zoom Out', 'Zoom out from large to normal size', 'transition', 'zoom', '{"direction": "out", "scale": 1.5, "duration": 30}', true),
('blur', 'Blur', 'Apply gaussian blur effect', 'filter', 'blur', '{"radius": 10}', true),
('spring-bounce', 'Spring Bounce', 'Spring physics bounce animation', 'motion', 'spring', '{"mass": 1, "damping": 10, "stiffness": 100}', true),
('spring-wobbly', 'Spring Wobbly', 'Wobbly spring animation', 'motion', 'spring', '{"mass": 1, "damping": 7, "stiffness": 150}', true),
('spin', 'Spin', 'Rotate 360 degrees', 'motion', 'rotate', '{"degrees": 360, "duration": 60}', true),
('pulse', 'Pulse', 'Scale up and down repeatedly', 'motion', 'scale', '{"min": 0.95, "max": 1.05, "duration": 30}', true),
('typewriter', 'Typewriter', 'Text appears character by character', 'text', 'typewriter', '{"speed": 2}', true),
('wipe-horizontal', 'Horizontal Wipe', 'Reveal with horizontal wipe', 'transition', 'wipe', '{"direction": "horizontal", "duration": 30}', true),
('wipe-vertical', 'Vertical Wipe', 'Reveal with vertical wipe', 'transition', 'wipe', '{"direction": "vertical", "duration": 30}', true)
ON CONFLICT (effect_id) DO NOTHING;

-- ============================================================================
-- Built-in Templates
-- ============================================================================

INSERT INTO a2a_video_templates (template_id, name, description, category, composition, variables, tags, is_featured) VALUES
('intro-simple', 'Simple Intro', 'Clean text intro with fade animation', 'intro',
 '{"width": 1920, "height": 1080, "fps": 30, "durationInFrames": 150, "scenes": [{"type": "text", "content": "{{title}}", "animation": "fade-in"}]}',
 '{"title": "Your Title Here"}',
 ARRAY['intro', 'text', 'simple', 'fade'],
 true),
('intro-logo', 'Logo Reveal', 'Logo animation with spin and scale', 'intro',
 '{"width": 1920, "height": 1080, "fps": 30, "durationInFrames": 180, "scenes": [{"type": "image", "src": "{{logoUrl}}", "animation": "zoom-in"}]}',
 '{"logoUrl": "/assets/logo.png"}',
 ARRAY['intro', 'logo', 'reveal', 'zoom'],
 true),
('chart-line', 'Line Chart Animation', 'Animated line chart with draw effect', 'chart',
 '{"width": 1920, "height": 1080, "fps": 30, "durationInFrames": 120, "scenes": [{"type": "chart", "chartType": "line", "data": "{{chartData}}", "animation": "draw"}]}',
 '{"chartData": [{"label": "Jan", "value": 10}, {"label": "Feb", "value": 20}]}',
 ARRAY['chart', 'line', 'data', 'animation'],
 true),
('caption-basic', 'Basic Caption', 'Simple subtitle/caption overlay', 'caption',
 '{"width": 1920, "height": 1080, "fps": 30, "durationInFrames": 90, "scenes": [{"type": "caption", "text": "{{captionText}}", "position": "bottom"}]}',
 '{"captionText": "Your caption here"}',
 ARRAY['caption', 'subtitle', 'text'],
 false),
('social-story', 'Social Story', 'Vertical format for social media stories', 'social',
 '{"width": 1080, "height": 1920, "fps": 30, "durationInFrames": 450, "scenes": [{"type": "text", "content": "{{headline}}", "animation": "slide-up"}]}',
 '{"headline": "Breaking News"}',
 ARRAY['social', 'story', 'vertical', 'instagram'],
 true)
ON CONFLICT (template_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE a2a_video_tasks IS 'Links A2A tasks with A2S video render jobs';
COMMENT ON TABLE a2a_video_frames IS 'Cached rendered frames for preview';
COMMENT ON TABLE a2a_video_artifacts IS 'A2A artifact storage for video outputs';
COMMENT ON TABLE a2a_video_effects IS 'Reusable animation effect presets';
COMMENT ON TABLE a2a_video_templates IS 'Pre-built composition templates';

COMMENT ON COLUMN a2a_video_tasks.skill_id IS 'A2A skill that was invoked (render_video, preview_frame, etc.)';
COMMENT ON COLUMN a2a_video_tasks.parsed_intent IS 'Intent parsed from natural language input';
COMMENT ON COLUMN a2a_video_artifacts.is_final IS 'True for the final rendered video artifact';
COMMENT ON COLUMN a2a_video_templates.variables IS 'Customizable template variables with defaults';
