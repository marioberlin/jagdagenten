/**
 * Jagd Quartermaster API Routes
 *
 * REST endpoints for equipment inventory and ammo management.
 *
 * Endpoints:
 *   -- Equipment/Gear --
 *   GET    /api/v1/jagd/gear       - List all gear items
 *   POST   /api/v1/jagd/gear       - Add gear item
 *   GET    /api/v1/jagd/gear/:id   - Get single gear item
 *   PUT    /api/v1/jagd/gear/:id   - Update gear item
 *   DELETE /api/v1/jagd/gear/:id   - Delete gear item
 *
 *   -- Ammo Inventory --
 *   GET    /api/v1/jagd/ammo       - Get ammo inventory summary
 *   POST   /api/v1/jagd/ammo/log   - Log ammo usage
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

interface GearRow {
    id: string;
    user_id: string;
    item_type: string;
    name: string;
    metadata: Record<string, unknown>;
    maintenance_due_at: string | null;
    created_at: string;
    updated_at: string;
}

interface AmmoLogRow {
    id: string;
    user_id: string;
    equipment_id: string | null;
    caliber: string;
    rounds_used: number;
    session_id: string | null;
    notes: string | null;
    logged_at: string;
}

// ============================================================================
// Response Mappers
// ============================================================================

function mapGearRow(row: GearRow) {
    const metadata = (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) as Record<string, unknown>;

    // Determine status based on maintenance_due_at
    let status: 'ready' | 'maintenance_due' | 'in_repair' | 'retired' = 'ready';
    if (row.maintenance_due_at) {
        const dueDate = new Date(row.maintenance_due_at);
        if (dueDate <= new Date()) {
            status = 'maintenance_due';
        }
    }
    if (metadata.status === 'in_repair') status = 'in_repair';
    if (metadata.status === 'retired') status = 'retired';

    return {
        id: row.id,
        itemType: row.item_type,
        name: row.name,
        status,
        caliber: metadata.caliber as string | undefined,
        serialEncrypted: metadata.serialEncrypted as string | undefined,
        optic: metadata.optic as string | undefined,
        notes: metadata.notes as string | undefined,
        maintenanceDueAt: row.maintenance_due_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapAmmoLogRow(row: AmmoLogRow) {
    return {
        id: row.id,
        equipmentId: row.equipment_id,
        caliber: row.caliber,
        roundsUsed: row.rounds_used,
        sessionId: row.session_id,
        notes: row.notes,
        loggedAt: row.logged_at,
    };
}

// ============================================================================
// Route Plugin
// ============================================================================

export function createJagdQuartermasterRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd' })

        // =========================================================================
        // GEAR / EQUIPMENT
        // =========================================================================

        // GET /gear - List all gear items
        .get('/gear', async ({ query: qs }) => {
            try {
                const conditions: string[] = [];
                const params: unknown[] = [];
                let idx = 1;

                // Filter by item type
                if (qs.itemType) {
                    conditions.push(`item_type = $${idx++}`);
                    params.push(qs.itemType);
                }

                // Filter by maintenance due
                if (qs.maintenanceDue === 'true') {
                    conditions.push(`maintenance_due_at <= NOW()`);
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

                const result = await query<GearRow>(
                    `SELECT id, user_id, item_type, name, metadata, maintenance_due_at, created_at, updated_at
           FROM equipment_inventory
           ${where}
           ORDER BY name ASC
           LIMIT 200`,
                    params,
                );

                return { gear: result.rows.map(mapGearRow) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to list gear');
                return { gear: [], error: (err as Error).message };
            }
        })

        // POST /gear - Add a new gear item
        .post('/gear', async ({ body, set }) => {
            try {
                const { itemType, name, caliber, serialEncrypted, optic, notes, maintenanceDueAt, status } = body as Record<string, unknown>;

                const id = randomUUID();

                const metadata: Record<string, unknown> = {};
                if (caliber) metadata.caliber = caliber;
                if (serialEncrypted) metadata.serialEncrypted = serialEncrypted;
                if (optic) metadata.optic = optic;
                if (notes) metadata.notes = notes;
                if (status) metadata.status = status;

                const result = await query<GearRow>(
                    `INSERT INTO equipment_inventory
             (id, user_id, item_type, name, metadata, maintenance_due_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, user_id, item_type, name, metadata, maintenance_due_at, created_at, updated_at`,
                    [
                        id,
                        'anonymous', // TODO: Get from auth context
                        (itemType as string) || 'other',
                        name as string,
                        JSON.stringify(metadata),
                        maintenanceDueAt ? (maintenanceDueAt as string) : null,
                    ],
                );

                set.status = 201;
                return { gear: mapGearRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to create gear item');
                set.status = 500;
                return { error: (err as Error).message };
            }
        })

        // GET /gear/:id - Get single gear item
        .get('/gear/:id', async ({ params, set }) => {
            try {
                const result = await query<GearRow>(
                    `SELECT id, user_id, item_type, name, metadata, maintenance_due_at, created_at, updated_at
           FROM equipment_inventory WHERE id = $1`,
                    [params.id],
                );

                if (result.rows.length === 0) {
                    set.status = 404;
                    return { error: 'Gear item not found' };
                }

                return { gear: mapGearRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to get gear item');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // PUT /gear/:id - Update a gear item
        .put('/gear/:id', async ({ params, body, set }) => {
            try {
                // Fetch existing
                const existing = await query<GearRow>(
                    `SELECT id, user_id, item_type, name, metadata, maintenance_due_at, created_at, updated_at
           FROM equipment_inventory WHERE id = $1`,
                    [params.id],
                );

                if (existing.rows.length === 0) {
                    set.status = 404;
                    return { error: 'Gear item not found' };
                }

                const row = existing.rows[0];
                const oldMetadata = (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) as Record<string, unknown>;

                const { itemType, name, caliber, serialEncrypted, optic, notes, maintenanceDueAt, status } = body as Record<string, unknown>;

                // Merge metadata
                const newMetadata = { ...oldMetadata };
                if (caliber !== undefined) newMetadata.caliber = caliber;
                if (serialEncrypted !== undefined) newMetadata.serialEncrypted = serialEncrypted;
                if (optic !== undefined) newMetadata.optic = optic;
                if (notes !== undefined) newMetadata.notes = notes;
                if (status !== undefined) newMetadata.status = status;

                const result = await query<GearRow>(
                    `UPDATE equipment_inventory
           SET item_type = $1,
               name = $2,
               metadata = $3,
               maintenance_due_at = $4,
               updated_at = NOW()
           WHERE id = $5
           RETURNING id, user_id, item_type, name, metadata, maintenance_due_at, created_at, updated_at`,
                    [
                        (itemType as string) || row.item_type,
                        (name as string) || row.name,
                        JSON.stringify(newMetadata),
                        maintenanceDueAt !== undefined ? (maintenanceDueAt as string) : row.maintenance_due_at,
                        params.id,
                    ],
                );

                return { gear: mapGearRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to update gear item');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // DELETE /gear/:id - Delete a gear item
        .delete('/gear/:id', async ({ params, set }) => {
            try {
                const result = await query(
                    `DELETE FROM equipment_inventory WHERE id = $1 RETURNING id`,
                    [params.id],
                );

                if (result.rowCount === 0) {
                    set.status = 404;
                    return { error: 'Gear item not found' };
                }

                return { success: true };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to delete gear item');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // =========================================================================
        // AMMO INVENTORY
        // =========================================================================

        // GET /ammo - Get ammo inventory summary (aggregated by caliber)
        .get('/ammo', async () => {
            try {
                // Aggregate ammo logs to get current stock per caliber
                const result = await query<{ caliber: string; total_used: string }>(
                    `SELECT caliber, SUM(rounds_used) as total_used
           FROM ammo_logs
           GROUP BY caliber
           ORDER BY caliber`,
                );

                // Calculate inventory (this is a simplified approach - real implementation would track purchases too)
                const inventory = result.rows.map(row => ({
                    caliber: row.caliber,
                    totalUsed: parseInt(row.total_used, 10),
                    // In a real app, we'd subtract from a "purchased" total
                    // For now, just show usage stats
                }));

                return { ammoInventory: inventory };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to get ammo inventory');
                return { ammoInventory: [], error: (err as Error).message };
            }
        })

        // POST /ammo/log - Log ammo usage
        .post('/ammo/log', async ({ body, set }) => {
            try {
                const { equipmentId, caliber, roundsUsed, sessionId, notes } = body as Record<string, unknown>;

                if (!caliber || roundsUsed == null) {
                    set.status = 400;
                    return { error: 'caliber and roundsUsed are required' };
                }

                const id = randomUUID();

                const result = await query<AmmoLogRow>(
                    `INSERT INTO ammo_logs
             (id, user_id, equipment_id, caliber, rounds_used, session_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, equipment_id, caliber, rounds_used, session_id, notes, logged_at`,
                    [
                        id,
                        'anonymous', // TODO: Get from auth context
                        (equipmentId as string) || null,
                        caliber as string,
                        roundsUsed as number,
                        (sessionId as string) || null,
                        (notes as string) || null,
                    ],
                );

                set.status = 201;
                return { ammoLog: mapAmmoLogRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to log ammo usage');
                set.status = 500;
                return { error: (err as Error).message };
            }
        });
}
