/**
 * Container Lifecycle Manager
 *
 * Manages Docker container lifecycle for the Cowork sandbox system.
 * Handles:
 * - Docker daemon availability detection
 * - Container pool initialization
 * - Graceful fallback when Docker is unavailable
 *
 * @example
 * ```typescript
 * import { ensureContainersReady, isDockerAvailable } from './lifecycle.js';
 *
 * // On server startup
 * await ensureContainersReady();
 *
 * // Check availability
 * if (isDockerAvailable()) {
 *     // Use containers
 * } else {
 *     // Fallback to host sandbox
 * }
 * ```
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { componentLoggers } from '../logger.js';

const execAsync = promisify(exec);
const log = componentLoggers.http.child({ component: 'container-lifecycle' });

// ============================================================================
// State
// ============================================================================

let dockerAvailable = false;
let containerPoolReady = false;
let initializationError: Error | null = null;
let healthMonitorInterval: NodeJS.Timeout | null = null;
let lastRecoveryAttempt: Record<string, number> = {};
const RECOVERY_COOLDOWN_MS = 30000; // 30 seconds between recovery attempts

// ============================================================================
// Health Check & Auto-Recovery
// ============================================================================

export interface ServiceHealthStatus {
    id: string;
    healthy: boolean;
    lastChecked: number;
    error?: string;
    recoveryInProgress?: boolean;
    lastRecoveryAttempt?: number;
}

export interface HealthMonitorConfig {
    /** Interval between health checks in ms (default: 30000) */
    interval?: number;
    /** Enable auto-recovery when services fail (default: true) */
    autoRecover?: boolean;
    /** Callback when recovery starts */
    onRecoveryStart?: (serviceId: string) => void;
    /** Callback when recovery completes */
    onRecoveryComplete?: (serviceId: string, success: boolean) => void;
}

let healthMonitorConfig: HealthMonitorConfig = {
    interval: 30000,
    autoRecover: true,
};

/**
 * Check health of the liquid-runtime service
 */
async function checkRuntimeHealth(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('http://localhost:8081/health', {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return {
                id: 'liquid-runtime',
                healthy: true,
                lastChecked: startTime,
            };
        }
        return {
            id: 'liquid-runtime',
            healthy: false,
            lastChecked: startTime,
            error: `HTTP ${response.status}`,
        };
    } catch (error: any) {
        return {
            id: 'liquid-runtime',
            healthy: false,
            lastChecked: startTime,
            error: error.message,
        };
    }
}

/**
 * Attempt to recover a service
 */
export async function recoverService(serviceId: string): Promise<boolean> {
    const now = Date.now();
    const lastAttempt = lastRecoveryAttempt[serviceId] || 0;

    // Enforce cooldown
    if (now - lastAttempt < RECOVERY_COOLDOWN_MS) {
        log.info({ serviceId, cooldownRemaining: RECOVERY_COOLDOWN_MS - (now - lastAttempt) },
            'Service recovery skipped - cooldown active');
        return false;
    }

    lastRecoveryAttempt[serviceId] = now;

    log.info({ serviceId }, 'Attempting service recovery');
    healthMonitorConfig.onRecoveryStart?.(serviceId);

    try {
        if (serviceId === 'liquid-runtime') {
            // Try to start containers
            const started = await startContainers();
            if (started) {
                containerPoolReady = true;
                log.info({ serviceId }, 'Service recovered successfully');
                healthMonitorConfig.onRecoveryComplete?.(serviceId, true);
                return true;
            }
        } else if (serviceId === 'docker') {
            // Check if Docker is available again
            dockerAvailable = await checkDockerDaemon();
            if (dockerAvailable) {
                await startContainers();
                log.info({ serviceId }, 'Docker recovered');
                healthMonitorConfig.onRecoveryComplete?.(serviceId, true);
                return true;
            }
        }

        log.warn({ serviceId }, 'Service recovery failed');
        healthMonitorConfig.onRecoveryComplete?.(serviceId, false);
        return false;
    } catch (error: any) {
        log.error({ serviceId, error: error.message }, 'Service recovery error');
        healthMonitorConfig.onRecoveryComplete?.(serviceId, false);
        return false;
    }
}

/**
 * Auto-recover unhealthy services
 */
async function autoRecoverServices(): Promise<void> {
    if (!healthMonitorConfig.autoRecover) return;

    // Check liquid-runtime health
    const runtimeHealth = await checkRuntimeHealth();

    if (!runtimeHealth.healthy) {
        log.warn({ error: runtimeHealth.error }, 'Container runtime unhealthy, attempting recovery');
        await recoverService('liquid-runtime');
    }

    // Check Docker if it was previously unavailable
    if (!dockerAvailable) {
        log.info('Docker unavailable, checking again...');
        await recoverService('docker');
    }
}

/**
 * Start the health monitor for auto-recovery
 */
export function startHealthMonitor(config?: HealthMonitorConfig): void {
    if (healthMonitorInterval) {
        log.warn('Health monitor already running');
        return;
    }

    healthMonitorConfig = { ...healthMonitorConfig, ...config };
    const interval = healthMonitorConfig.interval || 30000;

    log.info({ interval, autoRecover: healthMonitorConfig.autoRecover }, 'Starting health monitor');

    healthMonitorInterval = setInterval(autoRecoverServices, interval);

    // Run immediately on start
    autoRecoverServices().catch(err => {
        log.error({ error: err.message }, 'Initial health check failed');
    });
}

/**
 * Stop the health monitor
 */
export function stopHealthMonitor(): void {
    if (healthMonitorInterval) {
        clearInterval(healthMonitorInterval);
        healthMonitorInterval = null;
        log.info('Health monitor stopped');
    }
}

/**
 * Get health status of all monitored services
 */
export async function getServicesHealth(): Promise<Record<string, ServiceHealthStatus>> {
    const services: Record<string, ServiceHealthStatus> = {};

    // Docker daemon
    const dockerHealthy = await checkDockerDaemon();
    services['docker'] = {
        id: 'docker',
        healthy: dockerHealthy,
        lastChecked: Date.now(),
        lastRecoveryAttempt: lastRecoveryAttempt['docker'],
    };

    // Container runtime
    services['liquid-runtime'] = await checkRuntimeHealth();
    services['liquid-runtime'].lastRecoveryAttempt = lastRecoveryAttempt['liquid-runtime'];

    return services;
}

// ============================================================================
// Docker Detection
// ============================================================================

/**
 * Check if Docker daemon is running and accessible
 */
async function checkDockerDaemon(): Promise<boolean> {
    try {
        const { stdout } = await execAsync('docker info --format "{{.ServerVersion}}"', {
            timeout: 5000,
        });
        const version = stdout.trim();
        log.info({ version }, 'Docker daemon detected');
        return true;
    } catch (error: any) {
        log.warn({ error: error.message }, 'Docker daemon not available');
        return false;
    }
}

/**
 * Check if the liquid-container image exists
 */
async function checkContainerImage(): Promise<boolean> {
    try {
        const { stdout } = await execAsync(
            'docker images liquid-container --format "{{.Repository}}:{{.Tag}}"',
            { timeout: 5000 }
        );
        const images = stdout.trim().split('\n').filter(Boolean);
        if (images.length > 0) {
            log.info({ images }, 'Container image found');
            return true;
        }
        log.warn('Container image not found, will need to build');
        return false;
    } catch (error: any) {
        log.warn({ error: error.message }, 'Failed to check container image');
        return false;
    }
}

/**
 * Attempt to start containers via docker-compose
 */
async function startContainers(): Promise<boolean> {
    try {
        log.info('Starting containers via docker-compose...');

        // Start only the liquid-runtime service (if defined)
        const { stdout, stderr } = await execAsync(
            'docker compose up -d liquid-runtime 2>&1 || docker compose up -d 2>&1',
            {
                timeout: 60000, // 60 second timeout for container startup
                cwd: process.cwd(),
            }
        );

        if (stderr && !stderr.includes('Started') && !stderr.includes('Running')) {
            log.warn({ stderr }, 'docker-compose warning');
        }

        log.info({ stdout: stdout.trim() }, 'Containers started');
        return true;
    } catch (error: any) {
        // Not fatal - liquid-runtime might not be defined yet
        log.info({ error: error.message }, 'Could not start liquid-runtime (may not be configured yet)');
        return false;
    }
}

/**
 * Build the container image if needed
 */
async function buildContainerImage(): Promise<boolean> {
    try {
        log.info('Building container image...');

        const { stdout: _stdout } = await execAsync(
            'docker build -t liquid-container:latest ./server/container',
            {
                timeout: 300000, // 5 minute timeout for build
                cwd: process.cwd(),
            }
        );

        log.info('Container image built successfully');
        return true;
    } catch (error: any) {
        log.error({ error: error.message }, 'Failed to build container image');
        return false;
    }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize the container system
 * Call this during server startup
 *
 * @returns Promise that resolves when containers are ready (or fallback mode is active)
 */
export async function ensureContainersReady(): Promise<void> {
    log.info('Initializing container lifecycle...');

    try {
        // Step 1: Check Docker availability
        dockerAvailable = await checkDockerDaemon();

        if (!dockerAvailable) {
            log.warn('Docker not available - running in host sandbox mode (less secure)');
            return;
        }

        // Step 2: Check if image exists
        const imageExists = await checkContainerImage();

        if (!imageExists) {
            log.info('Container image not found, attempting to build...');
            const built = await buildContainerImage();
            if (!built) {
                log.warn('Could not build container image - running in host sandbox mode');
                dockerAvailable = false;
                return;
            }
        }

        // Step 3: Start containers
        const containersStarted = await startContainers();

        if (containersStarted) {
            containerPoolReady = true;
            log.info('Container pool ready');
        } else {
            log.info('Container pool not configured - will create containers on-demand');
            containerPoolReady = false;
        }
    } catch (error: any) {
        initializationError = error;
        log.error({ error: error.message }, 'Container initialization failed');
        dockerAvailable = false;
    }
}

/**
 * Check if Docker is available for container execution
 */
export function isDockerAvailable(): boolean {
    return dockerAvailable;
}

/**
 * Check if the container pool is ready with pre-warmed containers
 */
export function isContainerPoolReady(): boolean {
    return containerPoolReady;
}

/**
 * Get the initialization error if any
 */
export function getInitializationError(): Error | null {
    return initializationError;
}

/**
 * Get container system status for health checks
 */
export function getContainerStatus(): {
    dockerAvailable: boolean;
    poolReady: boolean;
    mode: 'container' | 'host-sandbox';
    error?: string;
} {
    return {
        dockerAvailable,
        poolReady: containerPoolReady,
        mode: dockerAvailable ? 'container' : 'host-sandbox',
        error: initializationError?.message,
    };
}

/**
 * Gracefully shutdown containers
 */
export async function shutdownContainers(): Promise<void> {
    if (!dockerAvailable) return;

    try {
        log.info('Shutting down containers...');
        await execAsync('docker compose down', {
            timeout: 30000,
            cwd: process.cwd(),
        });
        log.info('Containers shut down');
    } catch (error: any) {
        log.warn({ error: error.message }, 'Error during container shutdown');
    }
}

// Export for testing
export const _internal = {
    checkDockerDaemon,
    checkContainerImage,
    startContainers,
    buildContainerImage,
};
