-- ============================================================================
-- Waidmann-Feed Database Schema
-- ============================================================================
-- Phase E: Privacy & Anonymization
-- Phase A: Sighting Radar
-- Phase B: Strecke & Stories
-- Phase C: Invites & Public Calls
-- Phase F: Moderation & Safety
-- ============================================================================

-- ============================================================================
-- SIGHTINGS (User-generated with privacy protection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_sightings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- Content
species VARCHAR(100) NOT NULL,
    confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5),
    description TEXT,
    photo_urls TEXT[],

-- Location (blurred for privacy)
grid_cell VARCHAR(20) NOT NULL, -- e.g., "DE-NW-5234" (5km grid)
raw_lat DOUBLE PRECISION, -- stored but NEVER exposed via API
raw_lng DOUBLE PRECISION, -- stored but NEVER exposed via API
bundesland VARCHAR(50),

-- Timestamps (with privacy delay)
observed_at TIMESTAMPTZ NOT NULL,
publish_at TIMESTAMPTZ NOT NULL, -- delayed by 24-72h for privacy
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Status
status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden', 'deleted')),
    moderation_notes TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMPTZ
);

CREATE INDEX idx_sightings_grid_cell ON jagd_sightings (grid_cell);

CREATE INDEX idx_sightings_species ON jagd_sightings (species);

CREATE INDEX idx_sightings_publish_at ON jagd_sightings (publish_at);

CREATE INDEX idx_sightings_status ON jagd_sightings (status);

-- ============================================================================
-- SIGHTING AGGREGATES (k-Anonymized insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_sighting_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_cell VARCHAR(20) NOT NULL,
    species VARCHAR(100) NOT NULL,
    time_window VARCHAR(20) NOT NULL,    -- e.g., "2026-W05" (ISO week)

-- Aggregated stats
sighting_count INT NOT NULL,
trend_percentage DECIMAL(5, 2), -- e.g., +38.5% compared to previous period
contributor_count INT NOT NULL, -- for k-anonymity check (must be >= K)

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(grid_cell, species, time_window)
);

CREATE INDEX idx_aggregates_time_window ON jagd_sighting_aggregates (time_window);

CREATE INDEX idx_aggregates_species ON jagd_sighting_aggregates (species);

-- ============================================================================
-- OFFICIAL SOURCES (DBBW, BfN, LANUV, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_official_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,    -- 'dbbw', 'bfn', 'lanuv', 'ljv'
    api_url TEXT,
    rss_url TEXT,
    scrape_url TEXT,

-- Sync status
last_synced_at TIMESTAMPTZ,
sync_frequency_hours INT DEFAULT 24,
is_active BOOLEAN DEFAULT true,

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW() );

-- ============================================================================
-- OFFICIAL SIGHTINGS (Verified data from authorities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_official_sightings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES jagd_official_sources(id) ON DELETE SET NULL,

-- Content
species VARCHAR(100) NOT NULL,
grid_cell VARCHAR(20) NOT NULL,
bundesland VARCHAR(50),
description TEXT,
verification_status VARCHAR(20), -- 'confirmed', 'probable', 'unconfirmed'

-- Timestamps
observed_at TIMESTAMPTZ,
source_published_at TIMESTAMPTZ,
synced_at TIMESTAMPTZ DEFAULT NOW(),

-- Source reference
source_url TEXT,
source_reference_id VARCHAR(100), -- ID from the source system

-- Prevent duplicates
UNIQUE(source_id, source_reference_id) );

CREATE INDEX idx_official_grid_cell ON jagd_official_sightings (grid_cell);

CREATE INDEX idx_official_species ON jagd_official_sightings (species);

-- ============================================================================
-- STORIES (Strecke & lessons learned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    harvest_id UUID,                      -- Optional link to harvest record

-- Content
title VARCHAR(255),
    content TEXT NOT NULL,
    photo_urls TEXT[],
    video_url TEXT,

-- Harvest details (coarse for privacy)
species VARCHAR(100),
weight_kg DECIMAL(6, 2),
date_window VARCHAR(50), -- "Ende Januar 2026" (not exact date)
coarse_area VARCHAR(100), -- "Brandenburg" (not exact location)

-- Lessons learned template
wind_conditions TEXT,
approach_direction TEXT,
shot_distance_m INT,
after_search_notes TEXT,
equipment_notes TEXT,

-- Publishing
is_published BOOLEAN DEFAULT false,
publish_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

-- Engagement
view_count INT DEFAULT 0, like_count INT DEFAULT 0 );

CREATE INDEX idx_stories_user ON jagd_stories (user_id);

CREATE INDEX idx_stories_published ON jagd_stories (is_published, publish_at);

CREATE INDEX idx_stories_species ON jagd_stories (species);

-- ============================================================================
-- INVITES (Drückjagd gesucht, Revierarbeit, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- Type
invite_type VARCHAR(50) NOT NULL, -- 'drueckjagd', 'revierarbeit', 'hundefuehrer', 'begehung', 'andere'

-- Content
title VARCHAR(255) NOT NULL, description TEXT,

-- Location (coarse)
bundesland VARCHAR(50), region VARCHAR(100),

-- Date/time
event_date DATE, event_time_start TIME, event_time_end TIME,

-- Requirements
required_roles TEXT[],               -- ['Schütze', 'Treiber', 'Hundeführer']
    max_participants INT,
    current_participants INT DEFAULT 0,

-- Safety requirements
rules_acknowledgement_required BOOLEAN DEFAULT true,
emergency_contacts_required BOOLEAN DEFAULT true,
experience_required VARCHAR(50), -- 'none', 'basic', 'experienced'

-- Status
status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_invites_user ON jagd_invites (user_id);

CREATE INDEX idx_invites_type ON jagd_invites (invite_type);

CREATE INDEX idx_invites_bundesland ON jagd_invites (bundesland);

CREATE INDEX idx_invites_event_date ON jagd_invites (event_date);

CREATE INDEX idx_invites_status ON jagd_invites (status);

-- ============================================================================
-- INVITE APPLICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_invite_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_id UUID NOT NULL REFERENCES jagd_invites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- Application details
role_requested VARCHAR(50), message TEXT,

-- Safety acknowledgements
rules_acknowledged BOOLEAN DEFAULT false,
rules_acknowledged_at TIMESTAMPTZ,
emergency_contact TEXT,

-- Status
status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    response_message TEXT,
    responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(invite_id, user_id)
);

CREATE INDEX idx_applications_invite ON jagd_invite_applications (invite_id);

CREATE INDEX idx_applications_user ON jagd_invite_applications (user_id);

CREATE INDEX idx_applications_status ON jagd_invite_applications (status);

-- ============================================================================
-- CONTENT REPORTS (Moderation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,

-- Content reference
content_type VARCHAR(50) NOT NULL, -- 'sighting', 'story', 'invite', 'comment'
content_id UUID NOT NULL,

-- Report details
reason VARCHAR(100) NOT NULL, -- 'location_exposed', 'illegal_content', 'defamation', 'harassment', 'spam'
description TEXT,

-- Resolution
status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    reviewer_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    action_taken VARCHAR(50),            -- 'none', 'warning', 'hidden', 'deleted', 'user_banned'
    action_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_content ON jagd_content_reports (content_type, content_id);

CREATE INDEX idx_reports_status ON jagd_content_reports (status);

-- ============================================================================
-- CONTENT RULES (Automated moderation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_content_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    rule_type VARCHAR(50) NOT NULL, -- 'blocked_species', 'location_safety', 'keyword', 'pattern'
    rule_value TEXT NOT NULL, -- The pattern or value to match
    action VARCHAR(50) NOT NULL, -- 'block', 'flag', 'require_tag', 'delay'
    reason VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default rules for safety
INSERT INTO
    jagd_content_rules (
        rule_type,
        rule_value,
        action,
        reason
    )
VALUES (
        'location_safety',
        'exact_coordinates',
        'block',
        'Exact coordinates not allowed in public posts'
    ),
    (
        'blocked_species',
        'protected_species',
        'flag',
        'Protected species requires verification'
    ),
    (
        'keyword',
        'verkauf|kaufen|biete|suche waffe',
        'block',
        'No weapon marketplace activity'
    ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRIVACY ANALYTICS KEYS (Pseudonymization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_analytics_keys (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    analytics_key UUID NOT NULL DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER PRIVACY PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagd_privacy_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

-- Telemetry
contribute_sightings BOOLEAN DEFAULT true,
contribute_aggregates BOOLEAN DEFAULT true,
private_hunt_mode BOOLEAN DEFAULT false,

-- Location
location_precision VARCHAR(20) DEFAULT 'grid', -- 'none', 'grid', 'region'
default_delay_hours INT DEFAULT 48,

-- Feed visibility
show_my_stories BOOLEAN DEFAULT true,
    show_my_invites BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FEED ITEMS VIEW (Unified feed query)
-- ============================================================================

CREATE OR REPLACE VIEW jagd_feed_items AS
SELECT
    s.id,
    'sighting' AS feed_type,
    s.species AS title,
    s.description AS summary,
    s.grid_cell,
    s.bundesland,
    s.publish_at AS published_at,
    s.user_id,
    'community' AS badge,
    s.photo_urls,
    NULL AS source_url
FROM jagd_sightings s
WHERE
    s.status = 'published'
    AND s.publish_at <= NOW()
UNION ALL
SELECT
    o.id,
    'official' AS feed_type,
    o.species AS title,
    o.description AS summary,
    o.grid_cell,
    o.bundesland,
    COALESCE(
        o.source_published_at,
        o.synced_at
    ) AS published_at,
    NULL AS user_id,
    os.source_type AS badge,
    NULL AS photo_urls,
    o.source_url
FROM
    jagd_official_sightings o
    LEFT JOIN jagd_official_sources os ON o.source_id = os.id
UNION ALL
SELECT
    st.id,
    'story' AS feed_type,
    st.title,
    LEFT(st.content, 200) AS summary,
    NULL AS grid_cell,
    st.coarse_area AS bundesland,
    COALESCE(st.publish_at, st.created_at) AS published_at,
    st.user_id,
    'community' AS badge,
    st.photo_urls,
    NULL AS source_url
FROM jagd_stories st
WHERE
    st.is_published = true
UNION ALL
SELECT
    i.id,
    'invite' AS feed_type,
    i.title,
    i.description AS summary,
    NULL AS grid_cell,
    i.bundesland,
    i.created_at AS published_at,
    i.user_id,
    i.invite_type AS badge,
    NULL AS photo_urls,
    NULL AS source_url
FROM jagd_invites i
WHERE
    i.status = 'open'
    AND (
        i.expires_at IS NULL
        OR i.expires_at > NOW()
    );