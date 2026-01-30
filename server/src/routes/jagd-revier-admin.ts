/**
 * Jagd Revier Admin Routes
 *
 * Per-revier administration endpoints for managing members,
 * invitations, roles, and revier-level operations.
 */

import { Elysia } from 'elysia';
import { randomUUID } from 'crypto';
import { loggerPlugin, dbLogger } from '../plugins/logger';

// ============================================================================
// Types
// ============================================================================

type RevierRole = 'jagdpaechter' | 'jagdaufseher' | 'freund' | 'gast' | 'behoerde' | 'lieferant' | 'bauer';

interface RevierMember {
    id: string;
    revierId: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    role: RevierRole;
    invitedBy?: string;
    validFrom: string;
    validUntil?: string;
    permissions: Record<string, Record<string, boolean>>;
    notes?: string;
    isActive: boolean;
    createdAt: string;
}

interface RevierInvitation {
    id: string;
    revierId: string;
    email: string;
    name?: string;
    role: RevierRole;
    invitedBy: string;
    invitedByName?: string;
    token: string;
    message?: string;
    validFrom: string;
    validUntil?: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
}

interface RolePermissionTemplate {
    role: RevierRole;
    displayName: string;
    description: string;
    permissions: Record<string, Record<string, boolean>>;
}

// ============================================================================
// Role Hierarchy & Permissions
// ============================================================================

const ROLE_HIERARCHY: Record<RevierRole, number> = {
    jagdpaechter: 100,
    jagdaufseher: 80,
    freund: 50,
    gast: 20,
    behoerde: 30,
    lieferant: 10,
    bauer: 15,
};

const ROLE_TEMPLATES: RolePermissionTemplate[] = [
    {
        role: 'jagdpaechter',
        displayName: 'Jagdpächter',
        description: 'Revierinhaber/Pächter mit vollen Rechten',
        permissions: {
            hunt: { create: true, view: true, join: true, manage: true },
            users: { invite: true, remove: true, viewList: true, manageRoles: true },
            documents: { view: true, upload: true, export: true, delete: true },
            equipment: { view: true, manage: true },
            statistics: { view: true, export: true },
            settings: { view: true, manage: true },
            billing: { view: true, manage: true },
            damage_reports: { create: true, view: true, manage: true },
        },
    },
    {
        role: 'jagdaufseher',
        displayName: 'Jagdaufseher',
        description: 'Revieraufseher mit Verwaltungsrechten',
        permissions: {
            hunt: { create: true, view: true, join: true, manage: true },
            users: { invite: true, remove: false, viewList: true, manageRoles: false },
            documents: { view: true, upload: true, export: true, delete: false },
            equipment: { view: true, manage: true },
            statistics: { view: true, export: true },
            settings: { view: true, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: true, view: true, manage: true },
        },
    },
    {
        role: 'freund',
        displayName: 'Freund',
        description: 'Regelmäßiger Jagdgast mit erweiterten Rechten',
        permissions: {
            hunt: { create: false, view: true, join: true, manage: false },
            users: { invite: false, remove: false, viewList: true, manageRoles: false },
            documents: { view: true, upload: false, export: false, delete: false },
            equipment: { view: true, manage: false },
            statistics: { view: true, export: false },
            settings: { view: false, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: true, view: true, manage: false },
        },
    },
    {
        role: 'gast',
        displayName: 'Gast',
        description: 'Eingeladener Gast mit zeitlich begrenztem Zugang',
        permissions: {
            hunt: { create: false, view: true, join: true, manage: false },
            users: { invite: false, remove: false, viewList: false, manageRoles: false },
            documents: { view: false, upload: false, export: false, delete: false },
            equipment: { view: false, manage: false },
            statistics: { view: false, export: false },
            settings: { view: false, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: false, view: false, manage: false },
        },
    },
    {
        role: 'behoerde',
        displayName: 'Behörde',
        description: 'Behördenvertreter mit Lesezugriff für Compliance',
        permissions: {
            hunt: { create: false, view: true, join: false, manage: false },
            users: { invite: false, remove: false, viewList: true, manageRoles: false },
            documents: { view: true, upload: false, export: true, delete: false },
            equipment: { view: true, manage: false },
            statistics: { view: true, export: true },
            settings: { view: false, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: false, view: true, manage: false },
        },
    },
    {
        role: 'lieferant',
        displayName: 'Lieferant',
        description: 'Lieferant für Ausrüstung und Material',
        permissions: {
            hunt: { create: false, view: false, join: false, manage: false },
            users: { invite: false, remove: false, viewList: false, manageRoles: false },
            documents: { view: false, upload: false, export: false, delete: false },
            equipment: { view: true, manage: false },
            statistics: { view: false, export: false },
            settings: { view: false, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: false, view: false, manage: false },
        },
    },
    {
        role: 'bauer',
        displayName: 'Bauer/Landwirt',
        description: 'Landwirt zur Wildschadenmeldung',
        permissions: {
            hunt: { create: false, view: true, join: false, manage: false },
            users: { invite: false, remove: false, viewList: false, manageRoles: false },
            documents: { view: false, upload: false, export: false, delete: false },
            equipment: { view: false, manage: false },
            statistics: { view: false, export: false },
            settings: { view: false, manage: false },
            billing: { view: false, manage: false },
            damage_reports: { create: true, view: true, manage: false },
        },
    },
];

// ============================================================================
// Mock Data
// ============================================================================

const mockMembers: RevierMember[] = [
    {
        id: 'mem-1',
        revierId: 'revier-1',
        userId: 'user-1',
        userName: 'Hans Müller',
        userEmail: 'hans@beispiel.de',
        role: 'jagdpaechter',
        validFrom: '2024-01-01T00:00:00Z',
        permissions: {},
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'mem-2',
        revierId: 'revier-1',
        userId: 'user-2',
        userName: 'Klaus Schmidt',
        userEmail: 'klaus@beispiel.de',
        role: 'jagdaufseher',
        invitedBy: 'user-1',
        validFrom: '2024-03-15T00:00:00Z',
        permissions: {},
        isActive: true,
        createdAt: '2024-03-15T00:00:00Z',
    },
    {
        id: 'mem-3',
        revierId: 'revier-1',
        userId: 'user-3',
        userName: 'Maria Weber',
        userEmail: 'maria@beispiel.de',
        role: 'freund',
        invitedBy: 'user-1',
        validFrom: '2024-06-01T00:00:00Z',
        permissions: {},
        isActive: true,
        createdAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'mem-4',
        revierId: 'revier-1',
        userId: 'user-4',
        userName: 'Thomas Bauer',
        userEmail: 'thomas@farm.de',
        role: 'bauer',
        invitedBy: 'user-1',
        validFrom: '2024-07-01T00:00:00Z',
        permissions: {},
        notes: 'Betreibt den Hof am Waldrand',
        isActive: true,
        createdAt: '2024-07-01T00:00:00Z',
    },
];

const mockInvitations: RevierInvitation[] = [
    {
        id: 'inv-1',
        revierId: 'revier-1',
        email: 'neu@beispiel.de',
        name: 'Neuer Gast',
        role: 'gast',
        invitedBy: 'user-1',
        invitedByName: 'Hans Müller',
        token: 'invite-token-123',
        message: 'Herzlich willkommen zu unserer Drückjagd am 15.02.',
        validFrom: '2026-02-15T00:00:00Z',
        validUntil: '2026-02-16T00:00:00Z',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
    },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getMembership(userId: string, revierId: string): RevierMember | undefined {
    return mockMembers.find((m) => m.userId === userId && m.revierId === revierId && m.isActive);
}

function canManageRole(actorRole: RevierRole, targetRole: RevierRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

function canInvite(membership: RevierMember): boolean {
    const template = ROLE_TEMPLATES.find((t) => t.role === membership.role);
    const perms = { ...template?.permissions, ...membership.permissions };
    return perms.users?.invite === true;
}

function generateInviteToken(): string {
    return randomUUID().replace(/-/g, '');
}

// ============================================================================
// Routes
// ============================================================================

export function createJagdRevierAdminRoutes() {
    return new Elysia({ prefix: '/api/v1/reviere' })
        .use(loggerPlugin)

        // =========================================================================
        // Context Derivation
        // =========================================================================

        .derive(({ headers }) => {
            // In production, extract user from JWT/session
            const userId = headers['x-user-id'] || 'user-1';
            return { currentUserId: userId };
        })

        // =========================================================================
        // Role Templates
        // =========================================================================

        .get('/roles', async () => {
            return { roles: ROLE_TEMPLATES };
        })

        // =========================================================================
        // Member Management
        // =========================================================================

        .get('/:revierId/members', async ({ params, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership) {
                return { error: 'Kein Zugriff auf dieses Revier', code: 403 };
            }

            // Check if user can view member list
            const template = ROLE_TEMPLATES.find((t) => t.role === membership.role);
            const perms = { ...template?.permissions, ...membership.permissions };

            if (!perms.users?.viewList) {
                return { error: 'Keine Berechtigung zum Anzeigen der Mitglieder', code: 403 };
            }

            try {
                const members = mockMembers
                    .filter((m) => m.revierId === params.revierId && m.isActive)
                    .sort((a, b) => ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role]);

                return { members };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch members');
                return { members: [] };
            }
        })

        .post('/:revierId/members', async ({ params, body, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership || !canInvite(membership)) {
                return { error: 'Keine Berechtigung zum Hinzufügen von Mitgliedern', code: 403 };
            }

            try {
                const { userId, userName, userEmail, role, notes } = body as {
                    userId: string;
                    userName?: string;
                    userEmail?: string;
                    role: RevierRole;
                    notes?: string;
                };

                // Check role hierarchy
                if (!canManageRole(membership.role, role)) {
                    return { error: 'Sie können keine Mitglieder mit dieser Rolle hinzufügen', code: 403 };
                }

                // Check if already member
                const existing = mockMembers.find(
                    (m) => m.userId === userId && m.revierId === params.revierId
                );
                if (existing && existing.isActive) {
                    return { error: 'Benutzer ist bereits Mitglied', code: 400 };
                }

                const newMember: RevierMember = {
                    id: randomUUID(),
                    revierId: params.revierId,
                    userId,
                    userName,
                    userEmail,
                    role,
                    invitedBy: currentUserId,
                    validFrom: new Date().toISOString(),
                    permissions: {},
                    notes,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                };

                mockMembers.push(newMember);

                dbLogger.info({ revierId: params.revierId, userId, role }, 'Member added');
                return { member: newMember };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to add member');
                return { error: 'Fehler beim Hinzufügen des Mitglieds' };
            }
        })

        .put('/:revierId/members/:userId', async ({ params, body, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership) {
                return { error: 'Kein Zugriff auf dieses Revier', code: 403 };
            }

            try {
                const targetMember = mockMembers.find(
                    (m) => m.userId === params.userId && m.revierId === params.revierId && m.isActive
                );

                if (!targetMember) {
                    return { error: 'Mitglied nicht gefunden', code: 404 };
                }

                const { role, permissions, notes, validUntil } = body as {
                    role?: RevierRole;
                    permissions?: Record<string, Record<string, boolean>>;
                    notes?: string;
                    validUntil?: string;
                };

                // Check if changing role
                if (role && role !== targetMember.role) {
                    // Check role hierarchy for both old and new role
                    if (!canManageRole(membership.role, targetMember.role) ||
                        !canManageRole(membership.role, role)) {
                        return { error: 'Keine Berechtigung zum Ändern dieser Rolle', code: 403 };
                    }
                    targetMember.role = role;
                }

                if (permissions !== undefined) {
                    targetMember.permissions = permissions;
                }
                if (notes !== undefined) {
                    targetMember.notes = notes;
                }
                if (validUntil !== undefined) {
                    targetMember.validUntil = validUntil;
                }

                return { member: targetMember };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update member');
                return { error: 'Fehler beim Aktualisieren des Mitglieds' };
            }
        })

        .delete('/:revierId/members/:userId', async ({ params, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership) {
                return { error: 'Kein Zugriff auf dieses Revier', code: 403 };
            }

            try {
                const targetMember = mockMembers.find(
                    (m) => m.userId === params.userId && m.revierId === params.revierId && m.isActive
                );

                if (!targetMember) {
                    return { error: 'Mitglied nicht gefunden', code: 404 };
                }

                // Cannot remove yourself if you're the only Jagdpächter
                if (params.userId === currentUserId && targetMember.role === 'jagdpaechter') {
                    const otherPaechter = mockMembers.filter(
                        (m) => m.revierId === params.revierId && m.role === 'jagdpaechter' && m.isActive && m.userId !== currentUserId
                    );
                    if (otherPaechter.length === 0) {
                        return { error: 'Es muss mindestens ein Jagdpächter bleiben', code: 400 };
                    }
                }

                // Check role hierarchy
                if (!canManageRole(membership.role, targetMember.role) && params.userId !== currentUserId) {
                    return { error: 'Keine Berechtigung zum Entfernen dieses Mitglieds', code: 403 };
                }

                targetMember.isActive = false;

                dbLogger.info({ revierId: params.revierId, userId: params.userId }, 'Member removed');
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to remove member');
                return { success: false };
            }
        })

        // =========================================================================
        // Invitations
        // =========================================================================

        .get('/:revierId/invitations', async ({ params, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership || !canInvite(membership)) {
                return { error: 'Keine Berechtigung zum Anzeigen der Einladungen', code: 403 };
            }

            try {
                const invitations = mockInvitations
                    .filter((i) => i.revierId === params.revierId && !i.acceptedAt)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                return { invitations };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch invitations');
                return { invitations: [] };
            }
        })

        .post('/:revierId/invitations', async ({ params, body, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership || !canInvite(membership)) {
                return { error: 'Keine Berechtigung zum Einladen', code: 403 };
            }

            try {
                const { email, name, role, message, validFrom, validUntil } = body as {
                    email: string;
                    name?: string;
                    role: RevierRole;
                    message?: string;
                    validFrom?: string;
                    validUntil?: string;
                };

                if (!email || !role) {
                    return { error: 'E-Mail und Rolle sind erforderlich', code: 400 };
                }

                // Check role hierarchy
                if (!canManageRole(membership.role, role)) {
                    return { error: 'Sie können nicht für diese Rolle einladen', code: 403 };
                }

                // Check for existing invitation
                const existingInvite = mockInvitations.find(
                    (i) => i.email === email && i.revierId === params.revierId && !i.acceptedAt &&
                        new Date(i.expiresAt) > new Date()
                );
                if (existingInvite) {
                    return { error: 'Eine aktive Einladung existiert bereits für diese E-Mail', code: 400 };
                }

                const invitation: RevierInvitation = {
                    id: randomUUID(),
                    revierId: params.revierId,
                    email,
                    name,
                    role,
                    invitedBy: currentUserId,
                    invitedByName: membership.userName,
                    token: generateInviteToken(),
                    message,
                    validFrom: validFrom || new Date().toISOString(),
                    validUntil,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                    createdAt: new Date().toISOString(),
                };

                mockInvitations.push(invitation);

                // In production, send email here
                dbLogger.info({ revierId: params.revierId, email, role }, 'Invitation sent');

                return {
                    invitation,
                    inviteLink: `/invitations/${invitation.token}/accept`,
                };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to send invitation');
                return { error: 'Fehler beim Senden der Einladung' };
            }
        })

        .delete('/:revierId/invitations/:invitationId', async ({ params, currentUserId }) => {
            const membership = getMembership(currentUserId, params.revierId);

            if (!membership || !canInvite(membership)) {
                return { error: 'Keine Berechtigung', code: 403 };
            }

            try {
                const idx = mockInvitations.findIndex(
                    (i) => i.id === params.invitationId && i.revierId === params.revierId
                );

                if (idx >= 0) {
                    mockInvitations.splice(idx, 1);
                }

                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to cancel invitation');
                return { success: false };
            }
        })

        // =========================================================================
        // Accept Invitation (Public endpoint)
        // =========================================================================

        .post('/invitations/:token/accept', async ({ params, body }) => {
            try {
                const invitation = mockInvitations.find(
                    (i) => i.token === params.token && !i.acceptedAt
                );

                if (!invitation) {
                    return { error: 'Einladung nicht gefunden oder bereits verwendet', code: 404 };
                }

                if (new Date(invitation.expiresAt) < new Date()) {
                    return { error: 'Einladung ist abgelaufen', code: 400 };
                }

                const { userId, userName } = body as { userId: string; userName?: string };

                // Create membership
                const newMember: RevierMember = {
                    id: randomUUID(),
                    revierId: invitation.revierId,
                    userId,
                    userName: userName || invitation.name,
                    userEmail: invitation.email,
                    role: invitation.role,
                    invitedBy: invitation.invitedBy,
                    validFrom: invitation.validFrom,
                    validUntil: invitation.validUntil,
                    permissions: {},
                    isActive: true,
                    createdAt: new Date().toISOString(),
                };

                mockMembers.push(newMember);
                invitation.acceptedAt = new Date().toISOString();

                dbLogger.info({ revierId: invitation.revierId, userId, role: invitation.role }, 'Invitation accepted');

                return { member: newMember };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to accept invitation');
                return { error: 'Fehler beim Annehmen der Einladung' };
            }
        })

        // =========================================================================
        // My Reviere (User's memberships)
        // =========================================================================

        .get('/me', async ({ currentUserId }) => {
            try {
                const memberships = mockMembers
                    .filter((m) => m.userId === currentUserId && m.isActive)
                    .map((m) => ({
                        ...m,
                        roleDisplay: ROLE_TEMPLATES.find((t) => t.role === m.role)?.displayName,
                    }));

                return { memberships };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch user memberships');
                return { memberships: [] };
            }
        });
}
