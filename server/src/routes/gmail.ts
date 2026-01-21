/**
 * Gmail API Routes for Sparkles Email Client
 *
 * Handles all Gmail-related operations including:
 * - OAuth authentication
 * - Thread listing and fetching
 * - Message operations (send, draft, modify)
 * - Label management
 * - Sync operations
 *
 * Token Storage:
 * - Uses Redis-backed encrypted token storage
 * - Falls back to memory when Redis is unavailable
 */

import { Elysia, t } from 'elysia';
import { createGmailService, GmailCredentials } from '../services/google/GmailService.js';
import { tokenStorage, StoredCredentials } from '../services/tokenStorage.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// In-memory service cache (services are lightweight, tokens are stored securely)
const serviceCache = new Map<string, ReturnType<typeof createGmailService>>();

// Helper to get or create Gmail service from session
const getServiceFromSession = async (sessionId: string) => {
  // Check cache first
  const cachedService = serviceCache.get(sessionId);
  if (cachedService) {
    return cachedService;
  }

  // Retrieve credentials from secure storage
  const credentials = await tokenStorage.retrieve(sessionId);
  if (!credentials) {
    throw new Error('Session not found. Please authenticate first.');
  }

  // Create and cache service
  const service = createGmailService();
  await service.setCredentials({
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt: credentials.expiresAt,
  });

  serviceCache.set(sessionId, service);
  return service;
};

// Clear service from cache
const clearServiceCache = (sessionId: string) => {
  serviceCache.delete(sessionId);
};

export const gmailRoutes = new Elysia({ prefix: '/api/v1/sparkles' })
  // ==========================================================================
  // Token Management Endpoints (New)
  // ==========================================================================

  /**
   * Store tokens (for client-side persistence)
   * POST /api/v1/sparkles/tokens/store
   */
  .post(
    '/tokens/store',
    async ({ body }) => {
      const sessionId = crypto.randomUUID();

      await tokenStorage.store(sessionId, {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt: body.expiresAt,
        email: body.email,
        name: body.name,
        avatar: body.avatar,
      });

      logger.info({ sessionId, email: body.email }, 'Tokens stored via API');

      return { sessionId };
    },
    {
      body: t.Object({
        accessToken: t.String(),
        refreshToken: t.String(),
        expiresAt: t.Number(),
        email: t.String(),
        name: t.Optional(t.String()),
        avatar: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Retrieve stored credentials
   * GET /api/v1/sparkles/tokens/retrieve
   */
  .get('/tokens/retrieve', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const credentials = await tokenStorage.retrieve(sessionId);
    if (!credentials) {
      throw new Error('Session not found');
    }

    // Don't return the full tokens, just metadata and expiry
    return {
      email: credentials.email,
      name: credentials.name,
      avatar: credentials.avatar,
      expiresAt: credentials.expiresAt,
      isValid: credentials.expiresAt > Date.now(),
    };
  })

  /**
   * Revoke tokens and end session
   * DELETE /api/v1/sparkles/tokens/revoke
   */
  .delete('/tokens/revoke', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    await tokenStorage.revoke(sessionId);
    clearServiceCache(sessionId);

    logger.info({ sessionId }, 'Tokens revoked via API');

    return { success: true };
  })

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

        // Create session and store tokens securely
        const sessionId = crypto.randomUUID();
        await tokenStorage.store(sessionId, {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
        });

        // Cache the service
        serviceCache.set(sessionId, service);

        logger.info({ email: profile.email, sessionId }, 'Gmail session created');

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

        // Create session and store tokens securely
        const sessionId = crypto.randomUUID();
        await tokenStorage.store(sessionId, {
          accessToken: body.credentials.accessToken,
          refreshToken: body.credentials.refreshToken,
          expiresAt: body.credentials.expiresAt,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
        });

        // Cache the service
        serviceCache.set(sessionId, service);

        logger.info({ email: profile.email, sessionId }, 'Gmail session restored');

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

      const service = await getServiceFromSession(sessionId);
      const credentials = await service.refreshAccessToken();

      // Update stored tokens
      await tokenStorage.update(sessionId, {
        accessToken: credentials.accessToken,
        expiresAt: credentials.expiresAt,
      });

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
  .post('/auth/logout', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (sessionId) {
      await tokenStorage.revoke(sessionId);
      clearServiceCache(sessionId);
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

    const service = await getServiceFromSession(sessionId);
    return await service.getProfile();
  })

  /**
   * List labels
   * GET /api/v1/sparkles/labels
   */
  .get('/labels', async ({ headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new Error('Session ID required');

    const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
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

    const service = await getServiceFromSession(sessionId);
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

      const service = await getServiceFromSession(sessionId);
      return await service.watchMailbox(body.topicName);
    },
    {
      body: t.Object({
        topicName: t.String(),
      }),
    }
  );
