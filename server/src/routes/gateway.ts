/**
 * Gateway API Routes
 * 
 * REST API for managing messaging gateway channels and sessions.
 */

import { Elysia, t } from 'elysia';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

// ============================================================================
// In-Memory Storage (would be Redis/PostgreSQL in production)
// ============================================================================

const channelConfigs = new Map<string, any>();
const sessions = new Map<string, any>();

// ============================================================================
// Routes
// ============================================================================

export const gatewayRoutes = new Elysia({ prefix: '/api/v1/gateway' })
    // List all configured channels
    .get('/channels', async () => {
        const channels = Array.from(channelConfigs.values());
        return { channels };
    })

    // Get a specific channel config
    .get('/channels/:type', async ({ params }) => {
        const config = channelConfigs.get(params.type);
        if (!config) {
            return { error: 'Channel not found' };
        }
        // Mask sensitive fields
        return { channel: maskSensitiveFields(config) };
    }, {
        params: t.Object({
            type: t.String(),
        }),
    })

    // Create/update a channel config
    .post('/channels', async ({ body }) => {
        const { type, enabled, name, config } = body as any;

        const existing = channelConfigs.get(type);
        const channelConfig = {
            type,
            enabled: enabled ?? true,
            name: name || type,
            config: config || {},
            updatedAt: new Date(),
            createdAt: existing?.createdAt || new Date(),
        };

        channelConfigs.set(type, channelConfig);
        logger.info({ type }, 'Channel config updated');

        return { success: true, channel: maskSensitiveFields(channelConfig) };
    })

    // Delete a channel config
    .delete('/channels/:type', async ({ params }) => {
        const deleted = channelConfigs.delete(params.type);
        if (!deleted) {
            return { error: 'Channel not found' };
        }
        logger.info({ type: params.type }, 'Channel config deleted');
        return { success: true };
    }, {
        params: t.Object({
            type: t.String(),
        }),
    })

    // Toggle channel enabled status
    .post('/channels/:type/toggle', async ({ params, body }) => {
        const config = channelConfigs.get(params.type);
        if (!config) {
            return { error: 'Channel not found' };
        }

        config.enabled = (body as any).enabled ?? !config.enabled;
        config.updatedAt = new Date();
        channelConfigs.set(params.type, config);

        return { success: true, enabled: config.enabled };
    }, {
        params: t.Object({
            type: t.String(),
        }),
    })

    // List active sessions
    .get('/sessions', async ({ query }) => {
        const { channelType, limit = 50 } = query as any;

        let allSessions = Array.from(sessions.values());

        if (channelType) {
            allSessions = allSessions.filter(s => s.channelType === channelType);
        }

        // Sort by lastActiveAt descending
        allSessions.sort((a, b) =>
            new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
        );

        return {
            sessions: allSessions.slice(0, limit),
            total: allSessions.length,
        };
    })

    // Get a specific session
    .get('/sessions/:id', async ({ params }) => {
        const session = sessions.get(params.id);
        if (!session) {
            return { error: 'Session not found' };
        }
        return { session };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Delete a session
    .delete('/sessions/:id', async ({ params }) => {
        const deleted = sessions.delete(params.id);
        return { success: deleted };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Gateway health check
    .get('/health', async () => {
        const activeChannels = Array.from(channelConfigs.values())
            .filter(c => c.enabled);

        return {
            status: 'healthy',
            channels: activeChannels.length,
            sessions: sessions.size,
            uptime: process.uptime(),
        };
    })

    // Send a message to a session
    .post('/send', async ({ body }) => {
        const { sessionId, channelId, channelType, text, media } = body as any;

        // In production, this would dispatch to the appropriate adapter
        logger.info({ sessionId, channelType }, 'Message send requested');

        return {
            success: true,
            messageId: `msg-${Date.now()}`,
        };
    });

// ============================================================================
// Helpers
// ============================================================================

function maskSensitiveFields(config: any): any {
    const sensitiveKeys = ['pass', 'password', 'secret', 'token', 'key'];
    const result = { ...config };

    if (result.config) {
        result.config = maskObject(result.config, sensitiveKeys);
    }

    return result;
}

function maskObject(obj: any, sensitiveKeys: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        const isSecret = sensitiveKeys.some(sk =>
            key.toLowerCase().includes(sk.toLowerCase())
        );

        if (isSecret && typeof value === 'string' && value.length > 0) {
            result[key] = '••••••••';
        } else if (typeof value === 'object' && value !== null) {
            result[key] = maskObject(value, sensitiveKeys);
        } else {
            result[key] = value;
        }
    }

    return result;
}

export default gatewayRoutes;
