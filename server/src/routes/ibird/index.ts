/**
 * iBird Routes Index
 * Main entry point for all iBird API routes
 */

import { Elysia } from 'elysia';
import { settingsRoutes } from './settings.js';
import { mailRoutes } from './mail.js';
import { calendarRoutes } from './calendar.js';
import { appointmentsRoutes } from './appointments.js';
import { publicRoutes } from './public.js';

export const ibirdRoutes = new Elysia({ prefix: '/api/v1/ibird' })
  .use(settingsRoutes)
  .use(mailRoutes)
  .use(calendarRoutes)
  .use(appointmentsRoutes)
  .use(publicRoutes);
