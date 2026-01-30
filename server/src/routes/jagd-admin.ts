/**
 * Jagd Admin Routes
 *
 * Global admin endpoints for managing Jagdreviere (hunting territories),
 * global administrators, and platform-level operations.
 */

import { Elysia } from 'elysia';
import { randomUUID } from 'crypto';
import { loggerPlugin, dbLogger } from '../plugins/logger';

// ============================================================================
// Types
// ============================================================================

interface Jagdrevier {
    id: string;
    name: string;
    description?: string;
    bundesland: string;
    sizeHectares?: number;
    geojson?: object;
    contactEmail?: string;
    contactPhone?: string;
    billingTier: 'free' | 'standard' | 'premium' | 'enterprise';
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
}

interface GlobalAdmin {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    grantedBy?: string;
    grantedAt: string;
    isActive: boolean;
}

interface RevierStats {
    revierId: string;
    memberCount: number;
    activeHuntsThisMonth: number;
    totalHuntsAllTime: number;
    documentCount: number;
    lastActivity?: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockReviere: Jagdrevier[] = [
    {
        id: 'revier-1',
        name: 'Revier Waldau',
        description: 'Gemischtes Revier mit Wald und Feld im Landkreis Musterstadt',
        bundesland: 'Bayern',
        sizeHectares: 850,
        contactEmail: 'waldau@beispiel.de',
        contactPhone: '+49 170 1234567',
        billingTier: 'premium',
        isActive: true,
        createdBy: 'admin-1',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
        memberCount: 12,
    },
    {
        id: 'revier-2',
        name: 'Revier Tannenberg',
        description: 'Bergiges Waldrevier mit starkem Rotwildbestand',
        bundesland: 'Baden-Württemberg',
        sizeHectares: 1200,
        billingTier: 'enterprise',
        isActive: true,
        createdBy: 'admin-1',
        createdAt: '2025-02-01T14:30:00Z',
        updatedAt: '2025-02-01T14:30:00Z',
        memberCount: 25,
    },
];

const mockGlobalAdmins: GlobalAdmin[] = [
    {
        id: 'ga-1',
        userId: 'admin-1',
        userName: 'Max Mustermann',
        userEmail: 'max@beispiel.de',
        grantedAt: '2024-01-01T00:00:00Z',
        isActive: true,
    },
];

const mockActivityLog: Array<{
    id: string;
    revierId: string;
    actorId: string;
    action: string;
    targetUserId?: string;
    targetEmail?: string;
    oldRole?: string;
    newRole?: string;
    metadata?: object;
    createdAt: string;
}> = [];

// ============================================================================
// Helper Functions
// ============================================================================

function isGlobalAdmin(userId: string): boolean {
    return mockGlobalAdmins.some((ga) => ga.userId === userId && ga.isActive);
}

function logActivity(
    revierId: string,
    actorId: string,
    action: string,
    details: { targetUserId?: string; targetEmail?: string; oldRole?: string; newRole?: string; metadata?: object }
) {
    mockActivityLog.push({
        id: randomUUID(),
        revierId,
        actorId,
        action,
        ...details,
        createdAt: new Date().toISOString(),
    });
}

// ============================================================================
// Routes
// ============================================================================

export function createJagdAdminRoutes() {
    return new Elysia({ prefix: '/api/v1/admin' })
        .use(loggerPlugin)

        // =========================================================================
        // Global Admin Check Middleware (simulated)
        // =========================================================================

        .derive(({ headers }) => {
            // In production, extract user from JWT/session
            const userId = headers['x-user-id'] || 'admin-1';
            const isAdmin = isGlobalAdmin(userId);
            return { currentUserId: userId, isGlobalAdmin: isAdmin };
        })

        // =========================================================================
        // Jagdreviere Management
        // =========================================================================

        .get('/reviere', async ({ isGlobalAdmin: isAdmin, query }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                let reviere = [...mockReviere];

                // Filter by bundesland
                if (query?.bundesland) {
                    reviere = reviere.filter((r) => r.bundesland === query.bundesland);
                }

                // Filter by active status
                if (query?.active !== undefined) {
                    const active = query.active === 'true';
                    reviere = reviere.filter((r) => r.isActive === active);
                }

                // Sort
                reviere.sort((a, b) => a.name.localeCompare(b.name));

                return {
                    reviere,
                    total: reviere.length,
                };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch reviere');
                return { reviere: [], total: 0 };
            }
        })

        .get('/reviere/:id', async ({ params, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const revier = mockReviere.find((r) => r.id === params.id);
                if (!revier) {
                    return { error: 'Revier nicht gefunden', code: 404 };
                }
                return { revier };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get revier');
                return { error: 'Fehler beim Laden des Reviers' };
            }
        })

        .post('/reviere', async ({ body, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const input = body as Partial<Jagdrevier>;

                if (!input.name || !input.bundesland) {
                    return { error: 'Name und Bundesland sind erforderlich', code: 400 };
                }

                const newRevier: Jagdrevier = {
                    id: randomUUID(),
                    name: input.name,
                    description: input.description,
                    bundesland: input.bundesland,
                    sizeHectares: input.sizeHectares,
                    geojson: input.geojson,
                    contactEmail: input.contactEmail,
                    contactPhone: input.contactPhone,
                    billingTier: input.billingTier || 'standard',
                    isActive: true,
                    createdBy: currentUserId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    memberCount: 0,
                };

                mockReviere.push(newRevier);

                logActivity(newRevier.id, currentUserId, 'revier_created', {
                    metadata: { name: newRevier.name, bundesland: newRevier.bundesland },
                });

                dbLogger.info({ revierId: newRevier.id }, 'Revier created');
                return { revier: newRevier };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to create revier');
                return { error: 'Fehler beim Erstellen des Reviers' };
            }
        })

        .put('/reviere/:id', async ({ params, body, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const revier = mockReviere.find((r) => r.id === params.id);
                if (!revier) {
                    return { error: 'Revier nicht gefunden', code: 404 };
                }

                const input = body as Partial<Jagdrevier>;
                Object.assign(revier, {
                    name: input.name ?? revier.name,
                    description: input.description ?? revier.description,
                    bundesland: input.bundesland ?? revier.bundesland,
                    sizeHectares: input.sizeHectares ?? revier.sizeHectares,
                    geojson: input.geojson ?? revier.geojson,
                    contactEmail: input.contactEmail ?? revier.contactEmail,
                    contactPhone: input.contactPhone ?? revier.contactPhone,
                    billingTier: input.billingTier ?? revier.billingTier,
                    updatedAt: new Date().toISOString(),
                });

                logActivity(revier.id, currentUserId, 'revier_updated', {
                    metadata: { updated: Object.keys(input) },
                });

                return { revier };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update revier');
                return { error: 'Fehler beim Aktualisieren des Reviers' };
            }
        })

        .delete('/reviere/:id', async ({ params, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const revier = mockReviere.find((r) => r.id === params.id);
                if (!revier) {
                    return { error: 'Revier nicht gefunden', code: 404 };
                }

                // Soft delete
                revier.isActive = false;
                revier.updatedAt = new Date().toISOString();

                logActivity(revier.id, currentUserId, 'revier_deactivated', {
                    metadata: { name: revier.name },
                });

                dbLogger.warn({ revierId: revier.id }, 'Revier deactivated');
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to deactivate revier');
                return { success: false };
            }
        })

        .get('/reviere/:id/stats', async ({ params, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const revier = mockReviere.find((r) => r.id === params.id);
                if (!revier) {
                    return { error: 'Revier nicht gefunden', code: 404 };
                }

                // Mock statistics
                const stats: RevierStats = {
                    revierId: revier.id,
                    memberCount: revier.memberCount || 0,
                    activeHuntsThisMonth: Math.floor(Math.random() * 20),
                    totalHuntsAllTime: Math.floor(Math.random() * 200) + 50,
                    documentCount: Math.floor(Math.random() * 30) + 5,
                    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                };

                return { stats };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get revier stats');
                return { error: 'Fehler beim Laden der Statistiken' };
            }
        })

        .get('/reviere/:id/activity', async ({ params, isGlobalAdmin: isAdmin, query }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const limit = parseInt(query?.limit as string) || 50;
                const activities = mockActivityLog
                    .filter((a) => a.revierId === params.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, limit);

                return { activities };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get activity log');
                return { activities: [] };
            }
        })

        // =========================================================================
        // Global Admin Management
        // =========================================================================

        .get('/global-admins', async ({ isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            return { admins: mockGlobalAdmins.filter((ga) => ga.isActive) };
        })

        .post('/global-admins', async ({ body, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const { userId, userName, userEmail } = body as {
                    userId: string;
                    userName?: string;
                    userEmail?: string;
                };

                if (!userId) {
                    return { error: 'User ID ist erforderlich', code: 400 };
                }

                // Check if already admin
                const existing = mockGlobalAdmins.find((ga) => ga.userId === userId);
                if (existing) {
                    if (existing.isActive) {
                        return { error: 'Benutzer ist bereits Administrator', code: 400 };
                    }
                    // Reactivate
                    existing.isActive = true;
                    existing.grantedBy = currentUserId;
                    existing.grantedAt = new Date().toISOString();
                    return { admin: existing };
                }

                const newAdmin: GlobalAdmin = {
                    id: randomUUID(),
                    userId,
                    userName,
                    userEmail,
                    grantedBy: currentUserId,
                    grantedAt: new Date().toISOString(),
                    isActive: true,
                };

                mockGlobalAdmins.push(newAdmin);

                dbLogger.info({ adminId: newAdmin.id, userId }, 'Global admin added');
                return { admin: newAdmin };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to add global admin');
                return { error: 'Fehler beim Hinzufügen des Administrators' };
            }
        })

        .delete('/global-admins/:userId', async ({ params, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                // Cannot remove yourself
                if (params.userId === currentUserId) {
                    return { error: 'Sie können sich nicht selbst entfernen', code: 400 };
                }

                const admin = mockGlobalAdmins.find((ga) => ga.userId === params.userId);
                if (!admin) {
                    return { error: 'Administrator nicht gefunden', code: 404 };
                }

                admin.isActive = false;

                dbLogger.warn({ userId: params.userId }, 'Global admin removed');
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to remove global admin');
                return { success: false };
            }
        })

        // =========================================================================
        // Assign Jagdpächter to Revier
        // =========================================================================

        .post('/reviere/:id/admins', async ({ params, body, currentUserId, isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            try {
                const revier = mockReviere.find((r) => r.id === params.id);
                if (!revier) {
                    return { error: 'Revier nicht gefunden', code: 404 };
                }

                const { userId, userName, userEmail } = body as {
                    userId: string;
                    userName?: string;
                    userEmail?: string;
                };

                // This would create a membership with role 'jagdpaechter'
                // For now, just log the action
                logActivity(revier.id, currentUserId, 'member_added', {
                    targetUserId: userId,
                    newRole: 'jagdpaechter',
                    metadata: { userName, userEmail },
                });

                dbLogger.info({ revierId: revier.id, userId }, 'Jagdpächter assigned');
                return {
                    success: true,
                    message: `${userName || userId} wurde als Jagdpächter zugewiesen`,
                };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to assign Jagdpächter');
                return { error: 'Fehler beim Zuweisen des Jagdpächters' };
            }
        })

        // =========================================================================
        // Platform Statistics
        // =========================================================================

        .get('/stats', async ({ isGlobalAdmin: isAdmin }) => {
            if (!isAdmin) {
                return { error: 'Nur für Plattform-Administratoren', code: 403 };
            }

            return {
                stats: {
                    totalReviere: mockReviere.length,
                    activeReviere: mockReviere.filter((r) => r.isActive).length,
                    totalMembers: mockReviere.reduce((sum, r) => sum + (r.memberCount || 0), 0),
                    globalAdmins: mockGlobalAdmins.filter((ga) => ga.isActive).length,
                    byBundesland: mockReviere.reduce((acc, r) => {
                        acc[r.bundesland] = (acc[r.bundesland] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                    byTier: mockReviere.reduce((acc, r) => {
                        acc[r.billingTier] = (acc[r.billingTier] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                },
            };
        });
}
