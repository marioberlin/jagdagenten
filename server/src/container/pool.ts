/**
 * Container Pool Manager
 *
 * Manages a pool of pre-warmed containers for fast agent execution.
 * Handles container lifecycle, health monitoring, and automatic replenishment.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 3
 */

import Dockerode from 'dockerode';
import { EventEmitter } from 'events';
import type {
    PoolConfig,
    PooledContainer,
    AcquireOptions,
    ReleaseOptions,
    PoolEventHandler,
    PoolStatus,
    InitRequest,
    ExecuteRequest,
    ExecuteResponse,
} from './types.js';
import { PoolExhaustedError, ContainerTimeoutError } from './types.js';
import { ContainerScheduler } from './scheduler.js';
import { ContainerClient, createContainerClient } from './client.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http.child({ component: 'container-pool' });

// ============================================================================
// Container Pool
// ============================================================================

export class ContainerPool extends EventEmitter {
    private config: PoolConfig;
    private scheduler: ContainerScheduler;
    private idle: Map<string, PooledContainer> = new Map();
    private acquired: Map<string, PooledContainer> = new Map();
    private clients: Map<string, ContainerClient> = new Map();
    private replenishing = false;
    private healthCheckTimer?: ReturnType<typeof setInterval>;
    private idleCleanupTimer?: ReturnType<typeof setInterval>;
    private initialized = false;

    constructor(config: PoolConfig) {
        super();
        this.config = config;
        this.scheduler = new ContainerScheduler(config.placement);
    }

    /**
     * Initialize the pool and start background processes
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        log.info({
            minIdle: this.config.minIdle,
            maxTotal: this.config.maxTotal,
            image: this.config.image,
        }, 'Initializing container pool');

        // Start health check timer
        this.healthCheckTimer = setInterval(
            () => this.runHealthChecks(),
            this.config.healthCheckInterval
        );

        // Start idle cleanup timer
        this.idleCleanupTimer = setInterval(
            () => this.cleanupIdleContainers(),
            60000 // Check every minute
        );

        // Pre-warm the pool
        await this.replenish();

        this.initialized = true;
        log.info({ idle: this.idle.size }, 'Container pool initialized');
    }

    /**
     * Shutdown the pool and cleanup all containers
     */
    async shutdown(): Promise<void> {
        log.info('Shutting down container pool');

        // Stop timers
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        if (this.idleCleanupTimer) {
            clearInterval(this.idleCleanupTimer);
        }

        // Destroy all containers
        const allContainers = [...this.idle.values(), ...this.acquired.values()];

        await Promise.allSettled(
            allContainers.map(container => this.destroyContainer(container, 'shutdown'))
        );

        this.idle.clear();
        this.acquired.clear();
        this.clients.clear();
        this.initialized = false;

        log.info('Container pool shutdown complete');
    }

    /**
     * Acquire a container from the pool
     */
    async acquire(options: AcquireOptions = {}): Promise<PooledContainer> {
        const startTime = Date.now();
        const timeout = options.timeout ?? this.config.acquireTimeout;

        // Try to get from idle pool first
        const idle = this.getIdleContainer(options.affinity);
        if (idle) {
            this.idle.delete(idle.id);
            this.acquired.set(idle.id, idle);
            idle.state = 'ready';
            idle.acquiredAt = Date.now();
            idle.agentId = options.agentId;

            this.scheduler.recordAcquire(idle.endpointId);
            this.emit('container_acquired', {
                containerId: idle.id,
                fromPool: true,
                agentId: options.agentId,
            });

            log.debug({
                containerId: idle.shortId,
                fromPool: true,
                latency: Date.now() - startTime,
            }, 'Container acquired');

            // Trigger background replenishment
            this.maybeReplenish();

            return idle;
        }

        // Check if we can create new
        const total = this.idle.size + this.acquired.size;
        if (total >= this.config.maxTotal) {
            this.emit('pool_exhausted', { waiting: 1 });
            throw new PoolExhaustedError(
                `Pool exhausted: ${total}/${this.config.maxTotal} containers`
            );
        }

        // Create new container
        try {
            const container = await this.createContainer(options.affinity, timeout);
            this.acquired.set(container.id, container);
            container.acquiredAt = Date.now();
            container.agentId = options.agentId;

            this.scheduler.recordAcquire(container.endpointId);
            this.emit('container_acquired', {
                containerId: container.id,
                fromPool: false,
                agentId: options.agentId,
            });

            log.info({
                containerId: container.shortId,
                fromPool: false,
                latency: Date.now() - startTime,
            }, 'Container acquired (new)');

            // Trigger background replenishment
            this.maybeReplenish();

            return container;
        } catch (error) {
            log.error({ error: (error as Error).message }, 'Failed to create container');
            throw error;
        }
    }

    /**
     * Release a container back to the pool
     */
    async release(containerId: string, options: ReleaseOptions = {}): Promise<void> {
        const container = this.acquired.get(containerId);
        if (!container) {
            log.warn({ containerId }, 'Attempted to release unknown container');
            return;
        }

        this.acquired.delete(containerId);
        this.scheduler.recordRelease(container.endpointId);

        // Destroy if requested or unhealthy
        if (options.destroy || container.state === 'error' || container.healthFailures > 2) {
            await this.destroyContainer(container, options.reason ?? 'unhealthy');
            this.emit('container_released', { containerId, recycled: false });
            return;
        }

        // Reset container state
        try {
            const client = this.clients.get(containerId);
            if (client) {
                await client.reset();
            }

            container.state = 'idle';
            container.acquiredAt = undefined;
            container.agentId = undefined;
            container.idleSince = Date.now();

            this.idle.set(containerId, container);
            this.emit('container_released', { containerId, recycled: true });

            log.debug({ containerId: container.shortId }, 'Container released and recycled');
        } catch (error) {
            log.warn({
                containerId: container.shortId,
                error: (error as Error).message,
            }, 'Failed to reset container, destroying');

            await this.destroyContainer(container, 'reset_failed');
            this.emit('container_released', { containerId, recycled: false });
        }
    }

    /**
     * Initialize a container for an agent
     */
    async initContainer(containerId: string, request: InitRequest): Promise<void> {
        const container = this.acquired.get(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not acquired`);
        }

        const client = this.clients.get(containerId);
        if (!client) {
            throw new Error(`No client for container ${containerId}`);
        }

        container.state = 'initializing';

        try {
            const result = await client.init(request);
            if (result.error) {
                throw new Error(result.error);
            }
            container.state = 'ready';
            container.agentId = request.agentId;
        } catch (error) {
            container.state = 'error';
            throw error;
        }
    }

    /**
     * Execute a command in a container
     */
    async executeInContainer(
        containerId: string,
        request: ExecuteRequest
    ): Promise<ExecuteResponse> {
        const container = this.acquired.get(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not acquired`);
        }

        const client = this.clients.get(containerId);
        if (!client) {
            throw new Error(`No client for container ${containerId}`);
        }

        container.state = 'executing';

        try {
            const result = await client.execute(request);
            container.state = 'ready';
            return result;
        } catch (error) {
            container.state = 'error';
            throw error;
        }
    }

    /**
     * Get a client for a container
     */
    getClient(containerId: string): ContainerClient | undefined {
        return this.clients.get(containerId);
    }

    /**
     * Get pool status
     */
    getStatus(): PoolStatus {
        const byEndpoint: Record<string, { idle: number; acquired: number }> = {};

        for (const container of this.idle.values()) {
            if (!byEndpoint[container.endpointId]) {
                byEndpoint[container.endpointId] = { idle: 0, acquired: 0 };
            }
            byEndpoint[container.endpointId].idle++;
        }

        for (const container of this.acquired.values()) {
            if (!byEndpoint[container.endpointId]) {
                byEndpoint[container.endpointId] = { idle: 0, acquired: 0 };
            }
            byEndpoint[container.endpointId].acquired++;
        }

        const total = this.idle.size + this.acquired.size;
        const health = this.idle.size >= this.config.minIdle
            ? 'healthy'
            : total > 0
                ? 'degraded'
                : 'unhealthy';

        return {
            idle: this.idle.size,
            acquired: this.acquired.size,
            total,
            maxTotal: this.config.maxTotal,
            byEndpoint,
            health,
            replenishing: this.replenishing,
        };
    }

    /**
     * Register an event handler
     */
    onEvent(handler: PoolEventHandler): void {
        this.on('container_created', (e) => handler({ type: 'container_created', ...e }));
        this.on('container_acquired', (e) => handler({ type: 'container_acquired', ...e }));
        this.on('container_released', (e) => handler({ type: 'container_released', ...e }));
        this.on('container_destroyed', (e) => handler({ type: 'container_destroyed', ...e }));
        this.on('container_error', (e) => handler({ type: 'container_error', ...e }));
        this.on('pool_replenishing', (e) => handler({ type: 'pool_replenishing', ...e }));
        this.on('pool_exhausted', (e) => handler({ type: 'pool_exhausted', ...e }));
        this.on('health_check_failed', (e) => handler({ type: 'health_check_failed', ...e }));
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Get an idle container matching affinity rules
     */
    private getIdleContainer(affinity?: AcquireOptions['affinity']): PooledContainer | undefined {
        // If no affinity, return any idle container (prefer oldest)
        if (!affinity || affinity.length === 0) {
            let oldest: PooledContainer | undefined;
            for (const container of this.idle.values()) {
                if (!oldest || (container.idleSince ?? 0) < (oldest.idleSince ?? 0)) {
                    oldest = container;
                }
            }
            return oldest;
        }

        // Filter by affinity
        for (const container of this.idle.values()) {
            const endpoint = this.scheduler.getEndpoint(container.endpointId);
            if (!endpoint) continue;

            const matches = affinity.every(rule => {
                const value = endpoint.config.labels[rule.key];
                switch (rule.operator) {
                    case 'In':
                        return rule.values?.includes(value);
                    case 'NotIn':
                        return !rule.values?.includes(value);
                    case 'Exists':
                        return rule.key in endpoint.config.labels;
                    case 'DoesNotExist':
                        return !(rule.key in endpoint.config.labels);
                }
            });

            if (matches) return container;
        }

        return undefined;
    }

    /**
     * Create a new container
     */
    private async createContainer(
        affinity?: AcquireOptions['affinity'],
        timeout?: number
    ): Promise<PooledContainer> {
        const endpoint = this.scheduler.selectEndpoint(affinity);
        const startTime = Date.now();

        log.debug({ endpoint: endpoint.config.id }, 'Creating container');

        try {
            // Create Docker container
            const containerOptions: Dockerode.ContainerCreateOptions = {
                Image: this.config.image,
                Env: [
                    'LIQUID_RUNTIME_PORT=8080',
                    'LIQUID_RUNTIME_MODE=idle',
                    `LIQUID_MAX_EXECUTION_TIME=${this.config.resources.maxExecutionTime}`,
                ],
                ExposedPorts: { '8080/tcp': {} },
                HostConfig: {
                    Memory: this.config.resources.memory,
                    CpuPeriod: 100000,
                    CpuQuota: Math.floor(this.config.resources.cpuQuota * 100000),
                    PidsLimit: this.config.resources.pidsLimit,
                    NetworkMode: this.config.network.mode,
                    AutoRemove: false,
                    ReadonlyRootfs: false,
                    SecurityOpt: ['no-new-privileges'],
                    Tmpfs: { '/secrets': 'rw,noexec,nosuid,size=1m' },
                },
                Labels: {
                    'liquid.container': 'true',
                    'liquid.endpoint': endpoint.config.id,
                    'liquid.created': new Date().toISOString(),
                },
            };

            const dockerContainer = await endpoint.client.createContainer(containerOptions);
            await dockerContainer.start();

            // Get container info
            const info = await dockerContainer.inspect();
            const networkSettings = info.NetworkSettings as {
                IPAddress?: string;
                Networks: Record<string, { IPAddress?: string }>;
            };
            const ipAddress = networkSettings.IPAddress ||
                Object.values(networkSettings.Networks)[0]?.IPAddress ||
                '127.0.0.1';

            const containerId = dockerContainer.id;
            const shortId = containerId.slice(0, 12);

            // Create client and wait for runtime server
            const client = createContainerClient(ipAddress, 8080);
            const ready = await client.waitForReady(timeout ?? 30000);

            if (!ready) {
                await dockerContainer.stop();
                await dockerContainer.remove();
                throw new ContainerTimeoutError(containerId, timeout ?? 30000);
            }

            this.clients.set(containerId, client);

            const container: PooledContainer = {
                id: containerId,
                shortId,
                endpointId: endpoint.config.id,
                ipAddress,
                port: 8080,
                state: 'idle',
                createdAt: Date.now(),
                healthFailures: 0,
                dockerContainer,
            };

            this.scheduler.recordSuccess(endpoint.config.id, Date.now() - startTime);
            this.emit('container_created', {
                containerId,
                endpointId: endpoint.config.id,
            });

            log.info({
                containerId: shortId,
                endpoint: endpoint.config.id,
                latency: Date.now() - startTime,
            }, 'Container created');

            return container;
        } catch (error) {
            this.scheduler.recordFailure(endpoint.config.id, (error as Error).message);
            throw error;
        }
    }

    /**
     * Destroy a container
     */
    private async destroyContainer(container: PooledContainer, reason: string): Promise<void> {
        container.state = 'destroying';

        try {
            // Try graceful shutdown
            const client = this.clients.get(container.id);
            if (client) {
                try {
                    await client.shutdown();
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch {
                    // Ignore shutdown errors
                }
            }

            // Force stop and remove
            try {
                await container.dockerContainer.stop({ t: 5 });
            } catch {
                // Container might already be stopped
            }

            try {
                await container.dockerContainer.remove({ force: true });
            } catch {
                // Container might already be removed
            }

            this.clients.delete(container.id);
            container.state = 'destroyed';

            this.emit('container_destroyed', { containerId: container.id, reason });

            log.info({
                containerId: container.shortId,
                reason,
            }, 'Container destroyed');
        } catch (error) {
            log.error({
                containerId: container.shortId,
                error: (error as Error).message,
            }, 'Error destroying container');
        }
    }

    /**
     * Background replenishment
     */
    private async maybeReplenish(): Promise<void> {
        if (this.replenishing) return;
        if (this.idle.size >= this.config.minIdle) return;

        this.replenishing = true;
        const target = this.config.minIdle;
        const current = this.idle.size;

        this.emit('pool_replenishing', { current, target });

        try {
            const needed = target - current;
            const total = this.idle.size + this.acquired.size;
            const canCreate = Math.min(needed, this.config.maxTotal - total);

            log.debug({ needed, canCreate }, 'Replenishing pool');

            const promises = Array(canCreate).fill(null).map(async () => {
                try {
                    const container = await this.createContainer();
                    container.idleSince = Date.now();
                    this.idle.set(container.id, container);
                } catch (error) {
                    log.error({ error: (error as Error).message }, 'Failed to replenish container');
                }
            });

            await Promise.allSettled(promises);
        } finally {
            this.replenishing = false;
        }
    }

    /**
     * Trigger replenishment (public for forcing)
     */
    async replenish(): Promise<void> {
        await this.maybeReplenish();
    }

    /**
     * Run health checks on idle containers
     */
    private async runHealthChecks(): Promise<void> {
        const toCheck = Array.from(this.idle.values());

        for (const container of toCheck) {
            try {
                const client = this.clients.get(container.id);
                if (!client) continue;

                const health = await client.health();

                if (health.status !== 'ok') {
                    container.healthFailures++;
                    this.emit('health_check_failed', {
                        containerId: container.id,
                        error: `Status: ${health.status}`,
                    });

                    if (container.healthFailures >= 3) {
                        this.idle.delete(container.id);
                        await this.destroyContainer(container, 'health_check_failed');
                    }
                } else {
                    container.healthFailures = 0;
                    container.lastHealthCheck = Date.now();
                }
            } catch (error) {
                container.healthFailures++;
                this.emit('health_check_failed', {
                    containerId: container.id,
                    error: (error as Error).message,
                });

                if (container.healthFailures >= 3) {
                    this.idle.delete(container.id);
                    await this.destroyContainer(container, 'health_check_failed');
                }
            }
        }

        // Replenish if needed
        await this.maybeReplenish();
    }

    /**
     * Cleanup containers that have been idle too long
     */
    private async cleanupIdleContainers(): Promise<void> {
        const now = Date.now();
        const toRemove: PooledContainer[] = [];

        for (const container of this.idle.values()) {
            const idleTime = now - (container.idleSince ?? container.createdAt);

            // Keep minimum idle containers
            if (this.idle.size - toRemove.length <= this.config.minIdle) {
                break;
            }

            if (idleTime > this.config.idleTimeout) {
                toRemove.push(container);
            }
        }

        for (const container of toRemove) {
            this.idle.delete(container.id);
            await this.destroyContainer(container, 'idle_timeout');
        }

        if (toRemove.length > 0) {
            log.info({ count: toRemove.length }, 'Cleaned up idle containers');
        }
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create and initialize a container pool
 */
export async function createContainerPool(config: PoolConfig): Promise<ContainerPool> {
    const pool = new ContainerPool(config);
    await pool.initialize();
    return pool;
}
