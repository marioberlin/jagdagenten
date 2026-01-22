/**
 * iBird Calendar Service
 * Manages calendars, events, reminders, and tasks
 */

import { pool } from '../../db.js';
import type {
  Calendar,
  CalendarCreateInput,
  CalendarEvent,
  CalendarEventCreateInput,
  CalendarReminder,
  CalendarTask,
  RecurrenceRule,
  EventAttendee,
} from '../../types/ibird.js';

export class CalendarService {
  // =========================================================================
  // CALENDARS
  // =========================================================================

  /**
   * List all calendars for a user
   */
  async listCalendars(userId: string): Promise<Calendar[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_calendars
       WHERE user_id = $1
       ORDER BY is_primary DESC, name ASC`,
      [userId]
    );

    return result.rows.map(this.mapRowToCalendar);
  }

  /**
   * Get a single calendar
   */
  async getCalendar(calendarId: string, userId: string): Promise<Calendar | null> {
    const result = await pool.query(
      `SELECT * FROM ibird_calendars
       WHERE id = $1 AND user_id = $2`,
      [calendarId, userId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToCalendar(result.rows[0]);
  }

  /**
   * Create a new calendar
   */
  async createCalendar(userId: string, input: CalendarCreateInput): Promise<Calendar> {
    // If this is the primary calendar, unset other primaries
    if (input.isPrimary) {
      await pool.query(
        `UPDATE ibird_calendars SET is_primary = FALSE WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO ibird_calendars (
        user_id, name, description, color, source, timezone, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        input.name,
        input.description || null,
        input.color || '#3B82F6',
        input.source || 'local',
        input.timezone || 'UTC',
        input.isPrimary || false,
      ]
    );

    return this.mapRowToCalendar(result.rows[0]);
  }

  /**
   * Update a calendar
   */
  async updateCalendar(
    calendarId: string,
    userId: string,
    updates: Partial<CalendarCreateInput & { isVisible: boolean }>
  ): Promise<Calendar | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      name: 'name',
      description: 'description',
      color: 'color',
      timezone: 'timezone',
      isPrimary: 'is_primary',
      isVisible: 'is_visible',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMappings[key]) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return this.getCalendar(calendarId, userId);
    }

    // If setting as primary, unset others first
    if (updates.isPrimary) {
      await pool.query(
        `UPDATE ibird_calendars SET is_primary = FALSE WHERE user_id = $1 AND id != $2`,
        [userId, calendarId]
      );
    }

    values.push(calendarId, userId);

    const result = await pool.query(
      `UPDATE ibird_calendars
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToCalendar(result.rows[0]);
  }

  /**
   * Delete a calendar
   */
  async deleteCalendar(calendarId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_calendars
       WHERE id = $1 AND user_id = $2`,
      [calendarId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  /**
   * List events in a date range
   */
  async listEvents(
    userId: string,
    options: {
      start: Date;
      end: Date;
      calendarIds?: string[];
    }
  ): Promise<CalendarEvent[]> {
    let query = `
      SELECT e.*, c.name as calendar_name, c.color as calendar_color
      FROM ibird_calendar_events e
      JOIN ibird_calendars c ON c.id = e.calendar_id
      WHERE c.user_id = $1
        AND e.start_time < $3
        AND e.end_time > $2
    `;
    const values: any[] = [userId, options.start, options.end];

    if (options.calendarIds && options.calendarIds.length > 0) {
      query += ` AND e.calendar_id = ANY($4)`;
      values.push(options.calendarIds);
    }

    query += ` ORDER BY e.start_time ASC`;

    const result = await pool.query(query, values);
    return result.rows.map(this.mapRowToEvent);
  }

  /**
   * Get a single event
   */
  async getEvent(eventId: string, userId: string): Promise<CalendarEvent | null> {
    const result = await pool.query(
      `SELECT e.*, c.name as calendar_name, c.color as calendar_color
       FROM ibird_calendar_events e
       JOIN ibird_calendars c ON c.id = e.calendar_id
       WHERE e.id = $1 AND c.user_id = $2`,
      [eventId, userId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  /**
   * Create an event
   */
  async createEvent(userId: string, input: CalendarEventCreateInput): Promise<CalendarEvent> {
    // Verify calendar belongs to user
    const calendarCheck = await pool.query(
      `SELECT id FROM ibird_calendars WHERE id = $1 AND user_id = $2`,
      [input.calendarId, userId]
    );

    if (!calendarCheck.rows[0]) {
      throw new Error('Calendar not found');
    }

    const result = await pool.query(
      `INSERT INTO ibird_calendar_events (
        calendar_id, title, description, location, video_link,
        start_time, end_time, timezone, is_all_day,
        recurrence_rule, status, attendees, color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        input.calendarId,
        input.title,
        input.description || null,
        input.location || null,
        input.videoLink || null,
        input.startTime,
        input.endTime,
        input.timezone || null,
        input.isAllDay || false,
        input.recurrence ? JSON.stringify(input.recurrence) : null,
        input.status || 'confirmed',
        JSON.stringify(input.attendees || []),
        input.color || null,
      ]
    );

    return this.mapRowToEvent(result.rows[0]);
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    userId: string,
    updates: Partial<CalendarEventCreateInput>
  ): Promise<CalendarEvent | null> {
    // Verify event belongs to user's calendar
    const eventCheck = await pool.query(
      `SELECT e.id FROM ibird_calendar_events e
       JOIN ibird_calendars c ON c.id = e.calendar_id
       WHERE e.id = $1 AND c.user_id = $2`,
      [eventId, userId]
    );

    if (!eventCheck.rows[0]) return null;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const simpleFields = ['title', 'description', 'location', 'videoLink', 'timezone', 'status', 'color'];
    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      location: 'location',
      videoLink: 'video_link',
      startTime: 'start_time',
      endTime: 'end_time',
      timezone: 'timezone',
      isAllDay: 'is_all_day',
      status: 'status',
      color: 'color',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMappings[key]) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updates.recurrence !== undefined) {
      updateFields.push(`recurrence_rule = $${paramIndex++}`);
      values.push(updates.recurrence ? JSON.stringify(updates.recurrence) : null);
    }

    if (updates.attendees !== undefined) {
      updateFields.push(`attendees = $${paramIndex++}`);
      values.push(JSON.stringify(updates.attendees));
    }

    if (updateFields.length === 0) {
      return this.getEvent(eventId, userId);
    }

    values.push(eventId);

    const result = await pool.query(
      `UPDATE ibird_calendar_events
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToEvent(result.rows[0]);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_calendar_events e
       USING ibird_calendars c
       WHERE e.id = $1 AND e.calendar_id = c.id AND c.user_id = $2`,
      [eventId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // REMINDERS
  // =========================================================================

  /**
   * List reminders for an event
   */
  async listReminders(eventId: string): Promise<CalendarReminder[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_calendar_reminders
       WHERE event_id = $1
       ORDER BY minutes_before ASC`,
      [eventId]
    );

    return result.rows.map(this.mapRowToReminder);
  }

  /**
   * Add a reminder to an event
   */
  async addReminder(
    eventId: string,
    reminderType: 'notification' | 'email',
    minutesBefore: number
  ): Promise<CalendarReminder> {
    const result = await pool.query(
      `INSERT INTO ibird_calendar_reminders (event_id, reminder_type, minutes_before)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, reminderType, minutesBefore]
    );

    return this.mapRowToReminder(result.rows[0]);
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_calendar_reminders WHERE id = $1`,
      [reminderId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get pending reminders (for background job)
   */
  async getPendingReminders(): Promise<Array<{
    reminderId: string;
    eventId: string;
    reminderType: 'notification' | 'email';
    minutesBefore: number;
    eventTitle: string;
    eventStart: Date;
    userId: string;
    reminderTime: Date;
  }>> {
    const result = await pool.query(
      `SELECT * FROM ibird_pending_reminders`
    );

    return result.rows.map(row => ({
      reminderId: row.reminder_id,
      eventId: row.event_id,
      reminderType: row.reminder_type,
      minutesBefore: row.minutes_before,
      eventTitle: row.event_title,
      eventStart: new Date(row.event_start),
      userId: row.user_id,
      reminderTime: new Date(row.reminder_time),
    }));
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(reminderId: string): Promise<void> {
    await pool.query(
      `UPDATE ibird_calendar_reminders
       SET is_sent = TRUE, sent_at = NOW()
       WHERE id = $1`,
      [reminderId]
    );
  }

  // =========================================================================
  // TASKS
  // =========================================================================

  /**
   * List tasks for a calendar
   */
  async listTasks(
    calendarId: string,
    options: { includeCompleted?: boolean } = {}
  ): Promise<CalendarTask[]> {
    let query = `SELECT * FROM ibird_calendar_tasks WHERE calendar_id = $1`;
    if (!options.includeCompleted) {
      query += ` AND status != 'completed'`;
    }
    query += ` ORDER BY due_date NULLS LAST, priority ASC`;

    const result = await pool.query(query, [calendarId]);
    return result.rows.map(this.mapRowToTask);
  }

  /**
   * Create a task
   */
  async createTask(data: {
    calendarId: string;
    title: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    priority?: number;
  }): Promise<CalendarTask> {
    const result = await pool.query(
      `INSERT INTO ibird_calendar_tasks (
        calendar_id, title, description, due_date, due_time, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.calendarId,
        data.title,
        data.description || null,
        data.dueDate || null,
        data.dueTime || null,
        data.priority || 5,
      ]
    );

    return this.mapRowToTask(result.rows[0]);
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      dueDate: string;
      dueTime: string;
      priority: number;
      status: 'needs_action' | 'in_progress' | 'completed' | 'cancelled';
      percentComplete: number;
    }>
  ): Promise<CalendarTask | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      dueDate: 'due_date',
      dueTime: 'due_time',
      priority: 'priority',
      status: 'status',
      percentComplete: 'percent_complete',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMappings[key]) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex++}`);
        values.push(value);
      }
    }

    // Set completed_at if status is completed
    if (updates.status === 'completed') {
      updateFields.push(`completed_at = NOW()`);
    }

    if (updateFields.length === 0) return null;

    values.push(taskId);

    const result = await pool.query(
      `UPDATE ibird_calendar_tasks
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToTask(result.rows[0]);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_calendar_tasks WHERE id = $1`,
      [taskId]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private mapRowToCalendar(row: any): Calendar {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      color: row.color,
      source: row.source,
      externalId: row.external_id,
      syncUrl: row.sync_url,
      isVisible: row.is_visible,
      isPrimary: row.is_primary,
      timezone: row.timezone,
      syncToken: row.sync_token,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      lastError: row.last_error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToEvent(row: any): CalendarEvent {
    return {
      id: row.id,
      calendarId: row.calendar_id,
      externalId: row.external_id,
      etag: row.etag,
      title: row.title,
      description: row.description,
      location: row.location,
      videoLink: row.video_link,
      startTime: row.start_time,
      endTime: row.end_time,
      timezone: row.timezone,
      isAllDay: row.is_all_day,
      recurrence: row.recurrence_rule ? (typeof row.recurrence_rule === 'string' ? JSON.parse(row.recurrence_rule) : row.recurrence_rule) : undefined,
      recurrenceId: row.recurrence_id,
      originalEventId: row.original_event_id,
      status: row.status,
      visibility: row.visibility,
      attendees: typeof row.attendees === 'string' ? JSON.parse(row.attendees) : row.attendees || [],
      organizer: row.organizer ? (typeof row.organizer === 'string' ? JSON.parse(row.organizer) : row.organizer) : undefined,
      color: row.color,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      calendarName: row.calendar_name,
      calendarColor: row.calendar_color,
    };
  }

  private mapRowToReminder(row: any): CalendarReminder {
    return {
      id: row.id,
      eventId: row.event_id,
      reminderType: row.reminder_type,
      minutesBefore: row.minutes_before,
      isSent: row.is_sent,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private mapRowToTask(row: any): CalendarTask {
    return {
      id: row.id,
      calendarId: row.calendar_id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      dueTime: row.due_time,
      priority: row.priority,
      status: row.status,
      percentComplete: row.percent_complete,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      externalId: row.external_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton
export const calendarService = new CalendarService();
