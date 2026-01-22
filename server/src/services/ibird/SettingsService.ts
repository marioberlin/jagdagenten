/**
 * iBird Settings Service
 * Manages user preferences and settings
 */

import { pool } from '../../db.js';
import type {
  IBirdUserSettings,
  IBirdUserSettingsUpdateInput,
} from '../../types/ibird.js';

export class SettingsService {
  /**
   * Get user settings, creating defaults if not exists
   */
  async getSettings(userId: string): Promise<IBirdUserSettings> {
    // Try to get existing settings
    const result = await pool.query<IBirdUserSettings>(
      `SELECT * FROM ibird_user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows[0]) {
      return this.mapRowToSettings(result.rows[0]);
    }

    // Create default settings
    const insertResult = await pool.query<IBirdUserSettings>(
      `INSERT INTO ibird_user_settings (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );

    return this.mapRowToSettings(insertResult.rows[0]);
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    updates: IBirdUserSettingsUpdateInput
  ): Promise<IBirdUserSettings> {
    // Ensure settings exist
    await this.getSettings(userId);

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      defaultModule: 'default_module',
      timezone: 'timezone',
      dateFormat: 'date_format',
      timeFormat: 'time_format',
      mailSignatureHtml: 'mail_signature_html',
      mailSignatureText: 'mail_signature_text',
      mailPreviewLines: 'mail_preview_lines',
      mailThreadView: 'mail_thread_view',
      mailAutoMarkRead: 'mail_auto_mark_read',
      calendarWeekStart: 'calendar_week_start',
      calendarDefaultView: 'calendar_default_view',
      calendarDefaultDuration: 'calendar_default_duration',
      calendarDefaultReminder: 'calendar_default_reminder',
      appointmentsBookingPageUsername: 'appointments_booking_page_username',
      appointmentsDefaultTimezone: 'appointments_default_timezone',
      notificationsEmailEnabled: 'notifications_email_enabled',
      notificationsBrowserEnabled: 'notifications_browser_enabled',
      notificationsSoundEnabled: 'notifications_sound_enabled',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMappings[key]) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return this.getSettings(userId);
    }

    values.push(userId);

    const result = await pool.query<any>(
      `UPDATE ibird_user_settings
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return this.mapRowToSettings(result.rows[0]);
  }

  /**
   * Check if booking page username is available
   */
  async isBookingUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM ibird_user_settings
       WHERE appointments_booking_page_username = $1
       ${excludeUserId ? 'AND user_id != $2' : ''}
       LIMIT 1`,
      excludeUserId ? [username, excludeUserId] : [username]
    );

    return result.rows.length === 0;
  }

  /**
   * Get user by booking page username
   */
  async getUserByBookingUsername(username: string): Promise<{ userId: string } | null> {
    const result = await pool.query(
      `SELECT user_id FROM ibird_user_settings
       WHERE appointments_booking_page_username = $1`,
      [username]
    );

    if (result.rows[0]) {
      return { userId: result.rows[0].user_id };
    }

    return null;
  }

  /**
   * Map database row to settings object
   */
  private mapRowToSettings(row: any): IBirdUserSettings {
    return {
      userId: row.user_id,
      defaultModule: row.default_module,
      timezone: row.timezone,
      dateFormat: row.date_format,
      timeFormat: row.time_format,
      mailSignatureHtml: row.mail_signature_html,
      mailSignatureText: row.mail_signature_text,
      mailPreviewLines: row.mail_preview_lines,
      mailThreadView: row.mail_thread_view,
      mailAutoMarkRead: row.mail_auto_mark_read,
      calendarWeekStart: row.calendar_week_start,
      calendarDefaultView: row.calendar_default_view,
      calendarDefaultDuration: row.calendar_default_duration,
      calendarDefaultReminder: row.calendar_default_reminder,
      appointmentsBookingPageUsername: row.appointments_booking_page_username,
      appointmentsDefaultTimezone: row.appointments_default_timezone,
      notificationsEmailEnabled: row.notifications_email_enabled,
      notificationsBrowserEnabled: row.notifications_browser_enabled,
      notificationsSoundEnabled: row.notifications_sound_enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
