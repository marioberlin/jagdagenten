/**
 * iCloud API Routes for LiquidOS
 *
 * Handles all iCloud-related operations including:
 * - Authentication (login, 2FA, logout)
 * - Contacts, Calendar, Mail
 * - Drive, Notes, Reminders
 * - Photos, Find My
 */

import { Elysia, t } from 'elysia';
import { createICloudClient, type ICloud } from '../lib/icloud/index.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, { client: ICloud; username: string }>();

// Helper to get iCloud client from session
const getClientFromSession = (sessionId: string): ICloud => {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error('Session not found. Please authenticate first.');
    }
    if (!session.client.isAuthenticated) {
        throw new Error('Session expired. Please re-authenticate.');
    }
    return session.client;
};

// Helper to require session from headers
const requireSession = (headers: Record<string, string | undefined>): string => {
    const sessionId = headers['x-icloud-session-id'] || headers['x-session-id'];
    if (!sessionId) {
        throw new Error('Session ID required');
    }
    return sessionId;
};

export const icloudRoutes = new Elysia({ prefix: '/api/v1/icloud' })
    // ==========================================================================
    // Authentication
    // ==========================================================================

    /**
     * Login with Apple ID credentials
     * POST /api/v1/icloud/auth/login
     */
    .post(
        '/auth/login',
        async ({ body, set }) => {
            try {
                const client = createICloudClient({
                    credentials: { username: body.username, password: body.password },
                    debug: process.env.NODE_ENV === 'development',
                });

                await client.signIn();

                // Create session
                const sessionId = crypto.randomUUID();
                sessions.set(sessionId, { client, username: body.username });

                logger.info({ username: body.username }, 'iCloud session created');

                return {
                    success: true,
                    sessionId,
                    account: {
                        username: client.account?.dsInfo?.appleId,
                        firstName: client.account?.dsInfo?.firstName,
                        lastName: client.account?.dsInfo?.lastName,
                    },
                    services: Object.keys(client.account?.webservices || {}),
                };
            } catch (error: any) {
                // Check if 2FA is required
                if (error?.code === 'TWO_FACTOR_REQUIRED' || error?.message?.includes('2FA')) {
                    // Store pending session for 2FA
                    const client = createICloudClient({
                        credentials: { username: body.username, password: body.password },
                    });

                    const sessionId = crypto.randomUUID();
                    sessions.set(sessionId, { client, username: body.username });

                    set.status = 202;
                    return {
                        success: false,
                        requires2FA: true,
                        sessionId,
                        message: 'Two-factor authentication required',
                    };
                }

                logger.error({ error }, 'iCloud login failed');
                set.status = 401;
                return { error: error.message || 'Authentication failed' };
            }
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )

    /**
     * Verify 2FA code
     * POST /api/v1/icloud/auth/verify-2fa
     */
    .post(
        '/auth/verify-2fa',
        async ({ body, headers, set }) => {
            const sessionId = requireSession(headers as Record<string, string>);
            const session = sessions.get(sessionId);

            if (!session) {
                set.status = 401;
                return { error: 'Session expired' };
            }

            if (!body.code || body.code.length !== 6) {
                set.status = 400;
                return { error: 'Invalid 2FA code' };
            }

            try {
                await session.client.verifyTwoFactorCode(body.code);

                return {
                    success: true,
                    account: {
                        username: session.client.account?.dsInfo?.appleId,
                        firstName: session.client.account?.dsInfo?.firstName,
                        lastName: session.client.account?.dsInfo?.lastName,
                    },
                    services: Object.keys(session.client.account?.webservices || {}),
                };
            } catch (error: any) {
                logger.error({ error }, 'iCloud 2FA verification failed');
                set.status = 401;
                return { error: error.message || '2FA verification failed' };
            }
        },
        {
            body: t.Object({
                code: t.String(),
            }),
        }
    )

    /**
     * Get session status
     * GET /api/v1/icloud/auth/status
     */
    .get('/auth/status', ({ headers }) => {
        const sessionId = headers['x-icloud-session-id'] || headers['x-session-id'];

        if (!sessionId) {
            return { authenticated: false };
        }

        const session = sessions.get(sessionId);
        if (!session || !session.client.isAuthenticated) {
            return { authenticated: false };
        }

        return {
            authenticated: true,
            account: {
                username: session.client.account?.dsInfo?.appleId,
                firstName: session.client.account?.dsInfo?.firstName,
                lastName: session.client.account?.dsInfo?.lastName,
            },
            services: Object.keys(session.client.account?.webservices || {}),
        };
    })

    /**
     * Logout
     * POST /api/v1/icloud/auth/logout
     */
    .post('/auth/logout', async ({ headers }) => {
        const sessionId = headers['x-icloud-session-id'] || headers['x-session-id'];

        if (sessionId) {
            const session = sessions.get(sessionId);
            if (session) {
                try {
                    await session.client.signOut();
                } catch (error) {
                    logger.warn({ error }, 'Error during iCloud signOut');
                }
                sessions.delete(sessionId);
                logger.info({ sessionId }, 'iCloud session ended');
            }
        }

        return { success: true };
    })

    // ==========================================================================
    // Contacts
    // ==========================================================================

    /**
     * List contacts
     * GET /api/v1/icloud/contacts
     */
    .get('/contacts', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const contacts = await client.Contacts.list();
        return { contacts };
    })

    /**
     * Get contact
     * GET /api/v1/icloud/contacts/:id
     */
    .get('/contacts/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const contact = await client.Contacts.get(params.id);
        return { contact };
    })

    /**
     * Create contact
     * POST /api/v1/icloud/contacts
     */
    .post('/contacts', async ({ headers, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const contact = await client.Contacts.create(body as any);
        return { success: true, contact };
    })

    /**
     * Update contact
     * PUT /api/v1/icloud/contacts/:id
     */
    .put('/contacts/:id', async ({ headers, params, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const contact = await client.Contacts.update(params.id, body as any);
        return { success: true, contact };
    })

    /**
     * Delete contact
     * DELETE /api/v1/icloud/contacts/:id
     */
    .delete('/contacts/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Contacts.delete(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Calendar
    // ==========================================================================

    /**
     * List calendars
     * GET /api/v1/icloud/calendar/calendars
     */
    .get('/calendar/calendars', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const calendars = await client.Calendar.getCalendars();
        return { calendars };
    })

    /**
     * List events
     * GET /api/v1/icloud/calendar/events
     */
    .get('/calendar/events', async ({ headers, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        const events = await client.Calendar.getEvents(startDate, endDate);
        return { events };
    })

    /**
     * Create event
     * POST /api/v1/icloud/calendar/events
     */
    .post('/calendar/events', async ({ headers, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const event = await client.Calendar.createEvent(body as any);
        return { success: true, event };
    })

    /**
     * Update event
     * PUT /api/v1/icloud/calendar/events/:id
     */
    .put('/calendar/events/:id', async ({ headers, params, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const event = await client.Calendar.updateEvent(params.id, body as any);
        return { success: true, event };
    })

    /**
     * Delete event
     * DELETE /api/v1/icloud/calendar/events/:id
     */
    .delete('/calendar/events/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Calendar.deleteEvent(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Mail
    // ==========================================================================

    /**
     * List mail folders
     * GET /api/v1/icloud/mail/folders
     */
    .get('/mail/folders', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const folders = await client.Mail.listFolders();
        return { folders };
    })

    /**
     * List messages
     * GET /api/v1/icloud/mail/messages
     */
    .get('/mail/messages', async ({ headers, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const response = await client.Mail.listMessages(
            query.folder,
            { limit: query.limit ? parseInt(query.limit) : undefined }
        );
        return { messages: (response as any).messages || response };
    })

    /**
     * Get message
     * GET /api/v1/icloud/mail/messages/:id
     */
    .get('/mail/messages/:id', async ({ headers, params, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const message = await client.Mail.getMessage(params.id, query.folder);
        return { message };
    })

    /**
     * Send email
     * POST /api/v1/icloud/mail/send
     */
    .post('/mail/send', async ({ headers, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const result = await client.Mail.send(body as any);
        return { success: true, messageId: (result as any)?.guid };
    })

    /**
     * Delete message
     * DELETE /api/v1/icloud/mail/messages/:id
     */
    .delete('/mail/messages/:id', async ({ headers, params, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Mail.moveToTrash([params.id], query.folder);
        return { success: true };
    })

    // ==========================================================================
    // Drive
    // ==========================================================================

    /**
     * List drive items
     * GET /api/v1/icloud/drive/items
     */
    .get('/drive/items', async ({ headers, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const items = await client.Drive.listItems(query.path || '/');
        return { items };
    })

    /**
     * Get drive item
     * GET /api/v1/icloud/drive/items/:id
     */
    .get('/drive/items/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const item = await client.Drive.getItem(params.id);
        return { item };
    })

    /**
     * Create folder
     * POST /api/v1/icloud/drive/folders
     */
    .post(
        '/drive/folders',
        async ({ headers, body }) => {
            const client = getClientFromSession(requireSession(headers as Record<string, string>));
            const folder = await client.Drive.createFolder(body.name, body.parentId);
            return { success: true, folder };
        },
        {
            body: t.Object({
                name: t.String(),
                parentId: t.Optional(t.String()),
            }),
        }
    )

    /**
     * Delete drive item
     * DELETE /api/v1/icloud/drive/items/:id
     */
    .delete('/drive/items/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Drive.delete(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Notes
    // ==========================================================================

    /**
     * List notes
     * GET /api/v1/icloud/notes
     */
    .get('/notes', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const notes = await client.Notes.list();
        return { notes };
    })

    /**
     * Get note
     * GET /api/v1/icloud/notes/:id
     */
    .get('/notes/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const note = await client.Notes.get(params.id);
        return { note };
    })

    /**
     * Create note
     * POST /api/v1/icloud/notes
     */
    .post('/notes', async ({ headers, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const note = await client.Notes.create(body as any);
        return { success: true, note };
    })

    /**
     * Delete note
     * DELETE /api/v1/icloud/notes/:id
     */
    .delete('/notes/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Notes.delete(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Reminders
    // ==========================================================================

    /**
     * List reminders
     * GET /api/v1/icloud/reminders
     */
    .get('/reminders', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const reminders = await client.Reminders.list();
        return { reminders };
    })

    /**
     * Create reminder
     * POST /api/v1/icloud/reminders
     */
    .post('/reminders', async ({ headers, body }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const reminder = await client.Reminders.create(body as any);
        return { success: true, reminder };
    })

    /**
     * Complete reminder
     * POST /api/v1/icloud/reminders/:id/complete
     */
    .post(
        '/reminders/:id/complete',
        async ({ headers, params, body }) => {
            const client = getClientFromSession(requireSession(headers as Record<string, string>));
            await client.Reminders.complete(params.id, body.completed);
            return { success: true };
        },
        {
            body: t.Object({
                completed: t.Boolean(),
            }),
        }
    )

    /**
     * Delete reminder
     * DELETE /api/v1/icloud/reminders/:id
     */
    .delete('/reminders/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.Reminders.delete(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Photos
    // ==========================================================================

    /**
     * List photos
     * GET /api/v1/icloud/photos
     */
    .get('/photos', async ({ headers, query }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const limit = query.limit ? parseInt(query.limit) : 100;
        const photos = await client.Photos.list(limit, query.albumId);
        return { photos };
    })

    /**
     * List photo albums
     * GET /api/v1/icloud/photos/albums
     */
    .get('/photos/albums', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const albums = await client.Photos.getAlbums();
        return { albums };
    })

    /**
     * Get photo download URL
     * GET /api/v1/icloud/photos/:id/download
     */
    .get('/photos/:id/download', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const url = await client.Photos.getDownloadUrl(params.id);
        return { url };
    })

    // ==========================================================================
    // Find My
    // ==========================================================================

    /**
     * List devices
     * GET /api/v1/icloud/findmy/devices
     */
    .get('/findmy/devices', async ({ headers }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const devices = await client.FindMy.getDevices();
        return { devices };
    })

    /**
     * Get device
     * GET /api/v1/icloud/findmy/devices/:id
     */
    .get('/findmy/devices/:id', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        const device = await client.FindMy.getDevice(params.id);
        return { device };
    })

    /**
     * Play sound on device
     * POST /api/v1/icloud/findmy/devices/:id/play-sound
     */
    .post('/findmy/devices/:id/play-sound', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.FindMy.playSound(params.id);
        return { success: true };
    })

    /**
     * Refresh device location
     * POST /api/v1/icloud/findmy/devices/:id/refresh
     */
    .post('/findmy/devices/:id/refresh', async ({ headers, params }) => {
        const client = getClientFromSession(requireSession(headers as Record<string, string>));
        await client.FindMy.refreshLocation(params.id);
        return { success: true };
    })

    // ==========================================================================
    // Health
    // ==========================================================================

    /**
     * Health check
     * GET /api/v1/icloud/health
     */
    .get('/health', () => ({
        status: 'ok',
        service: 'icloud',
        activeSessions: sessions.size,
        timestamp: new Date().toISOString(),
    }));
