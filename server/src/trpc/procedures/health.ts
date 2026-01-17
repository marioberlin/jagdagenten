/**
 * Health Procedures
 * 
 * Type-safe API for health checks and system status.
 */

import { z } from 'zod';
import { router, publicProcedure } from '../index.js';

export const healthRouter = router({
    /**
     * Basic health check
     * 
     * @example
     * const health = await trpc.health.check.query();
     */
    check: publicProcedure
        .query(async ({ ctx }) => {
            return {
                status: 'healthy' as const,
                timestamp: new Date().toISOString(),
                requestId: ctx.requestId,
            };
        }),

    /**
     * Detailed system status
     * 
     * @example
     * const status = await trpc.health.status.query();
     */
    status: publicProcedure
        .query(async ({ ctx }) => {
            const memoryUsage = process.memoryUsage();

            return {
                status: 'healthy' as const,
                version: process.env.npm_package_version || '0.1.0',
                uptime: Math.floor(process.uptime()),
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                    unit: 'MB' as const,
                },
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                requestId: ctx.requestId,
            };
        }),

    /**
     * Readiness probe for k8s
     * 
     * @example
     * const ready = await trpc.health.ready.query();
     */
    ready: publicProcedure
        .query(async () => {
            // Add checks for dependencies here (DB, Redis, etc.)
            const checks = {
                database: true, // TODO: actual DB check
                cache: true,    // TODO: actual cache check
            };

            const allHealthy = Object.values(checks).every(v => v);

            return {
                ready: allHealthy,
                checks,
                timestamp: new Date().toISOString(),
            };
        }),

    /**
     * Liveness probe for k8s
     * 
     * @example
     * const alive = await trpc.health.live.query();
     */
    live: publicProcedure
        .query(async () => {
            return {
                alive: true,
                timestamp: new Date().toISOString(),
            };
        }),
});

export type HealthRouter = typeof healthRouter;
