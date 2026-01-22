/**
 * useServiceHealth Hook
 * 
 * Polls service health endpoints and returns real-time status.
 * Supports auto-recovery when services fail.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ServiceHealthStatus {
    id: string;
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown' | 'checking' | 'recovering';
    lastChecked: number | null;
    responseTime?: number;
    error?: string;
    details?: Record<string, unknown>;
    recoveryAttempted?: boolean;
}

export interface UseServiceHealthOptions {
    pollInterval?: number; // ms, default 30000
    enabled?: boolean;
    autoRecover?: boolean; // Enable auto-recovery (default: true)
}

const HEALTH_ENDPOINTS: Record<string, string> = {
    'liquid-runtime': 'http://localhost:3000/health/runtime',
    'backend': 'http://localhost:3000/health',
    'postgres': 'http://localhost:3000/health/postgres',
    'redis': 'http://localhost:3000/health/redis',
};

const RECOVERY_ENDPOINT = 'http://localhost:3000/api/trpc/health.recover';

async function checkHealth(url: string): Promise<{ healthy: boolean; responseTime: number; details?: Record<string, unknown>; error?: string }> {
    const startTime = performance.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Math.round(performance.now() - startTime);

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return { healthy: true, responseTime, details: data };
        }
        return { healthy: false, responseTime, error: `HTTP ${response.status}` };
    } catch (error) {
        const responseTime = Math.round(performance.now() - startTime);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { healthy: false, responseTime, error: message };
    }
}

async function attemptRecovery(serviceId: string): Promise<boolean> {
    try {
        const response = await fetch(RECOVERY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { serviceId } }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.result?.data?.json?.success ?? false;
        }
        return false;
    } catch {
        return false;
    }
}

export function useServiceHealth(options: UseServiceHealthOptions = {}): {
    services: Record<string, ServiceHealthStatus>;
    isAnyUnhealthy: boolean;
    unhealthyServices: string[];
    refresh: () => void;
    recoverService: (serviceId: string) => Promise<boolean>;
} {
    const { pollInterval = 30000, enabled = true, autoRecover = true } = options;
    const [services, setServices] = useState<Record<string, ServiceHealthStatus>>(() => {
        const initial: Record<string, ServiceHealthStatus> = {};
        for (const [id, _url] of Object.entries(HEALTH_ENDPOINTS)) {
            initial[id] = {
                id,
                name: id,
                status: 'unknown',
                lastChecked: null,
            };
        }
        return initial;
    });

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const recoverServiceById = useCallback(async (serviceId: string): Promise<boolean> => {
        // Mark as recovering
        setServices(prev => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], status: 'recovering' },
        }));

        const success = await attemptRecovery(serviceId);

        // Update status after recovery attempt
        setServices(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                status: success ? 'checking' : 'unhealthy',
                recoveryAttempted: true,
            },
        }));

        return success;
    }, []);

    const checkAllServices = useCallback(async () => {
        const checks = Object.entries(HEALTH_ENDPOINTS).map(async ([id, url]) => {
            setServices(prev => ({
                ...prev,
                [id]: { ...prev[id], status: 'checking' },
            }));

            const result = await checkHealth(url);

            const isUnhealthy = !result.healthy;
            let status: ServiceHealthStatus['status'] = result.healthy ? 'healthy' : 'unhealthy';

            // Auto-recover if enabled and service is unhealthy
            if (autoRecover && isUnhealthy && (id === 'liquid-runtime' || id === 'docker')) {
                await recoverServiceById(id);
                // Re-check after recovery
                const recheckResult = await checkHealth(url);
                status = recheckResult.healthy ? 'healthy' : 'unhealthy';
            }

            return {
                id,
                status,
                lastChecked: Date.now(),
                responseTime: result.responseTime,
                error: result.error,
                details: result.details,
            };
        });

        const results = await Promise.all(checks);

        setServices(prev => {
            const updated = { ...prev };
            for (const result of results) {
                updated[result.id] = {
                    ...updated[result.id],
                    ...result,
                };
            }
            return updated;
        });
    }, [autoRecover, recoverServiceById]);

    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkAllServices();

        // Set up polling
        intervalRef.current = setInterval(checkAllServices, pollInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, pollInterval, checkAllServices]);

    const unhealthyServices = Object.values(services)
        .filter(s => s.status === 'unhealthy')
        .map(s => s.id);

    return {
        services,
        isAnyUnhealthy: unhealthyServices.length > 0,
        unhealthyServices,
        refresh: checkAllServices,
        recoverService: recoverServiceById,
    };
}

export default useServiceHealth;
