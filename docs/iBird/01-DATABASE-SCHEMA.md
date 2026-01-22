# iBird - Database Schema

> Complete PostgreSQL schema for the iBird email, calendar, and appointment system

---

## Migration File: `007_ibird_system.sql`

```sql
-- ============================================================================
-- iBird System Tables
-- Migration: 007_ibird_system.sql
-- Description: Email, Calendar, and Appointment booking system
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: USER & ACCOUNT MANAGEMENT
-- ============================================================================

-- User profiles for iBird
CREATE TABLE ibird_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,              -- Links to main auth system
    display_name VARCHAR(255),
    avatar_url TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',             -- '12h' or '24h'
    week_starts_on SMALLINT DEFAULT 0,                 -- 0=Sunday, 1=Monday
    theme VARCHAR(20) DEFAULT 'system',                -- 'light', 'dark', 'system'

    -- Appointment booking settings
    booking_username VARCHAR(100) UNIQUE,              -- For public booking URLs
    booking_enabled BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_users_user_id ON ibird_users(user_id);
CREATE INDEX idx_ibird_users_booking_username ON ibird_users(booking_username);

-- ============================================================================
-- SECTION 2: EMAIL SYSTEM
-- ============================================================================

-- Email accounts (IMAP/SMTP connections)
CREATE TABLE ibird_mail_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Account info
    name VARCHAR(255) NOT NULL,                        -- Display name
    email VARCHAR(255) NOT NULL,                       -- Email address
    provider VARCHAR(50),                              -- 'google', 'microsoft', 'yahoo', 'custom'

    -- IMAP settings
    imap_host VARCHAR(255) NOT NULL,
    imap_port INTEGER DEFAULT 993,
    imap_secure BOOLEAN DEFAULT true,                  -- TLS/SSL
    imap_username VARCHAR(255),
    imap_password_encrypted BYTEA,                     -- Encrypted password

    -- SMTP settings
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_secure VARCHAR(20) DEFAULT 'starttls',        -- 'none', 'ssl', 'starttls'
    smtp_username VARCHAR(255),
    smtp_password_encrypted BYTEA,

    -- OAuth tokens (for Google/Microsoft)
    oauth_access_token_encrypted BYTEA,
    oauth_refresh_token_encrypted BYTEA,
    oauth_expires_at TIMESTAMPTZ,
    oauth_scope TEXT,

    -- Sync state
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,

    -- Settings
    is_default BOOLEAN DEFAULT false,
    color VARCHAR(7) DEFAULT '#007AFF',                -- Account color

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_accounts_user_id ON ibird_mail_accounts(user_id);
CREATE INDEX idx_ibird_mail_accounts_email ON ibird_mail_accounts(email);

-- Email identities (sender identities per account)
CREATE TABLE ibird_mail_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,                        -- Display name
    email VARCHAR(255) NOT NULL,                       -- From address
    reply_to VARCHAR(255),                             -- Reply-to address
    signature_html TEXT,                               -- HTML signature
    signature_text TEXT,                               -- Plain text signature
    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_identities_account_id ON ibird_mail_identities(account_id);

-- Email folders
CREATE TABLE ibird_mail_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,

    -- Folder info
    name VARCHAR(255) NOT NULL,                        -- Display name
    path VARCHAR(1000) NOT NULL,                       -- Full IMAP path
    parent_id UUID REFERENCES ibird_mail_folders(id) ON DELETE CASCADE,

    -- Folder type
    folder_type VARCHAR(50) DEFAULT 'custom',          -- 'inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom'

    -- Counts
    total_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,

    -- IMAP state
    uidvalidity BIGINT,
    uidnext BIGINT,
    highest_modseq BIGINT,

    -- Settings
    is_subscribed BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_folders_account_id ON ibird_mail_folders(account_id);
CREATE INDEX idx_ibird_mail_folders_parent_id ON ibird_mail_folders(parent_id);
CREATE INDEX idx_ibird_mail_folders_path ON ibird_mail_folders(account_id, path);
CREATE INDEX idx_ibird_mail_folders_type ON ibird_mail_folders(account_id, folder_type);

-- Email messages
CREATE TABLE ibird_mail_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL REFERENCES ibird_mail_folders(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ibird_mail_accounts(id) ON DELETE CASCADE,

    -- Message identifiers
    message_id VARCHAR(500),                           -- Message-ID header
    uid BIGINT NOT NULL,                               -- IMAP UID

    -- Threading
    thread_id UUID,                                    -- Conversation thread ID
    in_reply_to VARCHAR(500),                          -- In-Reply-To header
    references_list TEXT[],                            -- References header

    -- Headers
    subject TEXT,
    from_address JSONB NOT NULL,                       -- {name, email}
    to_addresses JSONB DEFAULT '[]',                   -- [{name, email}, ...]
    cc_addresses JSONB DEFAULT '[]',
    bcc_addresses JSONB DEFAULT '[]',
    reply_to_address JSONB,

    -- Dates
    date_sent TIMESTAMPTZ,
    date_received TIMESTAMPTZ DEFAULT NOW(),

    -- Content
    body_text TEXT,                                    -- Plain text body
    body_html TEXT,                                    -- HTML body
    snippet TEXT,                                      -- Preview snippet
    has_attachments BOOLEAN DEFAULT false,

    -- Size
    size_bytes INTEGER DEFAULT 0,

    -- Flags
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,

    -- Labels/Tags
    labels TEXT[] DEFAULT '{}',

    -- Raw storage
    raw_headers TEXT,                                  -- Full headers

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_messages_folder_id ON ibird_mail_messages(folder_id);
CREATE INDEX idx_ibird_mail_messages_account_id ON ibird_mail_messages(account_id);
CREATE INDEX idx_ibird_mail_messages_thread_id ON ibird_mail_messages(thread_id);
CREATE INDEX idx_ibird_mail_messages_message_id ON ibird_mail_messages(message_id);
CREATE INDEX idx_ibird_mail_messages_date_received ON ibird_mail_messages(date_received DESC);
CREATE INDEX idx_ibird_mail_messages_is_read ON ibird_mail_messages(folder_id, is_read);
CREATE INDEX idx_ibird_mail_messages_is_starred ON ibird_mail_messages(account_id, is_starred);
CREATE INDEX idx_ibird_mail_messages_labels ON ibird_mail_messages USING GIN(labels);

-- Full-text search index
CREATE INDEX idx_ibird_mail_messages_fts ON ibird_mail_messages
    USING GIN(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')));

-- Email attachments
CREATE TABLE ibird_mail_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ibird_mail_messages(id) ON DELETE CASCADE,

    -- Attachment info
    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(255),
    size_bytes INTEGER DEFAULT 0,
    content_id VARCHAR(255),                           -- For inline attachments

    -- Storage
    storage_path TEXT,                                 -- Local or S3 path
    storage_type VARCHAR(50) DEFAULT 'local',          -- 'local', 's3'

    -- Flags
    is_inline BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_attachments_message_id ON ibird_mail_attachments(message_id);

-- Email labels/tags
CREATE TABLE ibird_mail_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

CREATE INDEX idx_ibird_mail_labels_user_id ON ibird_mail_labels(user_id);

-- Email drafts (separate from messages for autosave)
CREATE TABLE ibird_mail_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES ibird_mail_accounts(id) ON DELETE SET NULL,
    identity_id UUID REFERENCES ibird_mail_identities(id) ON DELETE SET NULL,

    -- Draft type
    draft_type VARCHAR(20) DEFAULT 'new',              -- 'new', 'reply', 'reply_all', 'forward'
    original_message_id UUID REFERENCES ibird_mail_messages(id) ON DELETE SET NULL,

    -- Content
    to_addresses JSONB DEFAULT '[]',
    cc_addresses JSONB DEFAULT '[]',
    bcc_addresses JSONB DEFAULT '[]',
    subject TEXT,
    body_html TEXT,
    body_text TEXT,

    -- Attachments stored separately

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_drafts_user_id ON ibird_mail_drafts(user_id);

-- Draft attachments
CREATE TABLE ibird_mail_draft_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES ibird_mail_drafts(id) ON DELETE CASCADE,

    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(255),
    size_bytes INTEGER DEFAULT 0,
    storage_path TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_mail_draft_attachments_draft_id ON ibird_mail_draft_attachments(draft_id);

-- ============================================================================
-- SECTION 3: CALENDAR SYSTEM
-- ============================================================================

-- Calendars
CREATE TABLE ibird_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Calendar info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007AFF',

    -- Calendar type
    calendar_type VARCHAR(50) DEFAULT 'local',         -- 'local', 'caldav', 'google', 'ical'

    -- Remote sync settings (for CalDAV/Google)
    remote_url TEXT,
    remote_username VARCHAR(255),
    remote_password_encrypted BYTEA,
    oauth_access_token_encrypted BYTEA,
    oauth_refresh_token_encrypted BYTEA,
    oauth_expires_at TIMESTAMPTZ,

    -- Sync state
    sync_token TEXT,                                   -- CalDAV sync token
    ctag TEXT,                                         -- CalDAV ctag
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,

    -- Settings
    is_visible BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,
    timezone VARCHAR(100) DEFAULT 'UTC',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendars_user_id ON ibird_calendars(user_id);

-- Calendar events
CREATE TABLE ibird_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES ibird_calendars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Event identifiers
    uid VARCHAR(500) NOT NULL,                         -- iCalendar UID
    etag VARCHAR(255),                                 -- CalDAV ETag
    remote_url TEXT,                                   -- CalDAV resource URL

    -- Basic info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(100),

    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,                              -- RRULE string
    recurrence_id TIMESTAMPTZ,                         -- For recurrence exceptions
    master_event_id UUID REFERENCES ibird_calendar_events(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(20) DEFAULT 'confirmed',            -- 'tentative', 'confirmed', 'cancelled'
    transparency VARCHAR(20) DEFAULT 'opaque',         -- 'opaque' (busy), 'transparent' (free)

    -- Classification
    classification VARCHAR(20) DEFAULT 'public',       -- 'public', 'private', 'confidential'

    -- Organizer & Attendees
    organizer JSONB,                                   -- {name, email}
    attendees JSONB DEFAULT '[]',                      -- [{name, email, status, role}, ...]

    -- Reminder handled separately

    -- Raw iCalendar
    icalendar_data TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_events_calendar_id ON ibird_calendar_events(calendar_id);
CREATE INDEX idx_ibird_calendar_events_user_id ON ibird_calendar_events(user_id);
CREATE INDEX idx_ibird_calendar_events_uid ON ibird_calendar_events(uid);
CREATE INDEX idx_ibird_calendar_events_start_time ON ibird_calendar_events(start_time);
CREATE INDEX idx_ibird_calendar_events_end_time ON ibird_calendar_events(end_time);
CREATE INDEX idx_ibird_calendar_events_time_range ON ibird_calendar_events(calendar_id, start_time, end_time);
CREATE INDEX idx_ibird_calendar_events_master ON ibird_calendar_events(master_event_id);

-- Event reminders
CREATE TABLE ibird_calendar_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES ibird_calendar_events(id) ON DELETE CASCADE,

    -- Reminder timing
    trigger_type VARCHAR(20) DEFAULT 'relative',       -- 'relative', 'absolute'
    trigger_value INTEGER,                             -- Minutes before (negative) or after (positive)
    trigger_absolute TIMESTAMPTZ,                      -- For absolute triggers
    trigger_relation VARCHAR(10) DEFAULT 'start',      -- 'start', 'end'

    -- Reminder action
    action VARCHAR(20) DEFAULT 'display',              -- 'display', 'email', 'audio'

    -- State
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_reminders_event_id ON ibird_calendar_reminders(event_id);
CREATE INDEX idx_ibird_calendar_reminders_trigger ON ibird_calendar_reminders(trigger_absolute)
    WHERE trigger_type = 'absolute' AND is_acknowledged = false;

-- Tasks/Todos
CREATE TABLE ibird_calendar_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES ibird_calendars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Task identifiers
    uid VARCHAR(500) NOT NULL,
    etag VARCHAR(255),
    remote_url TEXT,

    -- Basic info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) DEFAULT 'needs-action',         -- 'needs-action', 'in-progress', 'completed', 'cancelled'
    percent_complete INTEGER DEFAULT 0,                -- 0-100

    -- Priority (1=highest, 9=lowest, 0=undefined)
    priority SMALLINT DEFAULT 0,

    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,

    -- Classification
    classification VARCHAR(20) DEFAULT 'public',

    -- Raw iCalendar
    icalendar_data TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_tasks_calendar_id ON ibird_calendar_tasks(calendar_id);
CREATE INDEX idx_ibird_calendar_tasks_user_id ON ibird_calendar_tasks(user_id);
CREATE INDEX idx_ibird_calendar_tasks_due_date ON ibird_calendar_tasks(due_date);
CREATE INDEX idx_ibird_calendar_tasks_status ON ibird_calendar_tasks(user_id, status);

-- Task reminders
CREATE TABLE ibird_calendar_task_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES ibird_calendar_tasks(id) ON DELETE CASCADE,

    trigger_type VARCHAR(20) DEFAULT 'relative',
    trigger_value INTEGER,
    trigger_absolute TIMESTAMPTZ,
    trigger_relation VARCHAR(10) DEFAULT 'due',        -- 'start', 'due'

    action VARCHAR(20) DEFAULT 'display',

    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_calendar_task_reminders_task_id ON ibird_calendar_task_reminders(task_id);

-- ============================================================================
-- SECTION 4: APPOINTMENT BOOKING SYSTEM
-- ============================================================================

-- Appointment types (booking page configurations)
CREATE TABLE ibird_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Appointment info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,                        -- URL slug
    description TEXT,

    -- Location
    location_type VARCHAR(20) DEFAULT 'online',        -- 'online', 'in_person', 'phone'
    location_value TEXT,                               -- URL, address, or phone
    meeting_link_provider VARCHAR(20),                 -- 'zoom', 'google_meet', 'custom', NULL

    -- Duration
    duration_minutes INTEGER DEFAULT 30,

    -- Status
    status VARCHAR(20) DEFAULT 'active',               -- 'draft', 'active', 'inactive'

    -- Settings
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, slug)
);

CREATE INDEX idx_ibird_appointments_user_id ON ibird_appointments(user_id);
CREATE INDEX idx_ibird_appointments_slug ON ibird_appointments(user_id, slug);

-- Availability schedules
CREATE TABLE ibird_availability_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES ibird_appointments(id) ON DELETE CASCADE,

    -- Schedule name (for multiple schedules)
    name VARCHAR(255) DEFAULT 'Default',

    -- Calendar to check for conflicts
    calendar_id UUID REFERENCES ibird_calendars(id) ON DELETE SET NULL,

    -- Timezone
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Booking window
    minimum_notice_hours INTEGER DEFAULT 24,           -- How far in advance
    booking_window_days INTEGER DEFAULT 60,            -- How far into future

    -- Auto-confirm
    auto_confirm BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_availability_schedules_user_id ON ibird_availability_schedules(user_id);
CREATE INDEX idx_ibird_availability_schedules_appointment_id ON ibird_availability_schedules(appointment_id);

-- Availability time slots (weekly recurring)
CREATE TABLE ibird_availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES ibird_availability_schedules(id) ON DELETE CASCADE,

    -- Day of week (0=Sunday, 6=Saturday)
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

    -- Time range (in schedule timezone)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Slot duration override (NULL = use appointment default)
    slot_duration_minutes INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (end_time > start_time)
);

CREATE INDEX idx_ibird_availability_slots_schedule_id ON ibird_availability_slots(schedule_id);
CREATE INDEX idx_ibird_availability_slots_day ON ibird_availability_slots(schedule_id, day_of_week);

-- Availability exceptions (specific dates)
CREATE TABLE ibird_availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES ibird_availability_schedules(id) ON DELETE CASCADE,

    -- Exception date
    exception_date DATE NOT NULL,

    -- Type: 'unavailable' = blocked, 'available' = custom hours
    exception_type VARCHAR(20) DEFAULT 'unavailable',

    -- Custom hours (for 'available' type)
    start_time TIME,
    end_time TIME,

    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(schedule_id, exception_date)
);

CREATE INDEX idx_ibird_availability_exceptions_schedule_id ON ibird_availability_exceptions(schedule_id);
CREATE INDEX idx_ibird_availability_exceptions_date ON ibird_availability_exceptions(exception_date);

-- Bookings
CREATE TABLE ibird_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES ibird_appointments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Attendee info
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(50),
    attendee_notes TEXT,
    attendee_timezone VARCHAR(100),

    -- Booking time
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending',              -- 'pending', 'confirmed', 'declined', 'cancelled'

    -- Cancellation/decline info
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(20),                          -- 'organizer', 'attendee'
    cancellation_reason TEXT,

    -- Meeting link (generated)
    meeting_link TEXT,
    meeting_link_provider VARCHAR(20),

    -- Calendar event reference
    calendar_event_id UUID REFERENCES ibird_calendar_events(id) ON DELETE SET NULL,

    -- Tokens for booking management
    confirmation_token VARCHAR(100),
    management_token VARCHAR(100),

    -- Timestamps
    confirmed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_bookings_appointment_id ON ibird_bookings(appointment_id);
CREATE INDEX idx_ibird_bookings_user_id ON ibird_bookings(user_id);
CREATE INDEX idx_ibird_bookings_start_time ON ibird_bookings(start_time);
CREATE INDEX idx_ibird_bookings_status ON ibird_bookings(appointment_id, status);
CREATE INDEX idx_ibird_bookings_attendee_email ON ibird_bookings(attendee_email);
CREATE INDEX idx_ibird_bookings_confirmation_token ON ibird_bookings(confirmation_token);
CREATE INDEX idx_ibird_bookings_management_token ON ibird_bookings(management_token);

-- ============================================================================
-- SECTION 5: CONNECTED SERVICES
-- ============================================================================

-- External service connections (Zoom, etc.)
CREATE TABLE ibird_external_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Service info
    service_type VARCHAR(50) NOT NULL,                 -- 'zoom', 'google_meet', 'teams'

    -- OAuth tokens
    access_token_encrypted BYTEA,
    refresh_token_encrypted BYTEA,
    expires_at TIMESTAMPTZ,
    scope TEXT,

    -- Account info
    external_account_id VARCHAR(255),
    external_account_email VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, service_type)
);

CREATE INDEX idx_ibird_external_connections_user_id ON ibird_external_connections(user_id);

-- ============================================================================
-- SECTION 6: CONTACTS
-- ============================================================================

-- Contact list (for autocomplete)
CREATE TABLE ibird_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Contact info
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,

    -- Source
    source VARCHAR(50) DEFAULT 'manual',               -- 'manual', 'email', 'import'

    -- Frequency (for smart sorting)
    interaction_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, email)
);

CREATE INDEX idx_ibird_contacts_user_id ON ibird_contacts(user_id);
CREATE INDEX idx_ibird_contacts_email ON ibird_contacts(email);
CREATE INDEX idx_ibird_contacts_interaction ON ibird_contacts(user_id, interaction_count DESC);

-- ============================================================================
-- SECTION 7: SYNC & AUDIT
-- ============================================================================

-- Sync status tracking
CREATE TABLE ibird_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Resource being synced
    resource_type VARCHAR(50) NOT NULL,                -- 'mail_account', 'calendar'
    resource_id UUID NOT NULL,

    -- Sync state
    status VARCHAR(20) DEFAULT 'idle',                 -- 'idle', 'syncing', 'error'
    progress INTEGER DEFAULT 0,                        -- 0-100

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Error info
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(resource_type, resource_id)
);

CREATE INDEX idx_ibird_sync_status_resource ON ibird_sync_status(resource_type, resource_id);

-- Activity log
CREATE TABLE ibird_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ibird_users(id) ON DELETE CASCADE,

    -- Activity info
    activity_type VARCHAR(50) NOT NULL,                -- 'email_sent', 'event_created', 'booking_confirmed', etc.
    resource_type VARCHAR(50),
    resource_id UUID,

    -- Details
    details JSONB,

    -- IP and user agent
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ibird_activity_log_user_id ON ibird_activity_log(user_id, created_at DESC);
CREATE INDEX idx_ibird_activity_log_resource ON ibird_activity_log(resource_type, resource_id);

-- ============================================================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION ibird_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER ibird_users_updated_at
    BEFORE UPDATE ON ibird_users
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_mail_accounts_updated_at
    BEFORE UPDATE ON ibird_mail_accounts
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_mail_identities_updated_at
    BEFORE UPDATE ON ibird_mail_identities
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_mail_folders_updated_at
    BEFORE UPDATE ON ibird_mail_folders
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_mail_messages_updated_at
    BEFORE UPDATE ON ibird_mail_messages
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_mail_drafts_updated_at
    BEFORE UPDATE ON ibird_mail_drafts
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_calendars_updated_at
    BEFORE UPDATE ON ibird_calendars
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_calendar_events_updated_at
    BEFORE UPDATE ON ibird_calendar_events
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_calendar_tasks_updated_at
    BEFORE UPDATE ON ibird_calendar_tasks
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_appointments_updated_at
    BEFORE UPDATE ON ibird_appointments
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_availability_schedules_updated_at
    BEFORE UPDATE ON ibird_availability_schedules
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

CREATE TRIGGER ibird_bookings_updated_at
    BEFORE UPDATE ON ibird_bookings
    FOR EACH ROW EXECUTE FUNCTION ibird_update_updated_at();

-- Function to calculate next reminder time
CREATE OR REPLACE FUNCTION ibird_calculate_reminder_time(
    p_event_start TIMESTAMPTZ,
    p_event_end TIMESTAMPTZ,
    p_trigger_type VARCHAR,
    p_trigger_value INTEGER,
    p_trigger_absolute TIMESTAMPTZ,
    p_trigger_relation VARCHAR
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    IF p_trigger_type = 'absolute' THEN
        RETURN p_trigger_absolute;
    ELSE
        IF p_trigger_relation = 'end' THEN
            RETURN p_event_end + (p_trigger_value * INTERVAL '1 minute');
        ELSE
            RETURN p_event_start + (p_trigger_value * INTERVAL '1 minute');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for pending reminders
CREATE OR REPLACE VIEW ibird_pending_reminders AS
SELECT
    r.id,
    r.event_id,
    e.title AS event_title,
    e.start_time AS event_start,
    e.end_time AS event_end,
    e.calendar_id,
    c.user_id,
    ibird_calculate_reminder_time(
        e.start_time, e.end_time,
        r.trigger_type, r.trigger_value, r.trigger_absolute, r.trigger_relation
    ) AS reminder_time,
    r.action
FROM ibird_calendar_reminders r
JOIN ibird_calendar_events e ON r.event_id = e.id
JOIN ibird_calendars c ON e.calendar_id = c.id
WHERE r.is_acknowledged = false
  AND (r.snoozed_until IS NULL OR r.snoozed_until <= NOW())
  AND e.status != 'cancelled';

-- ============================================================================
-- SECTION 9: INITIAL DATA
-- ============================================================================

-- No initial data required - users and accounts created on signup

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
```

---

## Table Summary

| Table | Purpose | Records Est. |
|-------|---------|--------------|
| `ibird_users` | User profiles and preferences | 1 per user |
| `ibird_mail_accounts` | Email account connections | 1-5 per user |
| `ibird_mail_identities` | Sender identities | 1-3 per account |
| `ibird_mail_folders` | Email folders | 10-50 per account |
| `ibird_mail_messages` | Email messages | 1000s per account |
| `ibird_mail_attachments` | Message attachments | Variable |
| `ibird_mail_labels` | Custom labels/tags | 5-20 per user |
| `ibird_mail_drafts` | Unsent drafts | 0-10 per user |
| `ibird_mail_draft_attachments` | Draft attachments | Variable |
| `ibird_calendars` | Calendar definitions | 1-10 per user |
| `ibird_calendar_events` | Calendar events | 100s per calendar |
| `ibird_calendar_reminders` | Event reminders | 1-3 per event |
| `ibird_calendar_tasks` | Todo items | 10-100 per user |
| `ibird_calendar_task_reminders` | Task reminders | 0-2 per task |
| `ibird_appointments` | Booking page configs | 1-5 per user |
| `ibird_availability_schedules` | Availability definitions | 1-3 per user |
| `ibird_availability_slots` | Weekly time slots | 5-14 per schedule |
| `ibird_availability_exceptions` | Date overrides | 0-50 per schedule |
| `ibird_bookings` | Appointment bookings | Variable |
| `ibird_external_connections` | Third-party integrations | 0-5 per user |
| `ibird_contacts` | Contact list | 10-1000 per user |
| `ibird_sync_status` | Sync state tracking | Per resource |
| `ibird_activity_log` | Audit trail | Many |

---

## Encryption Note

Sensitive fields use `BYTEA` type for encrypted storage:
- Passwords
- OAuth tokens
- API keys

Encryption/decryption should be handled at the application layer using a symmetric key stored in environment variables.

---

*Document: 01-DATABASE-SCHEMA.md*
*Version: 1.0*
