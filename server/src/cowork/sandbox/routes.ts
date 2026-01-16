/**
 * Sandbox REST API Routes
 *
 * Handles all sandbox/staging environment management endpoints.
 */

import { Elysia, t } from 'elysia';
import { sandboxManager } from './SandboxManager';
import { auditLogger } from './AuditLogger';
import { backupManager } from './BackupManager';
import { componentLoggers } from '../../logger';
import type { SandboxStatus, FileDecision } from './types';

const logger = componentLoggers.http;

export const sandboxRoutes = new Elysia({ prefix: '/api/v1/sandbox' })

    // ========================================================================
    // Sandbox Session Management
    // ========================================================================

    // Create a new sandbox
    .post('/', async ({ body }) => {
        try {
            const { sourcePath, coworkSessionId, config } = body as {
                sourcePath: string;
                coworkSessionId?: string;
                config?: {
                    excludePatterns?: string[];
                    maxSizeBytes?: number;
                    secretsHandling?: 'exclude' | 'inject_env' | 'readonly_mount';
                    watchSource?: boolean;
                    expirationHours?: number;
                };
            };

            // For now, use a default user ID (in production, from auth)
            const userId = 'default-user';

            const sandbox = await sandboxManager.createSandbox({
                userId,
                sourcePath,
                coworkSessionId,
                config,
            });

            return { success: true, sandbox };
        } catch (error: any) {
            logger.error({ error }, 'Failed to create sandbox');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        body: t.Object({
            sourcePath: t.String({ minLength: 1 }),
            coworkSessionId: t.Optional(t.String()),
            config: t.Optional(t.Object({
                excludePatterns: t.Optional(t.Array(t.String())),
                maxSizeBytes: t.Optional(t.Number({ minimum: 1 })),
                secretsHandling: t.Optional(
                    t.Union([
                        t.Literal('exclude'),
                        t.Literal('inject_env'),
                        t.Literal('readonly_mount'),
                    ])
                ),
                watchSource: t.Optional(t.Boolean()),
                expirationHours: t.Optional(t.Number({ minimum: 1, maximum: 168 })),
            })),
        }),
    })

    // Get sandbox details
    .get('/:id', async ({ params }) => {
        try {
            const sandbox = await sandboxManager.getSandbox(params.id);
            return { success: true, sandbox };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to get sandbox');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // List user's sandboxes
    .get('/', async ({ query }) => {
        try {
            const userId = 'default-user'; // In production, from auth
            const sandboxes = await sandboxManager.getUserSandboxes(userId, {
                limit: query.limit ? parseInt(query.limit as string) : undefined,
                status: query.status as SandboxStatus | undefined,
            });
            return { success: true, sandboxes };
        } catch (error: any) {
            logger.error({ error }, 'Failed to list sandboxes');
            return { success: false, error: error.message };
        }
    }, {
        query: t.Object({
            limit: t.Optional(t.String()),
            status: t.Optional(t.String()),
        }),
    })

    // ========================================================================
    // Diff & Changes
    // ========================================================================

    // Get diff of all changes in sandbox
    .get('/:id/diff', async ({ params }) => {
        try {
            const changes = await sandboxManager.getDiff(params.id);
            return {
                success: true,
                changes,
                summary: {
                    total: changes.length,
                    added: changes.filter((c) => c.changeType === 'added').length,
                    modified: changes.filter((c) => c.changeType === 'modified').length,
                    deleted: changes.filter((c) => c.changeType === 'deleted').length,
                    conflicts: changes.filter((c) => c.hasConflict).length,
                },
            };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to get diff');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // ========================================================================
    // Merge Operations
    // ========================================================================

    // Apply changes to source
    .post('/:id/apply', async ({ params, body }) => {
        try {
            const { fileDecisions } = body as {
                fileDecisions: FileDecision[];
            };

            const result = await sandboxManager.applyChanges({
                sandboxId: params.id,
                fileDecisions,
            });

            return { success: true, result };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to apply changes');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            fileDecisions: t.Array(
                t.Object({
                    relativePath: t.String(),
                    action: t.Union([
                        t.Literal('apply'),
                        t.Literal('reject'),
                        t.Literal('resolve'),
                    ]),
                    resolvedContent: t.Optional(t.String()),
                })
            ),
        }),
    })

    // Discard sandbox without applying
    .post('/:id/discard', async ({ params }) => {
        try {
            await sandboxManager.discard(params.id);
            return { success: true };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to discard sandbox');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // ========================================================================
    // Rollback
    // ========================================================================

    // Rollback to a backup
    .post('/:id/rollback', async ({ params, body }) => {
        try {
            const { backupId } = body as { backupId: string };
            await sandboxManager.rollback(params.id, backupId);
            return { success: true };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to rollback');
            return {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN',
            };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            backupId: t.String(),
        }),
    })

    // Get backups for a sandbox
    .get('/:id/backups', async ({ params }) => {
        try {
            const backups = await backupManager.getSandboxBackups(params.id);
            return { success: true, backups };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to get backups');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // ========================================================================
    // Audit Log
    // ========================================================================

    // Get audit history for a sandbox
    .get('/:id/audit', async ({ params, query }) => {
        try {
            const history = await auditLogger.getHistory(params.id, {
                eventTypes: query.eventTypes
                    ? (query.eventTypes as string).split(',') as any[]
                    : undefined,
                filePath: query.filePath as string | undefined,
                limit: query.limit ? parseInt(query.limit as string) : 50,
            });
            return { success: true, history };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to get audit history');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
        query: t.Object({
            eventTypes: t.Optional(t.String()),
            filePath: t.Optional(t.String()),
            limit: t.Optional(t.String()),
        }),
    })

    // Get file-specific audit history
    .get('/:id/audit/file', async ({ params, query }) => {
        try {
            const { filePath } = query as { filePath: string };
            const history = await auditLogger.getFileHistory(params.id, filePath);
            return { success: true, history };
        } catch (error: any) {
            logger.error({ sandboxId: params.id, error }, 'Failed to get file history');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
        query: t.Object({
            filePath: t.String(),
        }),
    });

export default sandboxRoutes;
