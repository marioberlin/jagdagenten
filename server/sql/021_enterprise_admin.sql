-- Jagd-Agenten: Enterprise Multi-Revier Admin Schema
-- Migration 021: Multi-tenant hunting territory management

-- ============================================================================
-- Jagdreviere (Hunting Territories)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jagdreviere (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    description TEXT,
    bundesland TEXT NOT NULL,
    size_hectares DECIMAL(10, 2),
    geojson JSONB, -- Territory boundary polygon
    contact_email TEXT,
    contact_phone TEXT,
    billing_tier TEXT DEFAULT 'standard' CHECK (
        billing_tier IN (
            'free',
            'standard',
            'premium',
            'enterprise'
        )
    ),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL, -- Global admin who created it
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jagdreviere_bundesland ON jagdreviere (bundesland);

CREATE INDEX IF NOT EXISTS idx_jagdreviere_active ON jagdreviere (is_active);

-- ============================================================================
-- Global Admins
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL UNIQUE,
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Revier Memberships (User <-> Revier <-> Role)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revier_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    revier_id UUID NOT NULL REFERENCES jagdreviere (id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN (
            'jagdpaechter', -- Owner/lessee - full access
            'jagdaufseher', -- Gamekeeper - manage hunts, invite users
            'freund', -- Friend/regular hunter - hunt, view data
            'gast', -- Guest - time-limited, specific hunts only
            'behoerde', -- Authority - read-only compliance view
            'lieferant', -- Supplier - view orders, equipment
            'bauer' -- Farmer - report damage, view schedule
        )
    ),
    invited_by UUID,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- NULL = no expiry
    permissions JSONB DEFAULT '{}', -- Override default role permissions
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (revier_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_revier_memberships_user ON revier_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_revier_memberships_revier ON revier_memberships (revier_id);

CREATE INDEX IF NOT EXISTS idx_revier_memberships_role ON revier_memberships (role);

CREATE INDEX IF NOT EXISTS idx_revier_memberships_active ON revier_memberships (is_active);

-- ============================================================================
-- Revier Invitations (pending)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revier_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    revier_id UUID NOT NULL REFERENCES jagdreviere (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL CHECK (
        role IN (
            'jagdpaechter',
            'jagdaufseher',
            'freund',
            'gast',
            'behoerde',
            'lieferant',
            'bauer'
        )
    ),
    invited_by UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    message TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- For guest access expiry
    expires_at TIMESTAMPTZ NOT NULL, -- Invitation expiry
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revier_invitations_token ON revier_invitations (token);

CREATE INDEX IF NOT EXISTS idx_revier_invitations_email ON revier_invitations (email);

CREATE INDEX IF NOT EXISTS idx_revier_invitations_revier ON revier_invitations (revier_id);

-- ============================================================================
-- Role Permission Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'
);

-- Insert default role permissions
INSERT INTO role_permissions (role, display_name, description, permissions) VALUES
  ('jagdpaechter', 'Jagdpächter', 'Revierinhaber/Pächter mit vollen Rechten', '{
    "hunt": {"create": true, "view": true, "join": true, "manage": true},
    "users": {"invite": true, "remove": true, "viewList": true, "manageRoles": true},
    "documents": {"view": true, "upload": true, "export": true, "delete": true},
    "equipment": {"view": true, "manage": true},
    "statistics": {"view": true, "export": true},
    "settings": {"view": true, "manage": true},
    "billing": {"view": true, "manage": true},
    "damage_reports": {"create": true, "view": true, "manage": true}
  }'::jsonb),
  ('jagdaufseher', 'Jagdaufseher', 'Revieraufseher mit Verwaltungsrechten', '{
    "hunt": {"create": true, "view": true, "join": true, "manage": true},
    "users": {"invite": true, "remove": false, "viewList": true, "manageRoles": false},
    "documents": {"view": true, "upload": true, "export": true, "delete": false},
    "equipment": {"view": true, "manage": true},
    "statistics": {"view": true, "export": true},
    "settings": {"view": true, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": true, "view": true, "manage": true}
  }'::jsonb),
  ('freund', 'Freund', 'Regelmäßiger Jagdgast mit erweiterten Rechten', '{
    "hunt": {"create": false, "view": true, "join": true, "manage": false},
    "users": {"invite": false, "remove": false, "viewList": true, "manageRoles": false},
    "documents": {"view": true, "upload": false, "export": false, "delete": false},
    "equipment": {"view": true, "manage": false},
    "statistics": {"view": true, "export": false},
    "settings": {"view": false, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": true, "view": true, "manage": false}
  }'::jsonb),
  ('gast', 'Gast', 'Eingeladener Gast mit zeitlich begrenztem Zugang', '{
    "hunt": {"create": false, "view": true, "join": true, "manage": false},
    "users": {"invite": false, "remove": false, "viewList": false, "manageRoles": false},
    "documents": {"view": false, "upload": false, "export": false, "delete": false},
    "equipment": {"view": false, "manage": false},
    "statistics": {"view": false, "export": false},
    "settings": {"view": false, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": false, "view": false, "manage": false}
  }'::jsonb),
  ('behoerde', 'Behörde', 'Behördenvertreter mit Lesezugriff für Compliance', '{
    "hunt": {"create": false, "view": true, "join": false, "manage": false},
    "users": {"invite": false, "remove": false, "viewList": true, "manageRoles": false},
    "documents": {"view": true, "upload": false, "export": true, "delete": false},
    "equipment": {"view": true, "manage": false},
    "statistics": {"view": true, "export": true},
    "settings": {"view": false, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": false, "view": true, "manage": false}
  }'::jsonb),
  ('lieferant', 'Lieferant', 'Lieferant für Ausrüstung und Material', '{
    "hunt": {"create": false, "view": false, "join": false, "manage": false},
    "users": {"invite": false, "remove": false, "viewList": false, "manageRoles": false},
    "documents": {"view": false, "upload": false, "export": false, "delete": false},
    "equipment": {"view": true, "manage": false},
    "statistics": {"view": false, "export": false},
    "settings": {"view": false, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": false, "view": false, "manage": false}
  }'::jsonb),
  ('bauer', 'Bauer/Landwirt', 'Landwirt zur Wildschadenmeldung', '{
    "hunt": {"create": false, "view": true, "join": false, "manage": false},
    "users": {"invite": false, "remove": false, "viewList": false, "manageRoles": false},
    "documents": {"view": false, "upload": false, "export": false, "delete": false},
    "equipment": {"view": false, "manage": false},
    "statistics": {"view": false, "export": false},
    "settings": {"view": false, "manage": false},
    "billing": {"view": false, "manage": false},
    "damage_reports": {"create": true, "view": true, "manage": false}
  }'::jsonb)
ON CONFLICT (role) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- ============================================================================
-- Membership Activity Log (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    revier_id UUID NOT NULL REFERENCES jagdreviere (id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN (
            'member_added',
            'member_removed',
            'member_role_changed',
            'invitation_sent',
            'invitation_accepted',
            'invitation_cancelled',
            'revier_created',
            'revier_updated',
            'revier_deactivated'
        )
    ),
    target_user_id UUID,
    target_email TEXT,
    old_role TEXT,
    new_role TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_activity_revier ON membership_activity_log (revier_id);

CREATE INDEX IF NOT EXISTS idx_membership_activity_actor ON membership_activity_log (actor_id);

CREATE INDEX IF NOT EXISTS idx_membership_activity_time ON membership_activity_log (created_at);

-- ============================================================================
-- Extend Existing Tables with Revier ID
-- ============================================================================

-- Hunt Sessions
ALTER TABLE hunt_sessions
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_hunt_sessions_revier ON hunt_sessions (revier_id);

-- Equipment Inventory
ALTER TABLE equipment_inventory
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_equipment_inventory_revier ON equipment_inventory (revier_id);

-- Document Vault
ALTER TABLE document_vault
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_document_vault_revier ON document_vault (revier_id);

-- Pack Events
ALTER TABLE pack_events
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_pack_events_revier ON pack_events (revier_id);

-- Guest Permits
ALTER TABLE guest_permits
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_guest_permits_revier ON guest_permits (revier_id);

-- Export Packs
ALTER TABLE export_packs
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_export_packs_revier ON export_packs (revier_id);

-- Hunt Stands
ALTER TABLE hunt_stands
ADD COLUMN IF NOT EXISTS revier_id UUID REFERENCES jagdreviere (id);

CREATE INDEX IF NOT EXISTS idx_hunt_stands_revier ON hunt_stands (revier_id);

-- Revier Boundaries (link to jagdreviere)
ALTER TABLE revier_boundaries
ADD COLUMN IF NOT EXISTS jagdrevier_id UUID REFERENCES jagdreviere (id);