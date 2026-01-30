-- ============================================================================
-- Hege & Pflege, Wildunfall, Nachsuche Schema
-- ============================================================================
-- Database tables for conservation work, wildlife collisions, and tracking
-- ============================================================================

-- ============================================================================
-- Hege & Pflege (Conservation Work)
-- ============================================================================

-- Projects (Revierarbeit, Kitzrettung, etc.)
CREATE TABLE IF NOT EXISTS hege_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    revier_id TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN (
        'revierarbeit', 'kitzrettung', 'feeding_round', 'nest_boxes', 'habitat', 'infrastructure'
    )),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    meeting_point_geo JSONB,
    team_scope TEXT NOT NULL DEFAULT 'private' CHECK (team_scope IN ('private', 'team')),
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    tasks JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs (feeding, nest box, habitat work)
CREATE TABLE IF NOT EXISTS hege_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    project_id UUID REFERENCES hege_projects(id),
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'feeding', 'nest_box', 'habitat', 'infrastructure', 'counting', 'note'
    )),
    time TIMESTAMPTZ NOT NULL,
    geo JSONB,
    data JSONB DEFAULT '{}'::jsonb,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mowing notices (Kitzrettung trigger)
CREATE TABLE IF NOT EXISTS mowing_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    revier_id TEXT,
    field_name TEXT NOT NULL,
    geo JSONB NOT NULL,
    mowing_start TIMESTAMPTZ NOT NULL,
    mowing_end TIMESTAMPTZ,
    contact_name TEXT,
    contact_phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'assigned',
            'cleared',
            'cancelled'
        )
    ),
    kitzrettung_project_id UUID REFERENCES hege_projects (id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Wildunfall (Wildlife Collision)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wildunfall_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT NOT NULL,
    revier_id TEXT,
    time TIMESTAMPTZ NOT NULL,
    geo JSONB NOT NULL,
    suspected_species TEXT,
    injury_status TEXT CHECK (injury_status IN ('unknown', 'likely_alive', 'likely_dead')),
    reporter_notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'arrived', 'resolved', 'closed')),
    responder_id TEXT,
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    outcome TEXT,
    photos TEXT[],
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- On-call roster for Wildunfall dispatch
CREATE TABLE IF NOT EXISTS wildunfall_oncall_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    revier_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    phone TEXT,
    notify_mode TEXT DEFAULT 'in_app' CHECK (
        notify_mode IN (
            'in_app',
            'sms',
            'whatsapp_link'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispatch notifications log
CREATE TABLE IF NOT EXISTS wildunfall_dispatch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    incident_id UUID REFERENCES wildunfall_incidents (id),
    user_id TEXT NOT NULL,
    notify_mode TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (
        status IN (
            'sent',
            'delivered',
            'accepted',
            'declined',
            'timeout'
        )
    ),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- ============================================================================
-- Nachsuche (Tracking/Search)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nachsuche_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    shot_event_id TEXT,
    shooter_id TEXT NOT NULL,
    revier_id TEXT,
    geo JSONB NOT NULL,
    shot_confidence INTEGER CHECK (shot_confidence >= 0 AND shot_confidence <= 100),
    flight_direction TEXT,
    signs TEXT[],
    wait_time_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'started', 'paused', 'located', 'recovered', 'stopped', 'closed'
    )),
    outcome TEXT,
    lessons_learned TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team assignments for Nachsuche
CREATE TABLE IF NOT EXISTS nachsuche_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    case_id UUID REFERENCES nachsuche_cases (id),
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN (
            'shooter',
            'handler',
            'dog',
            'driver',
            'safety_contact'
        )
    ),
    dog_name TEXT,
    share_scope TEXT DEFAULT 'private' CHECK (
        share_scope IN ('private', 'team_coarse')
    ),
    status TEXT DEFAULT 'assigned' CHECK (
        status IN (
            'assigned',
            'accepted',
            'active',
            'completed'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track segments (optional, for detailed logging)
CREATE TABLE IF NOT EXISTS nachsuche_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES nachsuche_cases(id),
    recorded_by TEXT NOT NULL,
    geo_start JSONB NOT NULL,
    geo_end JSONB,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    evidence_photos TEXT[]
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Hege & Pflege
CREATE INDEX IF NOT EXISTS idx_hege_projects_user ON hege_projects (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_hege_projects_revier ON hege_projects (revier_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_hege_activities_project ON hege_activities (project_id);

CREATE INDEX IF NOT EXISTS idx_hege_activities_type ON hege_activities (activity_type, time DESC);

CREATE INDEX IF NOT EXISTS idx_mowing_notices_status ON mowing_notices (status, mowing_start);

-- Wildunfall
CREATE INDEX IF NOT EXISTS idx_wildunfall_status ON wildunfall_incidents (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wildunfall_revier ON wildunfall_incidents (revier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wildunfall_oncall ON wildunfall_oncall_roster (revier_id, active, priority);

-- Nachsuche
CREATE INDEX IF NOT EXISTS idx_nachsuche_session ON nachsuche_cases (session_id);

CREATE INDEX IF NOT EXISTS idx_nachsuche_status ON nachsuche_cases (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nachsuche_team_case ON nachsuche_team (case_id);

-- ============================================================================
-- Views
-- ============================================================================

-- Hege weekly summary
CREATE OR REPLACE VIEW hege_weekly_summary AS
SELECT
    user_id,
    activity_type,
    COUNT(*) as activity_count,
    DATE_TRUNC ('week', time) as week
FROM hege_activities
GROUP BY
    user_id,
    activity_type,
    week;

-- Wildunfall response metrics
CREATE OR REPLACE VIEW wildunfall_response_metrics AS
SELECT
    revier_id,
    COUNT(*) as total_incidents,
    AVG(EXTRACT(EPOCH FROM (accepted_at - created_at)) / 60) as avg_accept_time_min,
    AVG(EXTRACT(EPOCH FROM (arrived_at - accepted_at)) / 60) as avg_arrival_time_min,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::float / COUNT(*) as resolution_rate,
    DATE_TRUNC('month', created_at) as month
FROM wildunfall_incidents
WHERE status IN ('resolved', 'closed')
GROUP BY revier_id, month;

-- Nachsuche outcomes
CREATE OR REPLACE VIEW nachsuche_outcomes AS
SELECT
    shooter_id,
    COUNT(*) as total_cases,
    SUM(
        CASE
            WHEN status = 'recovered' THEN 1
            ELSE 0
        END
    ) as recovered,
    SUM(
        CASE
            WHEN status = 'stopped' THEN 1
            ELSE 0
        END
    ) as stopped,
    AVG(shot_confidence) as avg_confidence,
    DATE_TRUNC ('month', created_at) as month
FROM nachsuche_cases
WHERE
    status IN (
        'recovered',
        'stopped',
        'closed'
    )
GROUP BY
    shooter_id,
    month;