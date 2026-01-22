/**
 * iBird Mail Routes
 * Email accounts, folders, messages, and operations
 */

import { Elysia, t } from 'elysia';
import {
  mailAccountService,
  mailMessageService,
} from '../../services/ibird/index.js';

// Temporary: Get user ID from header
const getUserId = (headers: Record<string, string | undefined>): string => {
  const userId = headers['x-user-id'];
  if (!userId) throw new Error('User ID required');
  return userId;
};

export const mailRoutes = new Elysia({ prefix: '/mail' })
  // ==========================================================================
  // ACCOUNTS
  // ==========================================================================

  /**
   * List mail accounts
   * GET /api/v1/ibird/mail/accounts
   */
  .get('/accounts', async ({ headers }) => {
    const userId = getUserId(headers);
    return await mailAccountService.listAccounts(userId);
  })

  /**
   * Get a single account
   * GET /api/v1/ibird/mail/accounts/:id
   */
  .get('/accounts/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const account = await mailAccountService.getAccount(params.id, userId);
    if (!account) throw new Error('Account not found');
    return account;
  })

  /**
   * Create a mail account
   * POST /api/v1/ibird/mail/accounts
   */
  .post(
    '/accounts',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await mailAccountService.createAccount(userId, body);
    },
    {
      body: t.Object({
        email: t.String(),
        displayName: t.Optional(t.String()),
        provider: t.Optional(t.String()),
        imapHost: t.String(),
        imapPort: t.Optional(t.Number()),
        imapSecure: t.Optional(t.Boolean()),
        smtpHost: t.String(),
        smtpPort: t.Optional(t.Number()),
        smtpSecure: t.Optional(t.Boolean()),
        authType: t.Union([t.Literal('password'), t.Literal('oauth2')]),
        password: t.Optional(t.String()),
        oauthTokens: t.Optional(
          t.Object({
            accessToken: t.String(),
            refreshToken: t.Optional(t.String()),
            expiresAt: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  /**
   * Update a mail account
   * PUT /api/v1/ibird/mail/accounts/:id
   */
  .put(
    '/accounts/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const account = await mailAccountService.updateAccount(params.id, userId, body);
      if (!account) throw new Error('Account not found');
      return account;
    },
    {
      body: t.Object({
        displayName: t.Optional(t.String()),
        syncFrequencyMinutes: t.Optional(t.Number()),
        signatureHtml: t.Optional(t.String()),
        signatureText: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete a mail account
   * DELETE /api/v1/ibird/mail/accounts/:id
   */
  .delete('/accounts/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await mailAccountService.deleteAccount(params.id, userId);
    if (!deleted) throw new Error('Account not found');
    return { success: true };
  })

  /**
   * Test account connection
   * POST /api/v1/ibird/mail/accounts/:id/test
   */
  .post('/accounts/:id/test', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const account = await mailAccountService.getAccount(params.id, userId);
    if (!account) throw new Error('Account not found');

    // TODO: Implement actual IMAP connection test
    // For now, return success if account exists
    return { success: true, message: 'Connection test not yet implemented' };
  })

  // ==========================================================================
  // FOLDERS
  // ==========================================================================

  /**
   * List folders for an account
   * GET /api/v1/ibird/mail/accounts/:id/folders
   */
  .get('/accounts/:id/folders', async ({ headers, params }) => {
    const userId = getUserId(headers);
    // Verify account belongs to user
    const account = await mailAccountService.getAccount(params.id, userId);
    if (!account) throw new Error('Account not found');

    return await mailAccountService.listFolders(params.id);
  })

  /**
   * Get a single folder
   * GET /api/v1/ibird/mail/folders/:id
   */
  .get('/folders/:id', async ({ params }) => {
    const folder = await mailAccountService.getFolder(params.id);
    if (!folder) throw new Error('Folder not found');
    return folder;
  })

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  /**
   * List messages in a folder
   * GET /api/v1/ibird/mail/folders/:id/messages
   */
  .get('/folders/:id/messages', async ({ params, query }) => {
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 50;

    return await mailMessageService.listMessages(params.id, { page, limit });
  })

  /**
   * Get a single message
   * GET /api/v1/ibird/mail/messages/:id
   */
  .get('/messages/:id', async ({ params }) => {
    const message = await mailMessageService.getMessage(params.id);
    if (!message) throw new Error('Message not found');
    return message;
  })

  /**
   * Mark messages as read
   * POST /api/v1/ibird/mail/messages/read
   */
  .post(
    '/messages/read',
    async ({ body }) => {
      await mailMessageService.setReadStatus(body.ids, body.read);
      return { success: true };
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
        read: t.Boolean(),
      }),
    }
  )

  /**
   * Toggle star on a message
   * POST /api/v1/ibird/mail/messages/:id/star
   */
  .post(
    '/messages/:id/star',
    async ({ params, body }) => {
      await mailMessageService.setStarred(params.id, body.starred);
      return { success: true };
    },
    {
      body: t.Object({
        starred: t.Boolean(),
      }),
    }
  )

  /**
   * Move messages to a folder
   * POST /api/v1/ibird/mail/messages/move
   */
  .post(
    '/messages/move',
    async ({ body }) => {
      await mailMessageService.moveMessages(body.ids, body.folderId);
      return { success: true };
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
        folderId: t.String(),
      }),
    }
  )

  /**
   * Delete messages (soft delete)
   * POST /api/v1/ibird/mail/messages/delete
   */
  .post(
    '/messages/delete',
    async ({ body }) => {
      await mailMessageService.deleteMessages(body.ids);
      return { success: true };
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
    }
  )

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  /**
   * Search messages
   * GET /api/v1/ibird/mail/search
   */
  .get('/search', async ({ headers, query }) => {
    const userId = getUserId(headers);

    return await mailMessageService.searchMessages(userId, {
      query: query.q,
      folderId: query.folderId,
      accountId: query.accountId,
      from: query.from,
      to: query.to,
      subject: query.subject,
      hasAttachments: query.hasAttachments === 'true',
      isUnread: query.isUnread === 'true',
      isStarred: query.isStarred === 'true',
      labelIds: query.labelIds?.split(','),
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  })

  // ==========================================================================
  // LABELS
  // ==========================================================================

  /**
   * List labels
   * GET /api/v1/ibird/mail/labels
   */
  .get('/labels', async ({ headers }) => {
    const userId = getUserId(headers);
    return await mailMessageService.listLabels(userId);
  })

  /**
   * Create a label
   * POST /api/v1/ibird/mail/labels
   */
  .post(
    '/labels',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await mailMessageService.createLabel(userId, body.name, body.color);
    },
    {
      body: t.Object({
        name: t.String(),
        color: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update a label
   * PUT /api/v1/ibird/mail/labels/:id
   */
  .put(
    '/labels/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const label = await mailMessageService.updateLabel(params.id, userId, body);
      if (!label) throw new Error('Label not found');
      return label;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        color: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete a label
   * DELETE /api/v1/ibird/mail/labels/:id
   */
  .delete('/labels/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await mailMessageService.deleteLabel(params.id, userId);
    if (!deleted) throw new Error('Label not found');
    return { success: true };
  })

  /**
   * Add labels to a message
   * POST /api/v1/ibird/mail/messages/:id/labels
   */
  .post(
    '/messages/:id/labels',
    async ({ params, body }) => {
      if (body.add?.length) {
        await mailMessageService.addLabelsToMessage(params.id, body.add);
      }
      if (body.remove?.length) {
        await mailMessageService.removeLabelsFromMessage(params.id, body.remove);
      }
      return { success: true };
    },
    {
      body: t.Object({
        add: t.Optional(t.Array(t.String())),
        remove: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // ==========================================================================
  // ATTACHMENTS
  // ==========================================================================

  /**
   * List attachments for a message
   * GET /api/v1/ibird/mail/messages/:id/attachments
   */
  .get('/messages/:id/attachments', async ({ params }) => {
    return await mailMessageService.listAttachments(params.id);
  });
