/**
 * iBird Appointments Routes
 * Appointment types, availability, and bookings
 */

import { Elysia, t } from 'elysia';
import { appointmentsService } from '../../services/ibird/index.js';

// Temporary: Get user ID from header
const getUserId = (headers: Record<string, string | undefined>): string => {
  const userId = headers['x-user-id'];
  if (!userId) throw new Error('User ID required');
  return userId;
};

export const appointmentsRoutes = new Elysia({ prefix: '/appointments' })
  // ==========================================================================
  // APPOINTMENT TYPES
  // ==========================================================================

  /**
   * List appointment types
   * GET /api/v1/ibird/appointments/types
   */
  .get('/types', async ({ headers }) => {
    const userId = getUserId(headers);
    return await appointmentsService.listAppointmentTypes(userId);
  })

  /**
   * Get a single appointment type
   * GET /api/v1/ibird/appointments/types/:id
   */
  .get('/types/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const type = await appointmentsService.getAppointmentType(params.id, userId);
    if (!type) throw new Error('Appointment type not found');
    return type;
  })

  /**
   * Create an appointment type
   * POST /api/v1/ibird/appointments/types
   */
  .post(
    '/types',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await appointmentsService.createAppointmentType(userId, body);
    },
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        description: t.Optional(t.String()),
        durationMinutes: t.Optional(t.Number()),
        bufferBeforeMinutes: t.Optional(t.Number()),
        bufferAfterMinutes: t.Optional(t.Number()),
        locationType: t.Optional(t.Union([
          t.Literal('in_person'),
          t.Literal('phone'),
          t.Literal('video'),
          t.Literal('custom'),
        ])),
        locationAddress: t.Optional(t.String()),
        videoProvider: t.Optional(t.Union([
          t.Literal('zoom'),
          t.Literal('google_meet'),
          t.Literal('teams'),
          t.Literal('custom'),
        ])),
        videoLink: t.Optional(t.String()),
        minNoticeMinutes: t.Optional(t.Number()),
        maxBookingDays: t.Optional(t.Number()),
        maxBookingsPerDay: t.Optional(t.Number()),
        color: t.Optional(t.String()),
        customFields: t.Optional(
          t.Array(
            t.Object({
              name: t.String(),
              label: t.String(),
              type: t.Union([
                t.Literal('text'),
                t.Literal('email'),
                t.Literal('phone'),
                t.Literal('textarea'),
                t.Literal('select'),
              ]),
              required: t.Boolean(),
              options: t.Optional(t.Array(t.String())),
            })
          )
        ),
        availabilityScheduleId: t.Optional(t.String()),
        calendarId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update an appointment type
   * PUT /api/v1/ibird/appointments/types/:id
   */
  .put(
    '/types/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const type = await appointmentsService.updateAppointmentType(params.id, userId, body);
      if (!type) throw new Error('Appointment type not found');
      return type;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        durationMinutes: t.Optional(t.Number()),
        bufferBeforeMinutes: t.Optional(t.Number()),
        bufferAfterMinutes: t.Optional(t.Number()),
        locationType: t.Optional(t.Union([
          t.Literal('in_person'),
          t.Literal('phone'),
          t.Literal('video'),
          t.Literal('custom'),
        ])),
        locationAddress: t.Optional(t.String()),
        videoProvider: t.Optional(t.Union([
          t.Literal('zoom'),
          t.Literal('google_meet'),
          t.Literal('teams'),
          t.Literal('custom'),
        ])),
        videoLink: t.Optional(t.String()),
        minNoticeMinutes: t.Optional(t.Number()),
        maxBookingDays: t.Optional(t.Number()),
        maxBookingsPerDay: t.Optional(t.Number()),
        color: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        customFields: t.Optional(
          t.Array(
            t.Object({
              name: t.String(),
              label: t.String(),
              type: t.Union([
                t.Literal('text'),
                t.Literal('email'),
                t.Literal('phone'),
                t.Literal('textarea'),
                t.Literal('select'),
              ]),
              required: t.Boolean(),
              options: t.Optional(t.Array(t.String())),
            })
          )
        ),
        availabilityScheduleId: t.Optional(t.String()),
        calendarId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete an appointment type
   * DELETE /api/v1/ibird/appointments/types/:id
   */
  .delete('/types/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await appointmentsService.deleteAppointmentType(params.id, userId);
    if (!deleted) throw new Error('Appointment type not found');
    return { success: true };
  })

  // ==========================================================================
  // AVAILABILITY SCHEDULES
  // ==========================================================================

  /**
   * List availability schedules
   * GET /api/v1/ibird/appointments/availability/schedules
   */
  .get('/availability/schedules', async ({ headers }) => {
    const userId = getUserId(headers);
    return await appointmentsService.listAvailabilitySchedules(userId);
  })

  /**
   * Get a single schedule
   * GET /api/v1/ibird/appointments/availability/schedules/:id
   */
  .get('/availability/schedules/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const schedule = await appointmentsService.getSchedule(params.id, userId);
    if (!schedule) throw new Error('Schedule not found');
    return schedule;
  })

  /**
   * Create an availability schedule
   * POST /api/v1/ibird/appointments/availability/schedules
   */
  .post(
    '/availability/schedules',
    async ({ headers, body }) => {
      const userId = getUserId(headers);
      return await appointmentsService.createSchedule(userId, body);
    },
    {
      body: t.Object({
        name: t.String(),
        timezone: t.String(),
        weeklyHours: t.Object({
          sunday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          monday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          tuesday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          wednesday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          thursday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          friday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          saturday: t.Array(t.Object({ start: t.String(), end: t.String() })),
        }),
        isDefault: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Update an availability schedule
   * PUT /api/v1/ibird/appointments/availability/schedules/:id
   */
  .put(
    '/availability/schedules/:id',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const schedule = await appointmentsService.updateSchedule(params.id, userId, body);
      if (!schedule) throw new Error('Schedule not found');
      return schedule;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        weeklyHours: t.Optional(
          t.Object({
            sunday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            monday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            tuesday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            wednesday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            thursday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            friday: t.Array(t.Object({ start: t.String(), end: t.String() })),
            saturday: t.Array(t.Object({ start: t.String(), end: t.String() })),
          })
        ),
        isDefault: t.Optional(t.Boolean()),
      }),
    }
  )

  /**
   * Delete an availability schedule
   * DELETE /api/v1/ibird/appointments/availability/schedules/:id
   */
  .delete('/availability/schedules/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const deleted = await appointmentsService.deleteSchedule(params.id, userId);
    if (!deleted) throw new Error('Schedule not found');
    return { success: true };
  })

  // ==========================================================================
  // AVAILABILITY OVERRIDES
  // ==========================================================================

  /**
   * List overrides for a schedule
   * GET /api/v1/ibird/appointments/availability/schedules/:id/overrides
   */
  .get('/availability/schedules/:id/overrides', async ({ params, query }) => {
    if (!query.startDate || !query.endDate) {
      throw new Error('startDate and endDate required');
    }
    return await appointmentsService.listOverrides(params.id, query.startDate, query.endDate);
  })

  /**
   * Set an override
   * POST /api/v1/ibird/appointments/availability/schedules/:id/overrides
   */
  .post(
    '/availability/schedules/:id/overrides',
    async ({ params, body }) => {
      return await appointmentsService.setOverride(params.id, body);
    },
    {
      body: t.Object({
        date: t.String(),
        isAvailable: t.Boolean(),
        slots: t.Optional(t.Array(t.Object({ start: t.String(), end: t.String() }))),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete an override
   * DELETE /api/v1/ibird/appointments/availability/schedules/:id/overrides/:date
   */
  .delete('/availability/schedules/:id/overrides/:date', async ({ params }) => {
    const deleted = await appointmentsService.deleteOverride(params.id, params.date);
    if (!deleted) throw new Error('Override not found');
    return { success: true };
  })

  // ==========================================================================
  // BOOKINGS
  // ==========================================================================

  /**
   * List bookings
   * GET /api/v1/ibird/appointments/bookings
   */
  .get('/bookings', async ({ headers, query }) => {
    const userId = getUserId(headers);

    return await appointmentsService.listBookings(userId, {
      status: query.status?.split(','),
      typeId: query.typeId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  })

  /**
   * Get a single booking
   * GET /api/v1/ibird/appointments/bookings/:id
   */
  .get('/bookings/:id', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const booking = await appointmentsService.getBooking(params.id, userId);
    if (!booking) throw new Error('Booking not found');
    return booking;
  })

  /**
   * Confirm a booking
   * POST /api/v1/ibird/appointments/bookings/:id/confirm
   */
  .post('/bookings/:id/confirm', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const booking = await appointmentsService.confirmBooking(params.id, userId);
    if (!booking) throw new Error('Booking not found or already confirmed');
    return booking;
  })

  /**
   * Cancel a booking
   * POST /api/v1/ibird/appointments/bookings/:id/cancel
   */
  .post(
    '/bookings/:id/cancel',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const booking = await appointmentsService.cancelBooking(params.id, 'host', body.reason, userId);
      if (!booking) throw new Error('Booking not found');
      return booking;
    },
    {
      body: t.Object({
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Reschedule a booking
   * POST /api/v1/ibird/appointments/bookings/:id/reschedule
   */
  .post(
    '/bookings/:id/reschedule',
    async ({ headers, params, body }) => {
      const userId = getUserId(headers);
      const booking = await appointmentsService.rescheduleBooking(params.id, userId, body.date, body.startTime);
      if (!booking) throw new Error('Booking not found');
      return booking;
    },
    {
      body: t.Object({
        date: t.String(),
        startTime: t.String(),
      }),
    }
  )

  /**
   * Mark booking as completed
   * POST /api/v1/ibird/appointments/bookings/:id/complete
   */
  .post('/bookings/:id/complete', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const booking = await appointmentsService.completeBooking(params.id, userId);
    if (!booking) throw new Error('Booking not found');
    return booking;
  })

  /**
   * Mark booking as no-show
   * POST /api/v1/ibird/appointments/bookings/:id/no-show
   */
  .post('/bookings/:id/no-show', async ({ headers, params }) => {
    const userId = getUserId(headers);
    const booking = await appointmentsService.markNoShow(params.id, userId);
    if (!booking) throw new Error('Booking not found');
    return booking;
  });
