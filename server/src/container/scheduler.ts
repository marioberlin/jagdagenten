/**
 * Container Scheduler
 *
 * Handles endpoint selection for container placement using weighted
 * load balancing with health-based penalties.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 6.4
 */

import Dockerode from 'dockerode';
import type {
    PlacementStrategy,
    RemoteEndpoint,
    EndpointState,
    AffinityRule,
    SchedulerMetrics,
} from './types.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http.child({ component: 'scheduler' });

// ============================================================================
// Scheduler
// ============================================================================

export class ContainerScheduler {
    private endpoints: Map<string, EndpointState> = new Map();
    private placement: PlacementStrategy;
    private metricsWindow: number[] = [];
    private metricsWindowSize = 60; // 1 minute of requests

    constructor(placement: PlacementStrategy) {
        this.placement = placement;
        this.initializeEndpoints();
    }

    /**
     * Initialize endpoint states from placement config
     */
    private initializeEndpoints(): void {
        // Always add local if placement allows
        if (this.placement.type === 'local' || this.placement.type === 'hybrid') {
            const localEndpoint: RemoteEndpoint = {
                id: 'local',
                url: 'unix:///var/run/docker.sock',
                maxContainers: 50, // Local can handle more
                weight: this.placement.type === 'hybrid' ? this.placement.localWeight * 10 : 10,
                labels: { location: 'local' },
                enabled: true,
            };

            this.endpoints.set('local', {
                config: localEndpoint,
                client: new Dockerode(),
                activeContainers: 0,
                recentRequests: 0,
                recentFailures: 0,
                avgLatency: 50, // Assume low latency for local
                healthy: true,
                lastCheck: Date.now(),
                consecutiveFailures: 0,
            });
        }

        // Add remote endpoints
        const remoteEndpoints = this.placement.type === 'remote'
            ? this.placement.endpoints
            : this.placement.type === 'hybrid'
                ? this.placement.remoteEndpoints
                : [];

        for (const endpoint of remoteEndpoints) {
            if (!endpoint.enabled) continue;

            const client = this.createDockerClient(endpoint);

            this.endpoints.set(endpoint.id, {
                config: endpoint,
                client,
                activeContainers: 0,
                recentRequests: 0,
                recentFailures: 0,
                avgLatency: 200, // Assume higher latency for remote
                healthy: true,
                lastCheck: 0, // Will be checked on first use
                consecutiveFailures: 0,
            });
        }

        log.info({
            totalEndpoints: this.endpoints.size,
            strategy: this.placement.type,
        }, 'Scheduler initialized');
    }

    /**
     * Create Docker client for an endpoint
     */
    private createDockerClient(endpoint: RemoteEndpoint): Dockerode {
        const url = new URL(endpoint.url);

        if (url.protocol === 'unix:') {
            return new Dockerode({ socketPath: url.pathname });
        }

        if (url.protocol === 'tcp:' || url.protocol === 'https:') {
            const options: Dockerode.DockerOptions = {
                host: url.hostname,
                port: parseInt(url.port) || 2376,
            };

            if (endpoint.tls) {
                options.ca = endpoint.tls.ca;
                options.cert = endpoint.tls.cert;
                options.key = endpoint.tls.key;
            }

            return new Dockerode(options);
        }

        if (url.protocol === 'ssh:') {
            // SSH connections require special handling (see remote/ssh-tunnel.ts)
            // For now, return a placeholder that will be replaced
            log.warn({ endpoint: endpoint.id }, 'SSH endpoint requires tunnel - using placeholder');
            return new Dockerode();
        }

        throw new Error(`Unsupported protocol: ${url.protocol}`);
    }

    /**
     * Select the best endpoint for a new container
     */
    selectEndpoint(affinity?: AffinityRule[]): EndpointState {
        const candidates = this.getCandidates(affinity);

        if (candidates.length === 0) {
            throw new Error('No available endpoints match affinity rules');
        }

        // Calculate effective weights
        const weights = candidates.map(state => {
            let weight = state.config.weight;

            // Penalize based on current load (0-50% penalty)
            const loadRatio = state.activeContainers / state.config.maxContainers;
            weight *= (1 - loadRatio * 0.5);

            // Penalize based on recent failures (0-90% penalty)
            const failureRate = state.recentRequests > 0
                ? state.recentFailures / state.recentRequests
                : 0;
            weight *= (1 - failureRate * 0.9);

            // Penalize based on latency (0-30% penalty for >500ms)
            const latencyPenalty = Math.min((state.avgLatency - 100) / 1000, 0.3);
            weight *= (1 - Math.max(0, latencyPenalty));

            // Penalize unhealthy endpoints heavily
            if (!state.healthy) {
                weight *= 0.1;
            }

            return { state, weight: Math.max(0.01, weight) };
        });

        // Log selection weights for debugging
        log.debug({
            candidates: weights.map(w => ({
                id: w.state.config.id,
                weight: w.weight.toFixed(3),
                load: w.state.activeContainers,
                healthy: w.state.healthy,
            })),
        }, 'Endpoint selection weights');

        // Weighted random selection
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;

        for (const { state, weight } of weights) {
            random -= weight;
            if (random <= 0) {
                // Record this request
                state.recentRequests++;
                this.metricsWindow.push(Date.now());
                return state;
            }
        }

        // Fallback to first candidate
        const fallback = weights[0].state;
        fallback.recentRequests++;
        return fallback;
    }

    /**
     * Filter endpoints by affinity rules
     */
    private getCandidates(affinity?: AffinityRule[]): EndpointState[] {
        let candidates = Array.from(this.endpoints.values())
            .filter(e => e.activeContainers < e.config.maxContainers);

        if (!affinity || affinity.length === 0) {
            return candidates;
        }

        for (const rule of affinity) {
            candidates = candidates.filter(c => {
                const labelValue = c.config.labels[rule.key];

                switch (rule.operator) {
                    case 'In':
                        return rule.values?.includes(labelValue);
                    case 'NotIn':
                        return !rule.values?.includes(labelValue);
                    case 'Exists':
                        return rule.key in c.config.labels;
                    case 'DoesNotExist':
                        return !(rule.key in c.config.labels);
                    default:
                        return true;
                }
            });
        }

        return candidates;
    }

    /**
     * Get endpoint by ID
     */
    getEndpoint(endpointId: string): EndpointState | undefined {
        return this.endpoints.get(endpointId);
    }

    /**
     * Get Docker client for an endpoint
     */
    getClient(endpointId: string): Dockerode | undefined {
        return this.endpoints.get(endpointId)?.client;
    }

    /**
     * Update endpoint client (e.g., after SSH tunnel setup)
     */
    updateClient(endpointId: string, client: Dockerode): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.client = client;
        }
    }

    /**
     * Record container acquisition on endpoint
     */
    recordAcquire(endpointId: string): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.activeContainers++;
        }
    }

    /**
     * Record container release on endpoint
     */
    recordRelease(endpointId: string): void {
        const state = this.endpoints.get(endpointId);
        if (state && state.activeContainers > 0) {
            state.activeContainers--;
        }
    }

    /**
     * Record a failure on endpoint
     */
    recordFailure(endpointId: string, error?: string): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.recentFailures++;
            state.consecutiveFailures++;

            // Mark as unhealthy after 3 consecutive failures
            if (state.consecutiveFailures >= 3) {
                state.healthy = false;
                log.warn({
                    endpoint: endpointId,
                    consecutiveFailures: state.consecutiveFailures,
                    error,
                }, 'Endpoint marked unhealthy');
            }
        }
    }

    /**
     * Record successful operation on endpoint
     */
    recordSuccess(endpointId: string, latencyMs: number): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.consecutiveFailures = 0;

            // Update rolling average latency
            state.avgLatency = state.avgLatency * 0.8 + latencyMs * 0.2;

            // Recover from unhealthy state
            if (!state.healthy) {
                state.healthy = true;
                log.info({ endpoint: endpointId }, 'Endpoint recovered');
            }
        }
    }

    /**
     * Check health of an endpoint
     */
    async checkHealth(endpointId: string): Promise<boolean> {
        const state = this.endpoints.get(endpointId);
        if (!state) return false;

        const startTime = Date.now();

        try {
            await state.client.ping();
            const latency = Date.now() - startTime;

            state.lastCheck = Date.now();
            this.recordSuccess(endpointId, latency);

            return true;
        } catch (error) {
            this.recordFailure(endpointId, (error as Error).message);
            return false;
        }
    }

    /**
     * Check health of all endpoints
     */
    async checkAllHealth(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();

        await Promise.all(
            Array.from(this.endpoints.keys()).map(async (id) => {
                const healthy = await this.checkHealth(id);
                results.set(id, healthy);
            })
        );

        return results;
    }

    /**
     * Get scheduler metrics
     */
    getMetrics(): SchedulerMetrics {
        // Clean up old metrics
        const cutoff = Date.now() - 60000; // 1 minute
        this.metricsWindow = this.metricsWindow.filter(t => t > cutoff);

        const states = Array.from(this.endpoints.values());

        return {
            totalEndpoints: states.length,
            healthyEndpoints: states.filter(s => s.healthy).length,
            totalActiveContainers: states.reduce((sum, s) => sum + s.activeContainers, 0),
            totalCapacity: states.reduce((sum, s) => sum + s.config.maxContainers, 0),
            requestsPerSecond: this.metricsWindow.length / 60,
        };
    }

    /**
     * Get detailed endpoint states
     */
    getEndpointStates(): Map<string, EndpointState> {
        return new Map(this.endpoints);
    }

    /**
     * Reset metrics (for testing)
     */
    resetMetrics(): void {
        for (const state of this.endpoints.values()) {
            state.recentRequests = 0;
            state.recentFailures = 0;
            state.consecutiveFailures = 0;
        }
        this.metricsWindow = [];
    }

    /**
     * Add a new endpoint at runtime
     */
    addEndpoint(endpoint: RemoteEndpoint): void {
        if (this.endpoints.has(endpoint.id)) {
            throw new Error(`Endpoint ${endpoint.id} already exists`);
        }

        const client = this.createDockerClient(endpoint);

        this.endpoints.set(endpoint.id, {
            config: endpoint,
            client,
            activeContainers: 0,
            recentRequests: 0,
            recentFailures: 0,
            avgLatency: 200,
            healthy: true,
            lastCheck: 0,
            consecutiveFailures: 0,
        });

        log.info({ endpoint: endpoint.id }, 'Endpoint added');
    }

    /**
     * Remove an endpoint
     */
    removeEndpoint(endpointId: string): boolean {
        const state = this.endpoints.get(endpointId);
        if (!state) return false;

        if (state.activeContainers > 0) {
            log.warn({
                endpoint: endpointId,
                activeContainers: state.activeContainers,
            }, 'Removing endpoint with active containers');
        }

        this.endpoints.delete(endpointId);
        log.info({ endpoint: endpointId }, 'Endpoint removed');
        return true;
    }

    /**
     * Disable an endpoint (keeps it but stops using it)
     */
    disableEndpoint(endpointId: string): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.config.enabled = false;
            state.healthy = false;
            log.info({ endpoint: endpointId }, 'Endpoint disabled');
        }
    }

    /**
     * Enable a previously disabled endpoint
     */
    enableEndpoint(endpointId: string): void {
        const state = this.endpoints.get(endpointId);
        if (state) {
            state.config.enabled = true;
            state.healthy = true;
            state.consecutiveFailures = 0;
            log.info({ endpoint: endpointId }, 'Endpoint enabled');
        }
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a scheduler from placement config
 */
export function createScheduler(placement: PlacementStrategy): ContainerScheduler {
    return new ContainerScheduler(placement);
}
