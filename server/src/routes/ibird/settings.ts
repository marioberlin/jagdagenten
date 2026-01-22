/**
 * iBird Settings Routes
 * User settings and preferences
 */

import { Elysia, t } from 'elysia';
import { settingsService } from '../../services/ibird/index.js';

// Temporary: Get user ID from header (in production, use proper auth middleware)
const getUserId = (headers: Record<string, string | undefined>): string => {
  const userId = headers['x-user-id'];
  if (!userId) throw new Error('User ID required');
  return userId;
};

export const settingsRoutes = new Elysia({ prefix: '/settings' })
  /**
   * Get user settings
   * GET /api/v1/ibird/settings
   */
  .get('/', async ({ headers }) => {
    const userId = getUserId(headers);
    return await settingsService.getSettings(userId);
  })

  /**
   * Update user settings
   * PUT /api/v1/ibird/settings
   */
  .put(
    '/',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await settingsService.updateSettings(userId, body);
    },
    {
      body: t.Object({
        defaultModule: t.Optional(t.Union([t.Literal('mail'), t.Literal('calendar'), t.Literal('appointments')])),
        timezone: t.Optional(t.String()),
        dateFormat: t.Optional(t.String()),
        timeFormat: t.Optional(t.Union([t.Literal('12h'), t.Literal('24h')])),
        mailSignatureHtml: t.Optional(t.String()),
        mailSignatureText: t.Optional(t.String()),
        mailPreviewLines: t.Optional(t.Number()),
        mailThreadView: t.Optional(t.Boolean()),
        mailAutoMarkRead: t.Optional(t.Boolean()),
        calendarWeekStart: t.Optional(t.Number()),
        calendarDefaultView: t.Optional(t.Union([
          t.Literal('day'),
          t.Literal('week'),
          t.Literal('month'),
          t.Literal('year'),
          t.Literal('agenda'),
        ])),
        calendarDefaultDuration: t.Optional(t.Number()),
        calendarDefaultReminder: t.Optional(t.Number()),
        appointmentsBookingPageUsername: t.Optional(t.String()),
        appointmentsDefaultTimezone: t.Optional(t.String()),
        notificationsEmailEnabled: t.Optional(t.Boolean()),
        notificationsBrowserEnabled: t.Optional(t.Boolean()),
        notificationsSoundEnabled: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Check if booking page username is available
   * GET /api/v1/ibird/settings/check-username
   */
  .get('/check-username', async ({ headers, query }) => {
    const userId = getUserId(headers);
    const username = query.username;
    if (!username) throw new Error('Username required');

    const available = await settingsService.isBookingUsernameAvailable(username, userId);
    return { available };
  });
