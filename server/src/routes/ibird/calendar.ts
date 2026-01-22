/**
 * iBird Calendar Routes
 * Calendars, events, reminders, and tasks
 */

import { Elysia, t } from 'elysia';
import { calendarService } from '../../services/ibird/index.js';

// Temporary: Get user ID from header
const getUserId = (headers: Record<string, string | undefined>): string => {
  const userId = headers['x-user-id'];
  if (!userId) throw new Error('User ID required');
  return userId;
};

export const calendarRoutes = new Elysia({ prefix: '/calendars' })
  // ==========================================================================
  // CALENDARS
  // ==========================================================================

  /**
   * List calendars
   * GET /api/v1/ibird/calendars
   */
  .get('/', async ({ headers }) => {
    const userId = getUserId(headers);
    return await calendarService.listCalendars(userId);
  })

  /**
   * Get a single calendar
   * GET /api/v1/ibird/calendars/:id
   */
  .get('/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const calendar = await calendarService.getCalendar(params.id, userId);
    if (!calendar) throw new Error('Calendar not found');
    return calendar;
  })

  /**
   * Create a calendar
   * POST /api/v1/ibird/calendars
   */
  .post(
    '/',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await calendarService.createCalendar(userId, body);
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
        source: t.Optional(t.Union([
          t.Literal('local'),
          t.Literal('google'),
          t.Literal('microsoft'),
          t.Literal('caldav'),
        ])),
        timezone: t.Optional(t.String()),
        isPrimary: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Update a calendar
   * PUT /api/v1/ibird/calendars/:id
   */
  .put(
    '/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const calendar = await calendarService.updateCalendar(params.id, userId, body);
      if (!calendar) throw new Error('Calendar not found');
      return calendar;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        isPrimary: t.Optional(t.Boolean()),
        isVisible: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Delete a calendar
   * DELETE /api/v1/ibird/calendars/:id
   */
  .delete('/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await calendarService.deleteCalendar(params.id, userId);
    if (!deleted) throw new Error('Calendar not found');
    return { success: true };
  })

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * List events in a date range
   * GET /api/v1/ibird/events
   */
  .get('/events', async ({ headers, query }) => {
    const userId = getUserId(headers);

    if (!query.start || !query.end) {
      throw new Error('start and end dates required');
    }

    return await calendarService.listEvents(userId, {
      start: new Date(query.start),
      end: new Date(query.end),
      calendarIds: query.calendarIds?.split(','),
    });
  }, { prefix: '' }) // Use empty prefix to put at /api/v1/ibird/events

  /**
   * Get a single event
   * GET /api/v1/ibird/events/:id
   */
  .get('/events/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const event = await calendarService.getEvent(params.id, userId);
    if (!event) throw new Error('Event not found');
    return event;
  }, { prefix: '' })

  /**
   * Create an event
   * POST /api/v1/ibird/events
   */
  .post(
    '/events',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await calendarService.createEvent(userId, body);
    },
    {
      prefix: '',
      body: t.Object({
        calendarId: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        location: t.Optional(t.String()),
        videoLink: t.Optional(t.String()),
        startTime: t.String(),
        endTime: t.String(),
        timezone: t.Optional(t.String()),
        isAllDay: t.Optional(t.Boolean()),
        recurrence: t.Optional(
          t.Object({
            frequency: t.Union([
              t.Literal('daily'),
              t.Literal('weekly'),
              t.Literal('monthly'),
              t.Literal('yearly'),
            ]),
            interval: t.Optional(t.Number()),
            until: t.Optional(t.String()),
            count: t.Optional(t.Number()),
            byDayOfWeek: t.Optional(t.Array(t.Number())),
          })
        ),
        status: t.Optional(t.Union([
          t.Literal('confirmed'),
          t.Literal('tentative'),
          t.Literal('cancelled'),
        ])),
        attendees: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
              status: t.Optional(t.Union([
                t.Literal('accepted'),
                t.Literal('declined'),
                t.Literal('tentative'),
                t.Literal('needs_action'),
              ])),
              required: t.Optional(t.Boolean()),
            })
          )
        ),
        color: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update an event
   * PUT /api/v1/ibird/events/:id
   */
  .put(
    '/events/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const event = await calendarService.updateEvent(params.id, userId, body);
      if (!event) throw new Error('Event not found');
      return event;
    },
    {
      prefix: '',
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        location: t.Optional(t.String()),
        videoLink: t.Optional(t.String()),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        isAllDay: t.Optional(t.Boolean()),
        recurrence: t.Optional(
          t.Object({
            frequency: t.Union([
              t.Literal('daily'),
              t.Literal('weekly'),
              t.Literal('monthly'),
              t.Literal('yearly'),
            ]),
            interval: t.Optional(t.Number()),
            until: t.Optional(t.String()),
            count: t.Optional(t.Number()),
            byDayOfWeek: t.Optional(t.Array(t.Number())),
          })
        ),
        status: t.Optional(t.Union([
          t.Literal('confirmed'),
          t.Literal('tentative'),
          t.Literal('cancelled'),
        ])),
        attendees: t.Optional(
          t.Array(
            t.Object({
              email: t.String(),
              name: t.Optional(t.String()),
              status: t.Optional(t.Union([
                t.Literal('accepted'),
                t.Literal('declined'),
                t.Literal('tentative'),
                t.Literal('needs_action'),
              ])),
              required: t.Optional(t.Boolean()),
            })
          )
        ),
        color: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete an event
   * DELETE /api/v1/ibird/events/:id
   */
  .delete('/events/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await calendarService.deleteEvent(params.id, userId);
    if (!deleted) throw new Error('Event not found');
    return { success: true };
  }, { prefix: '' })

  // ==========================================================================
  // REMINDERS
  // ==========================================================================

  /**
   * Add a reminder to an event
   * POST /api/v1/ibird/events/:id/reminders
   */
  .post(
    '/events/:id/reminders',
    async ({ params, body }) => {
      return await calendarService.addReminder(params.id, body.type, body.minutesBefore);
    },
    {
      prefix: '',
      body: t.Object({
        type: t.Union([t.Literal('notification'), t.Literal('email')]),
        minutesBefore: t.Number(),
      }),
    }
  )

  /**
   * Delete a reminder
   * DELETE /api/v1/ibird/reminders/:id
   */
  .delete('/reminders/:id', async ({ params }) => {
    const deleted = await calendarService.deleteReminder(params.id);
    if (!deleted) throw new Error('Reminder not found');
    return { success: true };
  }, { prefix: '' })

  // ==========================================================================
  // TASKS
  // ==========================================================================

  /**
   * List tasks for a calendar
   * GET /api/v1/ibird/calendars/:id/tasks
   */
  .get('/:id/tasks', async ({ params, query }) => {
    return await calendarService.listTasks(params.id, {
      includeCompleted: query.includeCompleted === 'true',
    });
  })

  /**
   * Create a task
   * POST /api/v1/ibird/calendars/:id/tasks
   */
  .post(
    '/:id/tasks',
    async ({ params, body }) => {
      return await calendarService.createTask({
        calendarId: params.id,
        ...body,
      });
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        dueTime: t.Optional(t.String()),
        priority: t.Optional(t.Number()),
      }),
    }
  )

  /**
   * Update a task
   * PUT /api/v1/ibird/tasks/:id
   */
  .put(
    '/tasks/:id',
    async ({ params, body }) => {
      const task = await calendarService.updateTask(params.id, body);
      if (!task) throw new Error('Task not found');
      return task;
    },
    {
      prefix: '',
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        dueTime: t.Optional(t.String()),
        priority: t.Optional(t.Number()),
        status: t.Optional(t.Union([
          t.Literal('needs_action'),
          t.Literal('in_progress'),
          t.Literal('completed'),
          t.Literal('cancelled'),
        ])),
        percentComplete: t.Optional(t.Number()),
      }),
    }
  )

  /**
   * Delete a task
   * DELETE /api/v1/ibird/tasks/:id
   */
  .delete('/tasks/:id', async ({ params }) => {
    const deleted = await calendarService.deleteTask(params.id);
    if (!deleted) throw new Error('Task not found');
    return { success: true };
  }, { prefix: '' });
