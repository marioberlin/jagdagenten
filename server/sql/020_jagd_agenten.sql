-- Jagd-Agenten: Hunting Companion Domain Tables
-- Migration 020: Core hunting domain schema

-- Hunt Sessions
CREATE TABLE IF NOT EXISTS hunt_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('ansitz','pirsch','drueckjagd','other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  geo_mode TEXT NOT NULL DEFAULT 'none' CHECK (geo_mode IN ('none','coarse_grid','precise')),
  geo_grid_id TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lon DOUBLE PRECISION,
  geo_blur_meters INT DEFAULT 0,
  participants TEXT[] DEFAULT '{}',
  privacy_mode TEXT NOT NULL DEFAULT 'private' CHECK (privacy_mode IN ('private','team_event_only','public_blurred')),
  weather_snapshot JSONB,
  equipment_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES hunt_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sighting','shot','harvest','note','processing','handover')),
  time TIMESTAMPTZ NOT NULL,
  geo_mode TEXT NOT NULL DEFAULT 'none',
  geo_grid_id TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lon DOUBLE PRECISION,
  geo_blur_meters INT DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timeline_events_session ON timeline_events(session_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_time ON timeline_events(time);

-- Hunt Stands
CREATE TABLE IF NOT EXISTS hunt_stands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  stand_type TEXT DEFAULT 'hochsitz',
  geo_lat DOUBLE PRECISION NOT NULL,
  geo_lon DOUBLE PRECISION NOT NULL,
  notes TEXT,
  wind_history JSONB DEFAULT '[]',
  performance_stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revier Boundaries
CREATE TABLE IF NOT EXISTS revier_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  geojson JSONB NOT NULL,
  source_format TEXT CHECK (source_format IN ('gpx','kml','geojson')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Inventory (encrypted at rest)
CREATE TABLE IF NOT EXISTS equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon','optic','ammo','clothing','accessory','other')),
  name TEXT NOT NULL,
  encrypted_data BYTEA,
  metadata JSONB DEFAULT '{}',
  maintenance_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ammo Logs
CREATE TABLE IF NOT EXISTS ammo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  equipment_id UUID REFERENCES equipment_inventory(id),
  caliber TEXT NOT NULL,
  rounds_used INT NOT NULL,
  session_id UUID REFERENCES hunt_sessions(id),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Vault (encrypted)
CREATE TABLE IF NOT EXISTS document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('jagdschein','wbk','insurance','permit','other')),
  name TEXT NOT NULL,
  encrypted_data BYTEA NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Packs
CREATE TABLE IF NOT EXISTS export_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack_type TEXT NOT NULL,
  bundesland TEXT,
  data JSONB NOT NULL,
  pdf_url TEXT,
  csv_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest Permits (Begehungsschein)
CREATE TABLE IF NOT EXISTS guest_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  revier TEXT,
  conditions JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack Events (Group Hunts)
CREATE TABLE IF NOT EXISTS pack_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('drueckjagd','ansitz_group','work_day','dog_training','other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location_name TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lon DOUBLE PRECISION,
  status TEXT DEFAULT 'planned',
  safety_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack Participants & Roles
CREATE TABLE IF NOT EXISTS pack_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES pack_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('stand','treiber','hundefuehrer','jagdleiter','guest')),
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  emergency_contacts JSONB DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_pack_participants_event ON pack_participants(event_id);

-- Feed Posts
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('sighting','story','strecke','invite','lesson')),
  title TEXT,
  content TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  geo_mode TEXT DEFAULT 'coarse_grid',
  geo_grid_id TEXT,
  tags TEXT[] DEFAULT '{}',
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','redacted','rejected')),
  moderation_decision JSONB,
  published_at TIMESTAMPTZ,
  time_delay_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_type ON feed_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_feed_posts_moderation ON feed_posts(moderation_status);

-- News Items (ingested)
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  confidence REAL,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Decisions (audit trail)
CREATE TABLE IF NOT EXISTS moderation_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('allow','allow_with_redactions','reject','escalate_to_human')),
  reason_codes TEXT[] DEFAULT '{}',
  redactions TEXT[] DEFAULT '{}',
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences (hunting-specific)
CREATE TABLE IF NOT EXISTS jagd_user_preferences (
  user_id UUID PRIMARY KEY,
  region TEXT,
  bundesland TEXT,
  default_privacy TEXT DEFAULT 'private',
  default_geo_mode TEXT DEFAULT 'coarse_grid',
  preferred_species TEXT[] DEFAULT '{}',
  time_delay_hours INT DEFAULT 24,
  k_threshold INT DEFAULT 5,
  opt_in_community_insights BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free','premium','enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
