/**
 * iBird Appointments Service
 * Manages appointment types, availability, and bookings
 */

import { pool } from '../../db.js';
import type {
  AppointmentType,
  AppointmentTypeCreateInput,
  AvailabilitySchedule,
  AvailabilityOverride,
  Booking,
  BookingCreateInput,
  WeeklyHours,
  TimeSlot,
  AvailableSlot,
} from '../../types/ibird.js';

export class AppointmentsService {
  // =========================================================================
  // APPOINTMENT TYPES
  // =========================================================================

  /**
   * List appointment types for a user
   */
  async listAppointmentTypes(userId: string): Promise<AppointmentType[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_appointment_types
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    return result.rows.map(this.mapRowToAppointmentType);
  }

  /**
   * Get a single appointment type
   */
  async getAppointmentType(typeId: string, userId?: string): Promise<AppointmentType | null> {
    let query = `SELECT * FROM ibird_appointment_types WHERE id = $1`;
    const values: any[] = [typeId];

    if (userId) {
      query += ` AND user_id = $2`;
      values.push(userId);
    }

    const result = await pool.query(query, values);
    if (!result.rows[0]) return null;
    return this.mapRowToAppointmentType(result.rows[0]);
  }

  /**
   * Get appointment type by slug (for public booking)
   */
  async getAppointmentTypeBySlug(userId: string, slug: string): Promise<AppointmentType | null> {
    const result = await pool.query(
      `SELECT * FROM ibird_appointment_types
       WHERE user_id = $1 AND slug = $2 AND is_active = TRUE`,
      [userId, slug]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToAppointmentType(result.rows[0]);
  }

  /**
   * Create an appointment type
   */
  async createAppointmentType(userId: string, input: AppointmentTypeCreateInput): Promise<AppointmentType> {
    const result = await pool.query(
      `INSERT INTO ibird_appointment_types (
        user_id, name, slug, description,
        duration_minutes, buffer_before_minutes, buffer_after_minutes,
        location_type, location_address, video_provider, video_link,
        min_notice_minutes, max_booking_days, max_bookings_per_day,
        color, custom_fields, availability_schedule_id, calendar_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        userId,
        input.name,
        input.slug,
        input.description || null,
        input.durationMinutes || 30,
        input.bufferBeforeMinutes || 0,
        input.bufferAfterMinutes || 0,
        input.locationType || 'video',
        input.locationAddress || null,
        input.videoProvider || null,
        input.videoLink || null,
        input.minNoticeMinutes || 1440,
        input.maxBookingDays || 60,
        input.maxBookingsPerDay || null,
        input.color || '#3B82F6',
        JSON.stringify(input.customFields || []),
        input.availabilityScheduleId || null,
        input.calendarId || null,
      ]
    );

    return this.mapRowToAppointmentType(result.rows[0]);
  }

  /**
   * Update an appointment type
   */
  async updateAppointmentType(
    typeId: string,
    userId: string,
    updates: Partial<AppointmentTypeCreateInput & { isActive: boolean }>
  ): Promise<AppointmentType | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      name: 'name',
      slug: 'slug',
      description: 'description',
      durationMinutes: 'duration_minutes',
      bufferBeforeMinutes: 'buffer_before_minutes',
      bufferAfterMinutes: 'buffer_after_minutes',
      locationType: 'location_type',
      locationAddress: 'location_address',
      videoProvider: 'video_provider',
      videoLink: 'video_link',
      minNoticeMinutes: 'min_notice_minutes',
      maxBookingDays: 'max_booking_days',
      maxBookingsPerDay: 'max_bookings_per_day',
      color: 'color',
      isActive: 'is_active',
      availabilityScheduleId: 'availability_schedule_id',
      calendarId: 'calendar_id',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && fieldMappings[key]) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updates.customFields !== undefined) {
      updateFields.push(`custom_fields = $${paramIndex++}`);
      values.push(JSON.stringify(updates.customFields));
    }

    if (updateFields.length === 0) {
      return this.getAppointmentType(typeId, userId);
    }

    values.push(typeId, userId);

    const result = await pool.query(
      `UPDATE ibird_appointment_types
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToAppointmentType(result.rows[0]);
  }

  /**
   * Delete an appointment type
   */
  async deleteAppointmentType(typeId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_appointment_types
       WHERE id = $1 AND user_id = $2`,
      [typeId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // AVAILABILITY SCHEDULES
  // =========================================================================

  /**
   * List availability schedules
   */
  async listAvailabilitySchedules(userId: string): Promise<AvailabilitySchedule[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_availability_schedules
       WHERE user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [userId]
    );

    return result.rows.map(this.mapRowToSchedule);
  }

  /**
   * Get a single schedule
   */
  async getSchedule(scheduleId: string, userId?: string): Promise<AvailabilitySchedule | null> {
    let query = `SELECT * FROM ibird_availability_schedules WHERE id = $1`;
    const values: any[] = [scheduleId];

    if (userId) {
      query += ` AND user_id = $2`;
      values.push(userId);
    }

    const result = await pool.query(query, values);
    if (!result.rows[0]) return null;
    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Create an availability schedule
   */
  async createSchedule(
    userId: string,
    data: { name: string; timezone: string; weeklyHours: WeeklyHours; isDefault?: boolean }
  ): Promise<AvailabilitySchedule> {
    // If default, unset other defaults
    if (data.isDefault) {
      await pool.query(
        `UPDATE ibird_availability_schedules SET is_default = FALSE WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO ibird_availability_schedules (user_id, name, timezone, weekly_hours, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, data.name, data.timezone, JSON.stringify(data.weeklyHours), data.isDefault || false]
    );

    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Update an availability schedule
   */
  async updateSchedule(
    scheduleId: string,
    userId: string,
    updates: Partial<{ name: string; timezone: string; weeklyHours: WeeklyHours; isDefault: boolean }>
  ): Promise<AvailabilitySchedule | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      values.push(updates.timezone);
    }
    if (updates.weeklyHours !== undefined) {
      updateFields.push(`weekly_hours = $${paramIndex++}`);
      values.push(JSON.stringify(updates.weeklyHours));
    }
    if (updates.isDefault !== undefined) {
      updateFields.push(`is_default = $${paramIndex++}`);
      values.push(updates.isDefault);

      // If setting as default, unset others
      if (updates.isDefault) {
        await pool.query(
          `UPDATE ibird_availability_schedules SET is_default = FALSE WHERE user_id = $1 AND id != $2`,
          [userId, scheduleId]
        );
      }
    }

    if (updateFields.length === 0) {
      return this.getSchedule(scheduleId, userId);
    }

    values.push(scheduleId, userId);

    const result = await pool.query(
      `UPDATE ibird_availability_schedules
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_availability_schedules
       WHERE id = $1 AND user_id = $2`,
      [scheduleId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // AVAILABILITY OVERRIDES
  // =========================================================================

  /**
   * List overrides for a schedule in a date range
   */
  async listOverrides(
    scheduleId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityOverride[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_availability_overrides
       WHERE schedule_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [scheduleId, startDate, endDate]
    );

    return result.rows.map(this.mapRowToOverride);
  }

  /**
   * Set an override for a specific date
   */
  async setOverride(
    scheduleId: string,
    data: { date: string; isAvailable: boolean; slots?: TimeSlot[]; reason?: string }
  ): Promise<AvailabilityOverride> {
    const result = await pool.query(
      `INSERT INTO ibird_availability_overrides (schedule_id, date, is_available, slots, reason)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (schedule_id, date)
       DO UPDATE SET is_available = EXCLUDED.is_available, slots = EXCLUDED.slots, reason = EXCLUDED.reason
       RETURNING *`,
      [scheduleId, data.date, data.isAvailable, JSON.stringify(data.slots || []), data.reason || null]
    );

    return this.mapRowToOverride(result.rows[0]);
  }

  /**
   * Delete an override
   */
  async deleteOverride(scheduleId: string, date: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_availability_overrides
       WHERE schedule_id = $1 AND date = $2`,
      [scheduleId, date]
    );

    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // AVAILABLE SLOTS CALCULATION
  // =========================================================================

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(
    typeId: string,
    date: string
  ): Promise<AvailableSlot[]> {
    const type = await this.getAppointmentType(typeId);
    if (!type || !type.availabilityScheduleId) {
      return [];
    }

    const schedule = await this.getSchedule(type.availabilityScheduleId);
    if (!schedule) return [];

    // Get day of week
    const dateObj = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getUTCDay()] as keyof WeeklyHours;

    // Check for override
    const overrides = await this.listOverrides(schedule.id, date, date);
    const override = overrides[0];

    let daySlots: TimeSlot[];
    if (override) {
      if (!override.isAvailable) return [];
      daySlots = override.slots;
    } else {
      daySlots = schedule.weeklyHours[dayName] || [];
    }

    if (daySlots.length === 0) return [];

    // Get existing bookings for this date
    const existingBookings = await this.listBookingsForDate(type.userId, date);
    const typeBookings = existingBookings.filter(b =>
      b.appointmentTypeId === typeId && ['pending', 'confirmed'].includes(b.status)
    );

    // Generate slots
    const availableSlots: AvailableSlot[] = [];
    const duration = type.durationMinutes;
    const bufferAfter = type.bufferAfterMinutes;

    for (const period of daySlots) {
      let currentMinutes = this.timeToMinutes(period.start);
      const endMinutes = this.timeToMinutes(period.end);

      while (currentMinutes + duration <= endMinutes) {
        const slotStart = this.minutesToTime(currentMinutes);
        const slotEnd = this.minutesToTime(currentMinutes + duration);

        // Check for conflicts
        const hasConflict = typeBookings.some(booking => {
          const bookingStart = this.timeToMinutes(booking.startTime);
          const bookingEnd = this.timeToMinutes(booking.endTime);
          const slotStartMin = currentMinutes;
          const slotEndMin = currentMinutes + duration;

          return !(slotEndMin <= bookingStart || slotStartMin >= bookingEnd);
        });

        if (!hasConflict) {
          availableSlots.push({ start: slotStart, end: slotEnd });
        }

        currentMinutes += duration + bufferAfter;
      }
    }

    // Filter out slots that don't meet min notice
    const now = new Date();
    const minNoticeTime = new Date(now.getTime() + type.minNoticeMinutes * 60000);

    return availableSlots.filter(slot => {
      const slotDateTime = new Date(`${date}T${slot.start}:00`);
      return slotDateTime > minNoticeTime;
    });
  }

  // =========================================================================
  // BOOKINGS
  // =========================================================================

  /**
   * List bookings for a host
   */
  async listBookings(
    hostUserId: string,
    options: {
      status?: string[];
      typeId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ bookings: Booking[]; total: number }> {
    const conditions: string[] = ['b.host_user_id = $1'];
    const values: any[] = [hostUserId];
    let paramIndex = 2;

    if (options.status && options.status.length > 0) {
      conditions.push(`b.status = ANY($${paramIndex++})`);
      values.push(options.status);
    }

    if (options.typeId) {
      conditions.push(`b.appointment_type_id = $${paramIndex++}`);
      values.push(options.typeId);
    }

    if (options.startDate) {
      conditions.push(`b.scheduled_date >= $${paramIndex++}`);
      values.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push(`b.scheduled_date <= $${paramIndex++}`);
      values.push(options.endDate);
    }

    const whereClause = conditions.join(' AND ');
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ibird_bookings b WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Query
    values.push(limit, offset);
    const result = await pool.query(
      `SELECT b.*, t.name as type_name, t.duration_minutes, t.color as type_color
       FROM ibird_bookings b
       JOIN ibird_appointment_types t ON t.id = b.appointment_type_id
       WHERE ${whereClause}
       ORDER BY b.scheduled_date DESC, b.start_time DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    return {
      bookings: result.rows.map(this.mapRowToBooking),
      total,
    };
  }

  /**
   * List bookings for a specific date
   */
  async listBookingsForDate(userId: string, date: string): Promise<Booking[]> {
    const result = await pool.query(
      `SELECT b.* FROM ibird_bookings b
       WHERE b.host_user_id = $1 AND b.scheduled_date = $2`,
      [userId, date]
    );

    return result.rows.map(this.mapRowToBooking);
  }

  /**
   * Get a single booking
   */
  async getBooking(bookingId: string, hostUserId?: string): Promise<Booking | null> {
    let query = `
      SELECT b.*, t.name as type_name, t.duration_minutes, t.color as type_color
      FROM ibird_bookings b
      JOIN ibird_appointment_types t ON t.id = b.appointment_type_id
      WHERE b.id = $1
    `;
    const values: any[] = [bookingId];

    if (hostUserId) {
      query += ` AND b.host_user_id = $2`;
      values.push(hostUserId);
    }

    const result = await pool.query(query, values);
    if (!result.rows[0]) return null;
    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Create a booking
   */
  async createBooking(input: BookingCreateInput & { hostUserId: string }): Promise<Booking> {
    const type = await this.getAppointmentType(input.appointmentTypeId);
    if (!type) {
      throw new Error('Appointment type not found');
    }

    const endTime = this.minutesToTime(
      this.timeToMinutes(input.startTime) + type.durationMinutes
    );

    const result = await pool.query(
      `INSERT INTO ibird_bookings (
        appointment_type_id, host_user_id,
        invitee_name, invitee_email, invitee_phone, invitee_timezone,
        scheduled_date, start_time, end_time,
        location_type, location_details, notes, custom_field_responses
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        input.appointmentTypeId,
        input.hostUserId,
        input.inviteeName,
        input.inviteeEmail,
        input.inviteePhone || null,
        input.inviteeTimezone || null,
        input.scheduledDate,
        input.startTime,
        endTime,
        type.locationType,
        type.locationType === 'video' ? type.videoLink : type.locationAddress,
        input.notes || null,
        JSON.stringify(input.customFieldResponses || {}),
      ]
    );

    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Confirm a booking
   */
  async confirmBooking(bookingId: string, hostUserId: string): Promise<Booking | null> {
    const result = await pool.query(
      `UPDATE ibird_bookings
       SET status = 'confirmed', confirmation_sent_at = NOW()
       WHERE id = $1 AND host_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [bookingId, hostUserId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: 'host' | 'invitee',
    reason?: string,
    hostUserId?: string
  ): Promise<Booking | null> {
    let query = `
      UPDATE ibird_bookings
      SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $2, cancellation_reason = $3
      WHERE id = $1 AND status IN ('pending', 'confirmed')
    `;
    const values: any[] = [bookingId, cancelledBy, reason || null];

    if (hostUserId) {
      query += ` AND host_user_id = $4`;
      values.push(hostUserId);
    }

    query += ` RETURNING *`;

    const result = await pool.query(query, values);
    if (!result.rows[0]) return null;
    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string,
    hostUserId: string,
    newDate: string,
    newStartTime: string
  ): Promise<Booking | null> {
    const booking = await this.getBooking(bookingId, hostUserId);
    if (!booking) return null;

    const type = await this.getAppointmentType(booking.appointmentTypeId);
    if (!type) return null;

    const newEndTime = this.minutesToTime(
      this.timeToMinutes(newStartTime) + type.durationMinutes
    );

    // Cancel old booking
    await pool.query(
      `UPDATE ibird_bookings SET status = 'cancelled', cancelled_by = 'host', cancellation_reason = 'Rescheduled'
       WHERE id = $1`,
      [bookingId]
    );

    // Create new booking
    const result = await pool.query(
      `INSERT INTO ibird_bookings (
        appointment_type_id, host_user_id,
        invitee_name, invitee_email, invitee_phone, invitee_timezone,
        scheduled_date, start_time, end_time,
        location_type, location_details, notes, custom_field_responses,
        rescheduled_from_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'confirmed')
      RETURNING *`,
      [
        booking.appointmentTypeId,
        hostUserId,
        booking.inviteeName,
        booking.inviteeEmail,
        booking.inviteePhone,
        booking.inviteeTimezone,
        newDate,
        newStartTime,
        newEndTime,
        booking.locationType,
        booking.locationDetails,
        booking.notes,
        JSON.stringify(booking.customFieldResponses || {}),
        bookingId,
      ]
    );

    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Mark booking as completed
   */
  async completeBooking(bookingId: string, hostUserId: string): Promise<Booking | null> {
    const result = await pool.query(
      `UPDATE ibird_bookings
       SET status = 'completed'
       WHERE id = $1 AND host_user_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [bookingId, hostUserId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToBooking(result.rows[0]);
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId: string, hostUserId: string): Promise<Booking | null> {
    const result = await pool.query(
      `UPDATE ibird_bookings
       SET status = 'no_show'
       WHERE id = $1 AND host_user_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [bookingId, hostUserId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToBooking(result.rows[0]);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private mapRowToAppointmentType(row: any): AppointmentType {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      durationMinutes: row.duration_minutes,
      bufferBeforeMinutes: row.buffer_before_minutes,
      bufferAfterMinutes: row.buffer_after_minutes,
      locationType: row.location_type,
      locationAddress: row.location_address,
      videoProvider: row.video_provider,
      videoLink: row.video_link,
      minNoticeMinutes: row.min_notice_minutes,
      maxBookingDays: row.max_booking_days,
      maxBookingsPerDay: row.max_bookings_per_day,
      color: row.color,
      isActive: row.is_active,
      availabilityScheduleId: row.availability_schedule_id,
      calendarId: row.calendar_id,
      customFields: typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToSchedule(row: any): AvailabilitySchedule {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      timezone: row.timezone,
      weeklyHours: typeof row.weekly_hours === 'string' ? JSON.parse(row.weekly_hours) : row.weekly_hours,
      isDefault: row.is_default,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToOverride(row: any): AvailabilityOverride {
    return {
      id: row.id,
      scheduleId: row.schedule_id,
      date: row.date,
      isAvailable: row.is_available,
      slots: typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots || [],
      reason: row.reason,
      createdAt: new Date(row.created_at),
    };
  }

  private mapRowToBooking(row: any): Booking {
    return {
      id: row.id,
      appointmentTypeId: row.appointment_type_id,
      hostUserId: row.host_user_id,
      inviteeName: row.invitee_name,
      inviteeEmail: row.invitee_email,
      inviteePhone: row.invitee_phone,
      inviteeTimezone: row.invitee_timezone,
      scheduledDate: row.scheduled_date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      locationType: row.location_type,
      locationDetails: row.location_details,
      notes: row.notes,
      customFieldResponses: typeof row.custom_field_responses === 'string'
        ? JSON.parse(row.custom_field_responses)
        : row.custom_field_responses || {},
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      cancelledBy: row.cancelled_by,
      cancellationReason: row.cancellation_reason,
      rescheduledFromId: row.rescheduled_from_id,
      calendarEventId: row.calendar_event_id,
      confirmationSentAt: row.confirmation_sent_at ? new Date(row.confirmation_sent_at) : undefined,
      reminderSentAt: row.reminder_sent_at ? new Date(row.reminder_sent_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      appointmentType: row.type_name ? {
        id: row.appointment_type_id,
        name: row.type_name,
        durationMinutes: row.duration_minutes,
        color: row.type_color,
      } as any : undefined,
    };
  }
}

// Export singleton
export const appointmentsService = new AppointmentsService();
