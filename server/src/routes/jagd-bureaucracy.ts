/**
 * Jagd Bureaucracy API Routes
 *
 * REST endpoints for document vault, export packs, and guest permits.
 *
 * Endpoints:
 *   -- Document Vault --
 *   GET    /api/v1/jagd/vault       - List user's vault documents
 *   POST   /api/v1/jagd/vault       - Upload a document (metadata)
 *   GET    /api/v1/jagd/vault/:id   - Get single document
 *   DELETE /api/v1/jagd/vault/:id   - Delete a document
 *
 *   -- Export Packs --
 *   GET    /api/v1/jagd/export-packs       - List export packs
 *   POST   /api/v1/jagd/export-packs       - Generate an export pack
 *   GET    /api/v1/jagd/export-packs/:id   - Get export pack with download URLs
 *
 *   -- Guest Permits --
 *   GET    /api/v1/jagd/guest-permits      - List guest permits
 *   POST   /api/v1/jagd/guest-permits      - Create guest permit PDF
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

interface DocumentRow {
    id: string;
    user_id: string;
    doc_type: string;
    name: string;
    expires_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

interface ExportPackRow {
    id: string;
    user_id: string;
    pack_type: string;
    bundesland: string | null;
    data: Record<string, unknown>;
    pdf_url: string | null;
    csv_url: string | null;
    status: string;
    created_at: string;
}

interface GuestPermitRow {
    id: string;
    user_id: string;
    guest_name: string;
    valid_from: string;
    valid_until: string;
    revier: string | null;
    conditions: Record<string, unknown>;
    pdf_url: string | null;
    created_at: string;
}

// ============================================================================
// Response Mappers
// ============================================================================

function mapDocumentRow(row: DocumentRow) {
    return {
        id: row.id,
        docType: row.doc_type,
        name: row.name,
        expiresAt: row.expires_at,
        metadata: row.metadata,
        createdAt: row.created_at,
    };
}

function mapExportPackRow(row: ExportPackRow) {
    return {
        id: row.id,
        packType: row.pack_type,
        bundesland: row.bundesland,
        data: row.data,
        pdfUrl: row.pdf_url,
        csvUrl: row.csv_url,
        status: row.status,
        createdAt: row.created_at,
    };
}

function mapGuestPermitRow(row: GuestPermitRow) {
    return {
        id: row.id,
        guestName: row.guest_name,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        revier: row.revier,
        conditions: row.conditions,
        pdfUrl: row.pdf_url,
        createdAt: row.created_at,
    };
}

// ============================================================================
// Route Plugin
// ============================================================================

export function createJagdBureaucracyRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd' })

        // =========================================================================
        // DOCUMENT VAULT
        // =========================================================================

        // GET /vault - List all vault documents
        .get('/vault', async ({ query: qs }) => {
            try {
                const conditions: string[] = [];
                const params: unknown[] = [];
                let idx = 1;

                // Filter by doc type
                if (qs.docType) {
                    conditions.push(`doc_type = $${idx++}`);
                    params.push(qs.docType);
                }

                const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

                const result = await query<DocumentRow>(
                    `SELECT id, user_id, doc_type, name, expires_at, metadata, created_at
           FROM document_vault
           ${where}
           ORDER BY created_at DESC
           LIMIT 100`,
                    params,
                );

                return { documents: result.rows.map(mapDocumentRow) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to list vault documents');
                return { documents: [], error: (err as Error).message };
            }
        })

        // POST /vault - Upload a document (metadata only, no actual file handling yet)
        .post('/vault', async ({ body, set }) => {
            try {
                const { docType, name, expiresAt, metadata } = body as Record<string, unknown>;

                const id = randomUUID();

                const result = await query<DocumentRow>(
                    `INSERT INTO document_vault
             (id, user_id, doc_type, name, expires_at, metadata, encrypted_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, doc_type, name, expires_at, metadata, created_at`,
                    [
                        id,
                        'anonymous', // TODO: Get from auth context
                        (docType as string) || 'other',
                        name as string,
                        expiresAt ? (expiresAt as string) : null,
                        JSON.stringify((metadata as Record<string, unknown>) || {}),
                        Buffer.from('placeholder'), // Encrypted data placeholder
                    ],
                );

                set.status = 201;
                return { document: mapDocumentRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to create vault document');
                set.status = 500;
                return { error: (err as Error).message };
            }
        })

        // GET /vault/:id - Get single document
        .get('/vault/:id', async ({ params, set }) => {
            try {
                const result = await query<DocumentRow>(
                    `SELECT id, user_id, doc_type, name, expires_at, metadata, created_at
           FROM document_vault WHERE id = $1`,
                    [params.id],
                );

                if (result.rows.length === 0) {
                    set.status = 404;
                    return { error: 'Document not found' };
                }

                return { document: mapDocumentRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to get vault document');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // DELETE /vault/:id - Delete a document
        .delete('/vault/:id', async ({ params, set }) => {
            try {
                const result = await query(
                    `DELETE FROM document_vault WHERE id = $1 RETURNING id`,
                    [params.id],
                );

                if (result.rowCount === 0) {
                    set.status = 404;
                    return { error: 'Document not found' };
                }

                return { success: true };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to delete vault document');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // =========================================================================
        // EXPORT PACKS
        // =========================================================================

        // GET /export-packs - List export packs
        .get('/export-packs', async () => {
            try {
                const result = await query<ExportPackRow>(
                    `SELECT id, user_id, pack_type, bundesland, data, pdf_url, csv_url, status, created_at
           FROM export_packs
           ORDER BY created_at DESC
           LIMIT 50`,
                );

                return { exportPacks: result.rows.map(mapExportPackRow) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to list export packs');
                return { exportPacks: [], error: (err as Error).message };
            }
        })

        // POST /export-packs - Generate an export pack
        .post('/export-packs', async ({ body, set }) => {
            try {
                const { packType, bundesland, dateRange, sessionIds } = body as Record<string, unknown>;

                const id = randomUUID();
                const range = dateRange as { from: string; to: string } | undefined;

                // Fetch sessions for the date range to build export data
                let sessionsData: Record<string, unknown>[] = [];
                if (range) {
                    const sessionsResult = await query(
                        `SELECT id, session_type, start_time, end_time
             FROM hunt_sessions
             WHERE start_time >= $1 AND start_time <= $2
             ORDER BY start_time DESC`,
                        [range.from, range.to],
                    );
                    sessionsData = sessionsResult.rows;
                }

                // Build export data payload
                const exportData = {
                    packType,
                    bundesland,
                    dateRange: range,
                    sessionIds: sessionIds || [],
                    sessions: sessionsData,
                    generatedAt: new Date().toISOString(),
                };

                // TODO: Generate actual PDF/CSV using @react-pdf/renderer
                // For now, save as draft with data
                const result = await query<ExportPackRow>(
                    `INSERT INTO export_packs
             (id, user_id, pack_type, bundesland, data, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, user_id, pack_type, bundesland, data, pdf_url, csv_url, status, created_at`,
                    [
                        id,
                        'anonymous', // TODO: Get from auth context
                        (packType as string) || 'streckenliste',
                        (bundesland as string) || null,
                        JSON.stringify(exportData),
                        'generated',
                    ],
                );

                set.status = 201;
                return { exportPack: mapExportPackRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to generate export pack');
                set.status = 500;
                return { error: (err as Error).message };
            }
        })

        // GET /export-packs/:id - Get export pack with download URLs
        .get('/export-packs/:id', async ({ params, set }) => {
            try {
                const result = await query<ExportPackRow>(
                    `SELECT id, user_id, pack_type, bundesland, data, pdf_url, csv_url, status, created_at
           FROM export_packs WHERE id = $1`,
                    [params.id],
                );

                if (result.rows.length === 0) {
                    set.status = 404;
                    return { error: 'Export pack not found' };
                }

                return { exportPack: mapExportPackRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to get export pack');
                set.status = 500;
                return { error: (err as Error).message };
            }
        }, {
            params: t.Object({ id: t.String() }),
        })

        // =========================================================================
        // GUEST PERMITS
        // =========================================================================

        // GET /guest-permits - List guest permits
        .get('/guest-permits', async () => {
            try {
                const result = await query<GuestPermitRow>(
                    `SELECT id, user_id, guest_name, valid_from, valid_until, revier, conditions, pdf_url, created_at
           FROM guest_permits
           ORDER BY created_at DESC
           LIMIT 50`,
                );

                return { guestPermits: result.rows.map(mapGuestPermitRow) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to list guest permits');
                return { guestPermits: [], error: (err as Error).message };
            }
        })

        // POST /guest-permits - Create guest permit
        .post('/guest-permits', async ({ body, set }) => {
            try {
                const { guestName, validFrom, validUntil, revier, conditions } = body as Record<string, unknown>;

                if (!guestName || !validFrom || !validUntil) {
                    set.status = 400;
                    return { error: 'guestName, validFrom, and validUntil are required' };
                }

                const id = randomUUID();

                // TODO: Generate PDF using @react-pdf/renderer
                const result = await query<GuestPermitRow>(
                    `INSERT INTO guest_permits
             (id, user_id, guest_name, valid_from, valid_until, revier, conditions)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, guest_name, valid_from, valid_until, revier, conditions, pdf_url, created_at`,
                    [
                        id,
                        'anonymous', // TODO: Get from auth context
                        guestName as string,
                        validFrom as string,
                        validUntil as string,
                        (revier as string) || null,
                        JSON.stringify((conditions as Record<string, unknown>) || {}),
                    ],
                );

                set.status = 201;
                return { guestPermit: mapGuestPermitRow(result.rows[0]) };
            } catch (err) {
                log.error({ error: (err as Error).message }, 'Failed to create guest permit');
                set.status = 500;
                return { error: (err as Error).message };
            }
        });
}
