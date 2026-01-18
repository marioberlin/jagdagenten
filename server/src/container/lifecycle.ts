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

        const { stdout } = await execAsync(
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
