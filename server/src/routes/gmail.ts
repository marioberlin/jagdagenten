/**
 * Gmail API Routes for Sparkles Email Client
 *
 * Handles all Gmail-related operations including:
 * - OAuth authentication
 * - Thread listing and fetching
 * - Message operations (send, draft, modify)
 * - Label management
 * - Sync operations
 */

import { Elysia, t } from 'elysia';
import { createGmailService, GmailCredentials } from '../services/google/GmailService.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, { service: ReturnType<typeof createGmailService>; credentials: GmailCredentials }>();

// Helper to get or create Gmail service from session
const getServiceFromSession = (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found. Please authenticate first.');
  }
  return session.service;
};

export const gmailRoutes = new Elysia({ prefix: '/api/v1/sparkles' })
  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Get OAuth URL for Gmail authentication
   * GET /api/v1/sparkles/auth/url
   */
  .get('/auth/url', ({ query }) => {
    const service = createGmailService();
    const state = query.state || crypto.randomUUID();
    const url = service.getAuthUrl(state);
    return { url, state };
  })

  /**
   * Exchange OAuth code for tokens
   * POST /api/v1/sparkles/auth/callback
   */
  .post(
    '/auth/callback',
    async ({ body }) => {
      const service = createGmailService();

      try {
        const credentials = await service.exchangeCodeForTokens(body.code);
        const profile = await service.getProfile();

        // Create session
        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, { service, credentials });

        logger.info({ email: profile.email }, 'Gmail session created');

        return {
          sessionId,
          profile,
          credentials: {
            expiresAt: credentials.expiresAt,
          },
        };
      } catch (error: any) {
        logger.error({ error }, 'Failed to exchange code for tokens');
        throw new Error('Authentication failed: ' + error.message);
      }
    },
    {
      body: t.Object({
        code: t.String(),
        state: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Restore session from stored credentials
   * POST /api/v1/sparkles/auth/restore
   */
  .post(
    '/auth/restore',
    async ({ body }) => {
      const service = createGmailService();

      try {
        await service.setCredentials(body.credentials);
        const profile = await service.getProfile();

        // Create session
        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, { service, credentials: body.credentials });

        logger.info({ email: profile.email }, 'Gmail session restored');

        return {
          sessionId,
          profile,
        };
      } catch (error: any) {
        logger.error({ error }, 'Failed to restore session');
        throw new Error('Failed to restore session: ' + error.message);
      }
    },
    {
      body: t.Object({
        credentials: t.Object({
          accessToken: t.String(),
          refreshToken: t.String(),
          expiresAt: t.Number(),
        }),
      }),
    }
  )

  /**
   * Refresh access token
   * POST /api/v1/sparkles/auth/refresh
   */
  .post(
    '/auth/refresh',
    async ({ headers }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const session = sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      const credentials = await session.service.refreshAccessToken();
      session.credentials = credentials;

      return {
        credentials: {
          accessToken: credentials.accessToken,
          expiresAt: credentials.expiresAt,
        },
      };
    }
  )

  /**
   * End session
   * POST /api/v1/sparkles/auth/logout
   */
  .post('/auth/logout', ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (sessionId) {
      sessions.delete(sessionId);
      logger.info({ sessionId }, 'Gmail session ended');
    }
    return { success: true };
  })

  // ==========================================================================
  // Profile & Labels
  // ==========================================================================

  /**
   * Get user profile
   * GET /api/v1/sparkles/profile
   */
  .get('/profile', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    return await service.getProfile();
  })

  /**
   * List labels
   * GET /api/v1/sparkles/labels
   */
  .get('/labels', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    return await service.listLabels();
  })

  /**
   * Create label
   * POST /api/v1/sparkles/labels
   */
  .post(
    '/labels',
    async ({ headers, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      return await service.createLabel(body.name, body.color);
    },
    {
      body: t.Object({
        name: t.String(),
        color: t.Optional(
          t.Object({
            textColor: t.String(),
            backgroundColor: t.String(),
          })
        ),
      }),
    }
  )

  /**
   * Delete label
   * DELETE /api/v1/sparkles/labels/:id
   */
  .delete('/labels/:id', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    await service.deleteLabel(params.id);
    return { success: true };
  })

  // ==========================================================================
  // Threads
  // ==========================================================================

  /**
   * List threads
   * GET /api/v1/sparkles/threads
   */
  .get('/threads', async ({ headers, query }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    return await service.listThreads({
      labelIds: query.labelIds?.split(','),
      query: query.q,
      maxResults: query.maxResults ? parseInt(query.maxResults) : undefined,
      pageToken: query.pageToken,
    });
  })

  /**
   * Get thread
   * GET /api/v1/sparkles/threads/:id
   */
  .get('/threads/:id', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    const thread = await service.getThread(params.id);
    if (!thread) throw new Error('Thread not found');
    return thread;
  })

  /**
   * Modify thread labels
   * PATCH /api/v1/sparkles/threads/:id
   */
  .patch(
    '/threads/:id',
    async ({ headers, params, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      await service.modifyThread(params.id, {
        addLabelIds: body.addLabelIds,
        removeLabelIds: body.removeLabelIds,
      });
      return { success: true };
    },
    {
      body: t.Object({
        addLabelIds: t.Optional(t.Array(t.String())),
        removeLabelIds: t.Optional(t.Array(t.String())),
      }),
    }
  )

  /**
   * Trash thread
   * POST /api/v1/sparkles/threads/:id/trash
   */
  .post('/threads/:id/trash', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    await service.trashThread(params.id);
    return { success: true };
  })

  /**
   * Untrash thread
   * POST /api/v1/sparkles/threads/:id/untrash
   */
  .post('/threads/:id/untrash', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    await service.untrashThread(params.id);
    return { success: true };
  })

  /**
   * Delete thread permanently
   * DELETE /api/v1/sparkles/threads/:id
   */
  .delete('/threads/:id', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    await service.deleteThread(params.id);
    return { success: true };
  })

  // ==========================================================================
  // Messages
  // ==========================================================================

  /**
   * Get message
   * GET /api/v1/sparkles/messages/:id
   */
  .get('/messages/:id', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    const message = await service.getMessage(params.id);
    if (!message) throw new Error('Message not found');
    return message;
  })

  /**
   * Send message
   * POST /api/v1/sparkles/messages/send
   */
  .post(
    '/messages/send',
    async ({ headers, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      const messageId = await service.sendMessage({
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject,
        body: body.body,
        isHtml: body.isHtml,
        threadId: body.threadId,
        inReplyTo: body.inReplyTo,
        references: body.references,
        attachments: body.attachments,
      });
      return { messageId };
    },
    {
      body: t.Object({
        to: t.Array(
          t.Object({
            email: t.String(),
            name: t.Optional(t.String()),
          })
        ),
        cc: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
            })
          )
        ),
        bcc: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
            })
          )
        ),
        subject: t.String(),
        body: t.String(),
        isHtml: t.Optional(t.Boolean()),
        threadId: t.Optional(t.String()),
        inReplyTo: t.Optional(t.String()),
        references: t.Optional(t.String()),
        attachments: t.Optional(
          t.Array(
            t.Object({
              filename: t.String(),
              mimeType: t.String(),
              content: t.String(),
            })
          )
        ),
      }),
    }
  )

  /**
   * Create draft
   * POST /api/v1/sparkles/drafts
   */
  .post(
    '/drafts',
    async ({ headers, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      const draftId = await service.createDraft({
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject,
        body: body.body,
        isHtml: body.isHtml,
        threadId: body.threadId,
      });
      return { draftId };
    },
    {
      body: t.Object({
        to: t.Array(
          t.Object({
            email: t.String(),
            name: t.Optional(t.String()),
          })
        ),
        cc: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
            })
          )
        ),
        bcc: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
            })
          )
        ),
        subject: t.String(),
        body: t.String(),
        isHtml: t.Optional(t.Boolean()),
        threadId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Get attachment
   * GET /api/v1/sparkles/messages/:messageId/attachments/:attachmentId
   */
  .get('/messages/:messageId/attachments/:attachmentId', async ({ headers, params }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = getServiceFromSession(sessionId);
    const data = await service.getAttachment(params.messageId, params.attachmentId);
    return { data };
  })

  // ==========================================================================
  // Batch Operations
  // ==========================================================================

  /**
   * Batch modify messages
   * POST /api/v1/sparkles/messages/batch
   */
  .post(
    '/messages/batch',
    async ({ headers, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      await service.batchModifyMessages(body.messageIds, {
        addLabelIds: body.addLabelIds,
        removeLabelIds: body.removeLabelIds,
      });
      return { success: true };
    },
    {
      body: t.Object({
        messageIds: t.Array(t.String()),
        addLabelIds: t.Optional(t.Array(t.String())),
        removeLabelIds: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Get history (incremental sync)
   * GET /api/v1/sparkles/sync/history
   */
  .get('/sync/history', async ({ headers, query }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    if (!query.startHistoryId) {
      throw new Error('startHistoryId is required');
    }

    const service = getServiceFromSession(sessionId);
    return await service.getHistory(query.startHistoryId);
  })

  /**
   * Set up push notifications
   * POST /api/v1/sparkles/sync/watch
   */
  .post(
    '/sync/watch',
    async ({ headers, body }) => {
      const sessionId = headers['x-session-id'];
      if (!sessionId) throw new Error('Session ID required');

      const service = getServiceFromSession(sessionId);
      return await service.watchMailbox(body.topicName);
    },
    {
      body: t.Object({
        topicName: t.String(),
      }),
    }
  );
