/**
 * iBird Public Routes
 * Public booking page (no authentication required)
 */

import { Elysia, t } from 'elysia';
import {
  settingsService,
  appointmentsService,
} from '../../services/ibird/index.js';
import { pool } from '../../db.js';

export const publicRoutes = new Elysia({ prefix: '/public' })
  /**
   * Get public profile by booking username
   * GET /api/v1/ibird/public/:username
   */
  .get('/:username', async ({ params }) => {
    const userSettings = await settingsService.getUserByBookingUsername(params.username);
    if (!userSettings) {
      throw new Error('User not found');
    }

    // Get user's public info
    const result = await pool.query(
      `SELECT display_name, avatar_url FROM users WHERE id = $1`,
      [userSettings.userId]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return {
      username: params.username,
      name: result.rows[0].display_name,
      avatarUrl: result.rows[0].avatar_url,
    };
  })

  /**
   * List public appointment types for a user
   * GET /api/v1/ibird/public/:username/types
   */
  .get('/:username/types', async ({ params }) => {
    const userSettings = await settingsService.getUserByBookingUsername(params.username);
    if (!userSettings) {
      throw new Error('User not found');
    }

    const types = await appointmentsService.listAppointmentTypes(userSettings.userId);
    // Only return active types with limited info
    return types
      .filter(t => t.isActive)
      .map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        durationMinutes: t.durationMinutes,
        color: t.color,
        locationType: t.locationType,
      }));
  })

  /**
   * Get a specific appointment type
   * GET /api/v1/ibird/public/:username/types/:typeId
   */
  .get('/:username/types/:typeId', async ({ params }) => {
    const userSettings = await settingsService.getUserByBookingUsername(params.username);
    if (!userSettings) {
      throw new Error('User not found');
    }

    const type = await appointmentsService.getAppointmentType(params.typeId, userSettings.userId);
    if (!type || !type.isActive) {
      throw new Error('Appointment type not found');
    }

    return {
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description,
      durationMinutes: type.durationMinutes,
      color: type.color,
      locationType: type.locationType,
      customFields: type.customFields,
    };
  })

  /**
   * Get available dates for an appointment type
   * GET /api/v1/ibird/public/:username/types/:typeId/dates
   */
  .get('/:username/types/:typeId/dates', async ({ params, query }) => {
    const userSettings = await settingsService.getUserByBookingUsername(params.username);
    if (!userSettings) {
      throw new Error('User not found');
    }

    const type = await appointmentsService.getAppointmentType(params.typeId, userSettings.userId);
    if (!type || !type.isActive) {
      throw new Error('Appointment type not found');
    }

    // Calculate date range
    const startDate = query.startDate || new Date().toISOString().split('T')[0];
    const endDate = query.endDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + (type.maxBookingDays || 60));
      return d.toISOString().split('T')[0];
    })();

    // Get available dates
    const availableDates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const slots = await appointmentsService.getAvailableSlots(type.id, dateStr);
      if (slots.length > 0) {
        availableDates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    return { availableDates };
  })

  /**
   * Get available time slots for a specific date
   * GET /api/v1/ibird/public/:username/types/:typeId/slots
   */
  .get('/:username/types/:typeId/slots', async ({ params, query }) => {
    const userSettings = await settingsService.getUserByBookingUsername(params.username);
    if (!userSettings) {
      throw new Error('User not found');
    }

    const type = await appointmentsService.getAppointmentType(params.typeId, userSettings.userId);
    if (!type || !type.isActive) {
      throw new Error('Appointment type not found');
    }

    if (!query.date) {
      throw new Error('Date required');
    }

    const slots = await appointmentsService.getAvailableSlots(type.id, query.date);
    return { slots };
  })

  /**
   * Create a booking (public)
   * POST /api/v1/ibird/public/:username/book
   */
  .post(
    '/:username/book',
    async ({ params, body }) => {
      const userSettings = await settingsService.getUserByBookingUsername(params.username);
      if (!userSettings) {
        throw new Error('User not found');
      }

      const type = await appointmentsService.getAppointmentType(body.typeId, userSettings.userId);
      if (!type || !type.isActive) {
        throw new Error('Appointment type not found');
      }

      // Verify slot is still available
      const slots = await appointmentsService.getAvailableSlots(type.id, body.date);
      const slotAvailable = slots.some(s => s.start === body.startTime);
      if (!slotAvailable) {
        throw new Error('Selected time slot is no longer available');
      }

      // Create booking
      const booking = await appointmentsService.createBooking({
        appointmentTypeId: type.id,
        hostUserId: userSettings.userId,
        inviteeName: body.inviteeName,
        inviteeEmail: body.inviteeEmail,
        inviteePhone: body.inviteePhone,
        inviteeTimezone: body.inviteeTimezone,
        scheduledDate: body.date,
        startTime: body.startTime,
        notes: body.notes,
        customFieldResponses: body.customFieldResponses,
      });

      // TODO: Send confirmation email

      return {
        id: booking.id,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        locationType: booking.locationType,
        locationDetails: booking.locationDetails,
      };
    },
    {
      body: t.Object({
        typeId: t.String(),
        date: t.String(),
        startTime: t.String(),
        inviteeName: t.String(),
        inviteeEmail: t.String(),
        inviteePhone: t.Optional(t.String()),
        inviteeTimezone: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        customFieldResponses: t.Optional(t.Record(t.String(), t.String())),
      }),
    }
  )

  /**
   * Cancel a booking (by invitee using booking ID)
   * POST /api/v1/ibird/public/bookings/:id/cancel
   */
  .post(
    '/bookings/:id/cancel',
    async ({ params, body }) => {
      const booking = await appointmentsService.cancelBooking(params.id, 'invitee', body.reason);
      if (!booking) {
        throw new Error('Booking not found or already cancelled');
      }

      return { success: true };
    },
    {
      body: t.Object({
        reason: t.Optional(t.String()),
      }),
    }
  );
