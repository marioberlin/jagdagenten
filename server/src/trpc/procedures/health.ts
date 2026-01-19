/**
 * Health Procedures
 * 
 * Type-safe API for health checks and system status.
 */

import { z } from 'zod';
import { router, publicProcedure } from '../index.js';
import {
    getContainerStatus,
    isDockerAvailable,
    getServicesHealth,
    recoverService,
} from '../../container/lifecycle.js';

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
     * Readiness probe for k8s with auto-recovery support
     * 
     * @example
     * const ready = await trpc.health.ready.query();
     */
    ready: publicProcedure
        .input(z.object({
            autoRecover: z.boolean().optional().default(true),
        }).optional())
        .query(async ({ input }) => {
            const autoRecover = input?.autoRecover ?? true;

            // Get actual container/service health
            const containerStatus = getContainerStatus();
            const servicesHealth = await getServicesHealth();

            // Check database (placeholder for now)
            const databaseHealthy = true; // TODO: actual DB check

            // Determine service status
            const runtimeHealthy = servicesHealth['liquid-runtime']?.healthy ?? false;
            const dockerHealthy = isDockerAvailable();

            // Build checks map
            const checks = {
                database: databaseHealthy,
                cache: true, // TODO: actual cache check
                docker: dockerHealthy,
                containerRuntime: runtimeHealthy,
            };

            const allHealthy = Object.values(checks).every(v => v);
            let autoRecoveryTriggered = false;

            // Auto-recover if enabled and services are down
            if (autoRecover && !allHealthy) {
                if (!runtimeHealthy) {
                    await recoverService('liquid-runtime');
                    autoRecoveryTriggered = true;
                }
                if (!dockerHealthy) {
                    await recoverService('docker');
                    autoRecoveryTriggered = true;
                }
            }

            return {
                ready: allHealthy,
                checks,
                container: {
                    mode: containerStatus.mode,
                    dockerAvailable: containerStatus.dockerAvailable,
                    poolReady: containerStatus.poolReady,
                },
                autoRecoveryTriggered,
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

    /**
     * Trigger service recovery
     * 
     * @example
     * const result = await trpc.health.recover.mutate({ serviceId: 'liquid-runtime' });
     */
    recover: publicProcedure
        .input(z.object({
            serviceId: z.enum(['liquid-runtime', 'docker']),
        }))
        .mutation(async ({ input }) => {
            const success = await recoverService(input.serviceId);
            return {
                serviceId: input.serviceId,
                success,
                timestamp: new Date().toISOString(),
            };
        }),

    /**
     * Get detailed services health
     * 
     * @example
     * const services = await trpc.health.services.query();
     */
    services: publicProcedure
        .query(async () => {
            const services = await getServicesHealth();
            return {
                services,
                timestamp: new Date().toISOString(),
            };
        }),
});

export type HealthRouter = typeof healthRouter;
