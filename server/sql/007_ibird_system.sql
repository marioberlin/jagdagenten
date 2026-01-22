-- Migration: 007_ibird_system.sql
-- Description: iBird email, calendar, and appointments system
-- Author: LiquidCrypto System
-- Date: 2026-01-22

-- ============================================================================
-- MAIL SYSTEM TABLES
-- ============================================================================

-- Mail Accounts (IMAP/SMTP credentials)
CREATE TABLE IF NOT EXISTS ibird_mail_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    provider VARCHAR(50), -- 'gmail', 'outlook', 'imap', etc.

    -- IMAP settings
    imap_host VARCHAR(255) NOT NULL,
    imap_port INTEGER DEFAULT 993,
    imap_secure BOOLEAN DEFAULT TRUE,

    -- SMTP settings
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT TRUE,

    -- Credentials (encrypted)
    auth_type VARCHAR(20) DEFAULT 'password', -- 'password', 'oauth2'
    credentials_encrypted BYTEA, -- encrypted JSON with password or oauth tokens

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'error', 'disabled')),
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,

    -- Settings
    sync_frequency_minutes INTEGER DEFAULT 5,
    signature_html TEXT,
    signature_text TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, email)
);

CREATE INDEX idx_ibird_mail_accounts_user ON ibird_mail_accounts(user_id);
CREATE INDEX idx_ibird_mail_accounts_status ON ibird_mail_accounts(user_id, status);

-- Mail Identities (send-as aliases)
CREATE TABLE IF NOT EXISTS ibird_mail_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    reply_to VARCHAR(255),
    signature_html TEXT,
    signature_text TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_identities_account ON ibird_mail_identities(account_id);

-- Mail Folders
CREATE TABLE IF NOT EXISTS ibird_mail_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES ibird_mail_folders(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    path VARCHAR(1000) NOT NULL, -- Full IMAP path
    folder_type VARCHAR(20) DEFAULT 'custom' CHECK (folder_type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom')),

    -- IMAP attributes
    delimiter VARCHAR(10) DEFAULT '/',
    flags TEXT[], -- IMAP folder flags

    -- Stats (cached)
    total_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,

    -- Sync state
    uidvalidity BIGINT,
    last_uid BIGINT,
    last_sync_at TIMESTAMPTZ,

    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(account_id, path)
);

CREATE INDEX idx_ibird_mail_folders_account ON ibird_mail_folders(account_id);
CREATE INDEX idx_ibird_mail_folders_parent ON ibird_mail_folders(parent_id);
CREATE INDEX idx_ibird_mail_folders_type ON ibird_mail_folders(account_id, folder_type);

-- Mail Messages
CREATE TABLE IF NOT EXISTS ibird_mail_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES ibird_mail_folders(id) ON DELETE CASCADE,

    -- Message identifiers
    message_id VARCHAR(500), -- RFC Message-ID header
    thread_id VARCHAR(500), -- For threading (derived from References/In-Reply-To)
    uid BIGINT, -- IMAP UID within folder

    -- Headers
    subject TEXT,
    from_address JSONB NOT NULL, -- {email, name}
    to_addresses JSONB DEFAULT '[]'::jsonb, -- [{email, name}, ...]
    cc_addresses JSONB DEFAULT '[]'::jsonb,
    bcc_addresses JSONB DEFAULT '[]'::jsonb,
    reply_to_address JSONB,

    -- Dates
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL,

    -- Content
    snippet TEXT, -- First ~200 chars of body
    body_text TEXT,
    body_html TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,

    -- Flags
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Raw storage (optional)
    raw_headers TEXT,
    size_bytes INTEGER,

    -- Labels (many-to-many handled via separate table)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_messages_account ON ibird_mail_messages(account_id);
CREATE INDEX idx_ibird_mail_messages_folder ON ibird_mail_messages(folder_id);
CREATE INDEX idx_ibird_mail_messages_thread ON ibird_mail_messages(account_id, thread_id);
CREATE INDEX idx_ibird_mail_messages_received ON ibird_mail_messages(folder_id, received_at DESC);
CREATE INDEX idx_ibird_mail_messages_unread ON ibird_mail_messages(folder_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_ibird_mail_messages_starred ON ibird_mail_messages(account_id, is_starred) WHERE is_starred = TRUE;
CREATE INDEX idx_ibird_mail_messages_message_id ON ibird_mail_messages(message_id);

-- Full-text search index
CREATE INDEX idx_ibird_mail_messages_search ON ibird_mail_messages
    USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')));

-- Mail Attachments
CREATE TABLE IF NOT EXISTS ibird_mail_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES ibird_mail_messages(id) ON DELETE CASCADE,

    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(255),
    size_bytes INTEGER,
    content_id VARCHAR(255), -- For inline attachments
    is_inline BOOLEAN DEFAULT FALSE,

    -- Storage
    storage_path TEXT, -- Path to stored file (if downloaded)
    storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 's3', etc.

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_attachments_message ON ibird_mail_attachments(message_id);

-- Mail Labels
CREATE TABLE IF NOT EXISTS ibird_mail_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366F1', -- Hex color

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

CREATE INDEX idx_ibird_mail_labels_user ON ibird_mail_labels(user_id);

-- Mail Message Labels (many-to-many)
CREATE TABLE IF NOT EXISTS ibird_mail_message_labels (
    message_id UUID NOT NULL REFERENCES ibird_mail_messages(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES ibird_mail_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, label_id)
);

CREATE INDEX idx_ibird_mail_message_labels_label ON ibird_mail_message_labels(label_id);

-- ============================================================================
-- CALENDAR SYSTEM TABLES
-- ============================================================================

-- Calendars
CREATE TABLE IF NOT EXISTS ibird_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color

    -- Source
    source VARCHAR(20) DEFAULT 'local' CHECK (source IN ('local', 'google', 'microsoft', 'caldav')),
    external_id VARCHAR(500), -- ID from external provider
    sync_url TEXT, -- CalDAV URL

    -- Credentials for external calendars
    credentials_encrypted BYTEA,

    -- Settings
    is_visible BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Sync state
    sync_token TEXT,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendars_user ON ibird_calendars(user_id);
CREATE INDEX idx_ibird_calendars_source ON ibird_calendars(user_id, source);

-- Calendar Events
CREATE TABLE IF NOT EXISTS ibird_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES ibird_calendars(id) ON DELETE CASCADE,

    -- External ID for synced events
    external_id VARCHAR(500),
    etag VARCHAR(255), -- For CalDAV sync

    -- Event details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,
    video_link TEXT,

    -- Time
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100),
    is_all_day BOOLEAN DEFAULT FALSE,

    -- Recurrence (RFC 5545 RRULE)
    recurrence_rule JSONB, -- {frequency, interval, until, count, byDayOfWeek, etc.}
    recurrence_id TIMESTAMPTZ, -- For recurrence exceptions
    original_event_id UUID REFERENCES ibird_calendar_events(id) ON DELETE CASCADE, -- Parent recurring event

    -- Status
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'default' CHECK (visibility IN ('default', 'public', 'private')),

    -- Attendees stored as JSONB array
    attendees JSONB DEFAULT '[]'::jsonb, -- [{email, name, status, required}]
    organizer JSONB, -- {email, name}

    -- Metadata
    color VARCHAR(7), -- Override calendar color
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_events_calendar ON ibird_calendar_events(calendar_id);
CREATE INDEX idx_ibird_calendar_events_time ON ibird_calendar_events(calendar_id, start_time, end_time);
CREATE INDEX idx_ibird_calendar_events_range ON ibird_calendar_events(start_time, end_time);
CREATE INDEX idx_ibird_calendar_events_recurring ON ibird_calendar_events(original_event_id) WHERE original_event_id IS NOT NULL;
CREATE INDEX idx_ibird_calendar_events_external ON ibird_calendar_events(external_id) WHERE external_id IS NOT NULL;

-- Calendar Reminders
CREATE TABLE IF NOT EXISTS ibird_calendar_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES ibird_calendar_events(id) ON DELETE CASCADE,

    reminder_type VARCHAR(20) DEFAULT 'notification' CHECK (reminder_type IN ('notification', 'email')),
    minutes_before INTEGER NOT NULL, -- Minutes before event start

    -- Tracking
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_reminders_event ON ibird_calendar_reminders(event_id);
CREATE INDEX idx_ibird_calendar_reminders_pending ON ibird_calendar_reminders(is_sent, event_id) WHERE is_sent = FALSE;

-- Calendar Tasks (To-dos)
CREATE TABLE IF NOT EXISTS ibird_calendar_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES ibird_calendars(id) ON DELETE CASCADE,

    title VARCHAR(500) NOT NULL,
    description TEXT,

    due_date DATE,
    due_time TIME,

    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 9), -- 1=highest, 9=lowest
    status VARCHAR(20) DEFAULT 'needs_action' CHECK (status IN ('needs_action', 'in_progress', 'completed', 'cancelled')),
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),

    completed_at TIMESTAMPTZ,

    -- External sync
    external_id VARCHAR(500),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_tasks_calendar ON ibird_calendar_tasks(calendar_id);
CREATE INDEX idx_ibird_calendar_tasks_due ON ibird_calendar_tasks(due_date) WHERE status != 'completed';
CREATE INDEX idx_ibird_calendar_tasks_status ON ibird_calendar_tasks(calendar_id, status);

-- ============================================================================
-- APPOINTMENTS SYSTEM TABLES
-- ============================================================================

-- Appointment Types (e.g., "30 Min Meeting", "1 Hour Consultation")
CREATE TABLE IF NOT EXISTS ibird_appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly identifier
    description TEXT,

    -- Duration
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,

    -- Location
    location_type VARCHAR(20) DEFAULT 'video' CHECK (location_type IN ('in_person', 'phone', 'video', 'custom')),
    location_address TEXT,
    video_provider VARCHAR(20), -- 'zoom', 'google_meet', 'teams', 'custom'
    video_link TEXT, -- Static link or template

    -- Booking limits
    min_notice_minutes INTEGER DEFAULT 1440, -- 24 hours
    max_booking_days INTEGER DEFAULT 60,
    max_bookings_per_day INTEGER,

    -- Appearance
    color VARCHAR(7) DEFAULT '#3B82F6',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Custom fields for booking form
    custom_fields JSONB DEFAULT '[]'::jsonb, -- [{name, label, type, required}]

    -- Link to availability schedule
    availability_schedule_id UUID, -- Set after availability table created

    -- Link to calendar for creating events
    calendar_id UUID REFERENCES ibird_calendars(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, slug)
);

CREATE INDEX idx_ibird_appointment_types_user ON ibird_appointment_types(user_id);
CREATE INDEX idx_ibird_appointment_types_active ON ibird_appointment_types(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ibird_appointment_types_slug ON ibird_appointment_types(user_id, slug);

-- Availability Schedules
CREATE TABLE IF NOT EXISTS ibird_availability_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL DEFAULT 'Working Hours',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',

    -- Weekly hours as JSONB
    -- {sunday: [], monday: [{start: "09:00", end: "17:00"}], ...}
    weekly_hours JSONB NOT NULL DEFAULT '{
        "sunday": [],
        "monday": [{"start": "09:00", "end": "17:00"}],
        "tuesday": [{"start": "09:00", "end": "17:00"}],
        "wednesday": [{"start": "09:00", "end": "17:00"}],
        "thursday": [{"start": "09:00", "end": "17:00"}],
        "friday": [{"start": "09:00", "end": "17:00"}],
        "saturday": []
    }'::jsonb,

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_availability_schedules_user ON ibird_availability_schedules(user_id);

-- Add foreign key to appointment_types
ALTER TABLE ibird_appointment_types
    ADD CONSTRAINT fk_appointment_type_availability
    FOREIGN KEY (availability_schedule_id)
    REFERENCES ibird_availability_schedules(id) ON DELETE SET NULL;

-- Date-specific availability overrides
CREATE TABLE IF NOT EXISTS ibird_availability_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES ibird_availability_schedules(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,

    -- Override slots (only used if is_available = true)
    slots JSONB DEFAULT '[]'::jsonb, -- [{start: "09:00", end: "12:00"}]

    reason TEXT, -- "Holiday", "Vacation", etc.

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(schedule_id, date)
);

CREATE INDEX idx_ibird_availability_overrides_schedule ON ibird_availability_overrides(schedule_id);
CREATE INDEX idx_ibird_availability_overrides_date ON ibird_availability_overrides(schedule_id, date);

-- Bookings
CREATE TABLE IF NOT EXISTS ibird_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_type_id UUID NOT NULL REFERENCES ibird_appointment_types(id) ON DELETE CASCADE,

    -- Host (the user who owns the appointment type)
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Invitee details
    invitee_name VARCHAR(255) NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_phone VARCHAR(50),
    invitee_timezone VARCHAR(100),

    -- Scheduled time
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

    -- Location details (copied from type or customized)
    location_type VARCHAR(20),
    location_details TEXT, -- Address or video link

    -- Notes and custom field responses
    notes TEXT,
    custom_field_responses JSONB DEFAULT '{}'::jsonb,

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(20), -- 'host', 'invitee'
    cancellation_reason TEXT,

    -- Rescheduling
    rescheduled_from_id UUID REFERENCES ibird_bookings(id),

    -- Link to calendar event
    calendar_event_id UUID REFERENCES ibird_calendar_events(id) ON DELETE SET NULL,

    -- Notifications tracking
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_bookings_type ON ibird_bookings(appointment_type_id);
CREATE INDEX idx_ibird_bookings_host ON ibird_bookings(host_user_id);
CREATE INDEX idx_ibird_bookings_date ON ibird_bookings(host_user_id, scheduled_date);
CREATE INDEX idx_ibird_bookings_status ON ibird_bookings(host_user_id, status);
CREATE INDEX idx_ibird_bookings_invitee ON ibird_bookings(invitee_email);
CREATE INDEX idx_ibird_bookings_upcoming ON ibird_bookings(host_user_id, scheduled_date, start_time)
    WHERE status IN ('pending', 'confirmed');

-- ============================================================================
-- USER SETTINGS
-- ============================================================================

-- iBird-specific user settings
CREATE TABLE IF NOT EXISTS ibird_user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- General
    default_module VARCHAR(20) DEFAULT 'mail' CHECK (default_module IN ('mail', 'calendar', 'appointments')),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
    time_format VARCHAR(10) DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),

    -- Mail settings
    mail_signature_html TEXT,
    mail_signature_text TEXT,
    mail_preview_lines INTEGER DEFAULT 2,
    mail_thread_view BOOLEAN DEFAULT TRUE,
    mail_auto_mark_read BOOLEAN DEFAULT TRUE,

    -- Calendar settings
    calendar_week_start INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday
    calendar_default_view VARCHAR(20) DEFAULT 'week',
    calendar_default_duration INTEGER DEFAULT 60, -- minutes
    calendar_default_reminder INTEGER DEFAULT 30, -- minutes

    -- Appointments settings
    appointments_booking_page_username VARCHAR(100), -- for public booking URLs
    appointments_default_timezone VARCHAR(100),

    -- Notifications
    notifications_email_enabled BOOLEAN DEFAULT TRUE,
    notifications_browser_enabled BOOLEAN DEFAULT TRUE,
    notifications_sound_enabled BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACTS (Optional - for autocomplete)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ibird_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),

    -- Frequency for sorting
    interaction_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,

    -- Source
    source VARCHAR(20) DEFAULT 'manual', -- 'manual', 'mail', 'calendar', 'import'

    -- Additional info
    phone VARCHAR(50),
    company VARCHAR(255),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, email)
);

CREATE INDEX idx_ibird_contacts_user ON ibird_contacts(user_id);
CREATE INDEX idx_ibird_contacts_email ON ibird_contacts(user_id, email);
CREATE INDEX idx_ibird_contacts_frequency ON ibird_contacts(user_id, interaction_count DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_ibird_mail_accounts_updated_at
    BEFORE UPDATE ON ibird_mail_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_mail_identities_updated_at
    BEFORE UPDATE ON ibird_mail_identities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_mail_folders_updated_at
    BEFORE UPDATE ON ibird_mail_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_mail_messages_updated_at
    BEFORE UPDATE ON ibird_mail_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_mail_labels_updated_at
    BEFORE UPDATE ON ibird_mail_labels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_calendars_updated_at
    BEFORE UPDATE ON ibird_calendars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_calendar_events_updated_at
    BEFORE UPDATE ON ibird_calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_calendar_tasks_updated_at
    BEFORE UPDATE ON ibird_calendar_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_appointment_types_updated_at
    BEFORE UPDATE ON ibird_appointment_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_availability_schedules_updated_at
    BEFORE UPDATE ON ibird_availability_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_bookings_updated_at
    BEFORE UPDATE ON ibird_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_user_settings_updated_at
    BEFORE UPDATE ON ibird_user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ibird_contacts_updated_at
    BEFORE UPDATE ON ibird_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get folder unread counts for a user
CREATE OR REPLACE FUNCTION ibird_get_folder_counts(p_account_id UUID)
RETURNS TABLE(folder_id UUID, total_count BIGINT, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as folder_id,
        COUNT(m.id) as total_count,
        COUNT(m.id) FILTER (WHERE m.is_read = FALSE) as unread_count
    FROM ibird_mail_folders f
    LEFT JOIN ibird_mail_messages m ON m.folder_id = f.id AND m.is_deleted = FALSE
    WHERE f.account_id = p_account_id
    GROUP BY f.id;
END;
$$ LANGUAGE plpgsql;

-- Get upcoming bookings for a host
CREATE OR REPLACE FUNCTION ibird_get_upcoming_bookings(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    booking_id UUID,
    type_name VARCHAR(255),
    invitee_name VARCHAR(255),
    invitee_email VARCHAR(255),
    scheduled_date DATE,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id as booking_id,
        t.name as type_name,
        b.invitee_name,
        b.invitee_email,
        b.scheduled_date,
        b.start_time,
        b.end_time,
        b.status
    FROM ibird_bookings b
    JOIN ibird_appointment_types t ON t.id = b.appointment_type_id
    WHERE b.host_user_id = p_user_id
        AND b.status IN ('pending', 'confirmed')
        AND (b.scheduled_date > CURRENT_DATE
             OR (b.scheduled_date = CURRENT_DATE AND b.start_time > CURRENT_TIME))
    ORDER BY b.scheduled_date, b.start_time
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get available slots for a date
CREATE OR REPLACE FUNCTION ibird_get_available_slots(
    p_type_id UUID,
    p_date DATE
)
RETURNS TABLE(start_time TIME, end_time TIME) AS $$
DECLARE
    v_schedule_id UUID;
    v_timezone VARCHAR(100);
    v_duration INTEGER;
    v_buffer_before INTEGER;
    v_buffer_after INTEGER;
    v_weekly_hours JSONB;
    v_day_name TEXT;
    v_day_slots JSONB;
BEGIN
    -- Get appointment type details
    SELECT
        t.availability_schedule_id,
        s.timezone,
        t.duration_minutes,
        t.buffer_before_minutes,
        t.buffer_after_minutes,
        s.weekly_hours
    INTO v_schedule_id, v_timezone, v_duration, v_buffer_before, v_buffer_after, v_weekly_hours
    FROM ibird_appointment_types t
    JOIN ibird_availability_schedules s ON s.id = t.availability_schedule_id
    WHERE t.id = p_type_id;

    IF v_schedule_id IS NULL THEN
        RETURN;
    END IF;

    -- Check for date override
    SELECT o.slots INTO v_day_slots
    FROM ibird_availability_overrides o
    WHERE o.schedule_id = v_schedule_id AND o.date = p_date AND o.is_available = TRUE;

    IF v_day_slots IS NULL THEN
        -- Use weekly hours
        v_day_name := lower(to_char(p_date, 'Day'));
        v_day_name := trim(v_day_name);
        v_day_slots := v_weekly_hours->v_day_name;
    END IF;

    -- Return slots (actual slot calculation would need more complex logic)
    RETURN QUERY
    SELECT
        (elem->>'start')::TIME as start_time,
        (elem->>'end')::TIME as end_time
    FROM jsonb_array_elements(v_day_slots) elem;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pending reminders view
CREATE OR REPLACE VIEW ibird_pending_reminders AS
SELECT
    r.id as reminder_id,
    r.event_id,
    r.reminder_type,
    r.minutes_before,
    e.title as event_title,
    e.start_time as event_start,
    c.user_id,
    (e.start_time - (r.minutes_before || ' minutes')::INTERVAL) as reminder_time
FROM ibird_calendar_reminders r
JOIN ibird_calendar_events e ON e.id = r.event_id
JOIN ibird_calendars c ON c.id = e.calendar_id
WHERE r.is_sent = FALSE
    AND e.start_time > NOW()
    AND (e.start_time - (r.minutes_before || ' minutes')::INTERVAL) <= NOW() + INTERVAL '5 minutes';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ibird_mail_accounts IS 'Email accounts with IMAP/SMTP credentials';
COMMENT ON TABLE ibird_mail_folders IS 'IMAP folders/mailboxes for each account';
COMMENT ON TABLE ibird_mail_messages IS 'Email messages with headers and content';
COMMENT ON TABLE ibird_mail_attachments IS 'Email attachments metadata';
COMMENT ON TABLE ibird_mail_labels IS 'Custom labels/tags for messages';
COMMENT ON TABLE ibird_calendars IS 'User calendars (local and synced)';
COMMENT ON TABLE ibird_calendar_events IS 'Calendar events with recurrence support';
COMMENT ON TABLE ibird_calendar_reminders IS 'Event reminders';
COMMENT ON TABLE ibird_calendar_tasks IS 'Calendar tasks/todos';
COMMENT ON TABLE ibird_appointment_types IS 'Bookable appointment configurations';
COMMENT ON TABLE ibird_availability_schedules IS 'Weekly availability templates';
COMMENT ON TABLE ibird_availability_overrides IS 'Date-specific availability changes';
COMMENT ON TABLE ibird_bookings IS 'Scheduled appointments/meetings';
COMMENT ON TABLE ibird_user_settings IS 'User preferences for iBird';
COMMENT ON TABLE ibird_contacts IS 'Contact autocomplete cache';
