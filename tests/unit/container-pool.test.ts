/**
 * Container Pool Unit Tests
 *
 * Tests for the container pool manager, scheduler, and related components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    loadConfig,
    getDefaultConfig,
    validateConfig,
    formatBytes,
    formatDuration,
} from '../../server/src/container/config.js';
import {
    ContainerScheduler,
    createScheduler,
} from '../../server/src/container/scheduler.js';
import {
    EnvSecretsProvider,
    VaultSecretsProvider,
} from '../../server/src/container/secrets.js';
import type {
    PlacementStrategy,
    RemoteEndpoint,
    AffinityRule,
} from '../../server/src/container/types.js';

// ============================================================================
// Configuration Tests
// ============================================================================

describe('Container Configuration', () => {
    describe('loadConfig', () => {
        it('should load default config when no env vars set', () => {
            const config = getDefaultConfig();

            expect(config.pool.minIdle).toBe(3);
            expect(config.pool.maxTotal).toBe(20);
            expect(config.pool.idleTimeout).toBe(300000);
            expect(config.pool.resources.memory).toBe(536870912);
            expect(config.pool.resources.cpuQuota).toBe(0.5);
            expect(config.pool.placement.type).toBe('local');
            expect(config.secrets.backend).toBe('env');
        });

        it('should validate correct config', () => {
            const result = validateConfig({
                pool: {
                    minIdle: 5,
                    maxTotal: 50,
                    idleTimeout: 600000,
                    acquireTimeout: 30000,
                    healthCheckInterval: 10000,
                    image: 'my-image:latest',
                    resources: {
                        memory: 1073741824,
                        cpuQuota: 1.0,
                        pidsLimit: 200,
                        maxExecutionTime: 300000,
                    },
                    placement: { type: 'local' },
                    network: {
                        mode: 'bridge',
                        allowedHosts: ['api.example.com'],
                    },
                },
                secrets: {
                    backend: 'env',
                    config: {},
                },
            });

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid config', () => {
            const result = validateConfig({
                pool: {
                    minIdle: -1, // Invalid
                    maxTotal: 0, // Invalid
                },
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1048576)).toBe('1 MB');
            expect(formatBytes(1073741824)).toBe('1 GB');
            expect(formatBytes(536870912)).toBe('512 MB');
        });
    });

    describe('formatDuration', () => {
        it('should format duration correctly', () => {
            expect(formatDuration(500)).toBe('500ms');
            expect(formatDuration(1000)).toBe('1.0s');
            expect(formatDuration(60000)).toBe('1.0m');
            expect(formatDuration(3600000)).toBe('1.0h');
        });
    });
});

// ============================================================================
// Scheduler Tests
// ============================================================================

describe('Container Scheduler', () => {
    let scheduler: ContainerScheduler;

    beforeEach(() => {
        const placement: PlacementStrategy = {
            type: 'hybrid',
            localWeight: 0.5,
            remoteEndpoints: [
                {
                    id: 'remote-1',
                    url: 'tcp://192.168.1.100:2376',
                    maxContainers: 10,
                    weight: 2,
                    labels: { region: 'us-east', tier: 'standard' },
                    enabled: true,
                },
                {
                    id: 'remote-2',
                    url: 'tcp://192.168.1.101:2376',
                    maxContainers: 5,
                    weight: 1,
                    labels: { region: 'eu-west', tier: 'premium' },
                    enabled: true,
                },
            ],
        };

        scheduler = createScheduler(placement);
    });

    describe('selectEndpoint', () => {
        it('should select an endpoint', () => {
            const endpoint = scheduler.selectEndpoint();
            expect(endpoint).toBeDefined();
            expect(['local', 'remote-1', 'remote-2']).toContain(endpoint.config.id);
        });

        it('should respect affinity rules (In)', () => {
            const affinity: AffinityRule[] = [
                { key: 'region', operator: 'In', values: ['us-east'] },
            ];

            // Run multiple times to verify
            for (let i = 0; i < 10; i++) {
                const endpoint = scheduler.selectEndpoint(affinity);
                expect(endpoint.config.id).toBe('remote-1');
            }
        });

        it('should respect affinity rules (NotIn)', () => {
            const affinity: AffinityRule[] = [
                { key: 'region', operator: 'NotIn', values: ['us-east'] },
            ];

            for (let i = 0; i < 10; i++) {
                const endpoint = scheduler.selectEndpoint(affinity);
                expect(endpoint.config.id).not.toBe('remote-1');
            }
        });

        it('should respect affinity rules (Exists)', () => {
            const affinity: AffinityRule[] = [
                { key: 'tier', operator: 'Exists' },
            ];

            for (let i = 0; i < 10; i++) {
                const endpoint = scheduler.selectEndpoint(affinity);
                expect(['remote-1', 'remote-2']).toContain(endpoint.config.id);
            }
        });
    });

    describe('recordAcquire/recordRelease', () => {
        it('should track active containers', () => {
            const endpoint = scheduler.selectEndpoint();
            const initialCount = endpoint.activeContainers;

            scheduler.recordAcquire(endpoint.config.id);
            expect(scheduler.getEndpoint(endpoint.config.id)?.activeContainers).toBe(initialCount + 1);

            scheduler.recordRelease(endpoint.config.id);
            expect(scheduler.getEndpoint(endpoint.config.id)?.activeContainers).toBe(initialCount);
        });
    });

    describe('recordFailure/recordSuccess', () => {
        it('should mark endpoint unhealthy after consecutive failures', () => {
            const endpoint = scheduler.getEndpoint('remote-1')!;
            expect(endpoint.healthy).toBe(true);

            scheduler.recordFailure('remote-1');
            scheduler.recordFailure('remote-1');
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(true); // Still healthy

            scheduler.recordFailure('remote-1');
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(false); // Now unhealthy
        });

        it('should recover endpoint on success', () => {
            // Make unhealthy
            scheduler.recordFailure('remote-1');
            scheduler.recordFailure('remote-1');
            scheduler.recordFailure('remote-1');
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(false);

            // Recover
            scheduler.recordSuccess('remote-1', 100);
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(true);
        });

        it('should update latency average', () => {
            const initial = scheduler.getEndpoint('remote-1')?.avgLatency ?? 0;

            scheduler.recordSuccess('remote-1', 500);
            const updated = scheduler.getEndpoint('remote-1')?.avgLatency ?? 0;

            // Should be between initial and 500 (weighted average)
            expect(updated).toBeGreaterThan(initial);
            expect(updated).toBeLessThan(500);
        });
    });

    describe('getMetrics', () => {
        it('should return correct metrics', () => {
            const metrics = scheduler.getMetrics();

            expect(metrics.totalEndpoints).toBe(3); // local + 2 remote
            expect(metrics.healthyEndpoints).toBe(3);
            expect(metrics.totalActiveContainers).toBe(0);
            expect(metrics.totalCapacity).toBeGreaterThan(0);
        });
    });

    describe('addEndpoint/removeEndpoint', () => {
        it('should add new endpoint', () => {
            const newEndpoint: RemoteEndpoint = {
                id: 'remote-3',
                url: 'tcp://192.168.1.102:2376',
                maxContainers: 10,
                weight: 1,
                labels: {},
                enabled: true,
            };

            scheduler.addEndpoint(newEndpoint);
            expect(scheduler.getEndpoint('remote-3')).toBeDefined();
        });

        it('should throw on duplicate endpoint', () => {
            const duplicate: RemoteEndpoint = {
                id: 'remote-1', // Already exists
                url: 'tcp://192.168.1.100:2376',
                maxContainers: 10,
                weight: 1,
                labels: {},
                enabled: true,
            };

            expect(() => scheduler.addEndpoint(duplicate)).toThrow();
        });

        it('should remove endpoint', () => {
            const removed = scheduler.removeEndpoint('remote-2');
            expect(removed).toBe(true);
            expect(scheduler.getEndpoint('remote-2')).toBeUndefined();
        });
    });

    describe('disableEndpoint/enableEndpoint', () => {
        it('should disable and enable endpoint', () => {
            scheduler.disableEndpoint('remote-1');
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(false);
            expect(scheduler.getEndpoint('remote-1')?.config.enabled).toBe(false);

            scheduler.enableEndpoint('remote-1');
            expect(scheduler.getEndpoint('remote-1')?.healthy).toBe(true);
            expect(scheduler.getEndpoint('remote-1')?.config.enabled).toBe(true);
        });
    });
});

// ============================================================================
// Secrets Provider Tests
// ============================================================================

describe('Secrets Providers', () => {
    describe('EnvSecretsProvider', () => {
        const originalEnv = { ...process.env };

        beforeEach(() => {
            process.env.LIQUID_SECRET_API_KEY = 'test-api-key';
            process.env.LIQUID_SECRET_DATABASE_URL = 'postgres://localhost/test';
        });

        afterEach(() => {
            // Restore original env
            process.env = { ...originalEnv };
        });

        it('should get secret from environment', async () => {
            const provider = new EnvSecretsProvider();
            const secret = await provider.getSecret('api-key');
            expect(secret).toBe('test-api-key');
        });

        it('should throw for missing secret', async () => {
            const provider = new EnvSecretsProvider();
            await expect(provider.getSecret('missing')).rejects.toThrow();
        });

        it('should check if secret exists', async () => {
            const provider = new EnvSecretsProvider();
            expect(await provider.hasSecret('api-key')).toBe(true);
            expect(await provider.hasSecret('missing')).toBe(false);
        });

        it('should list available secrets', async () => {
            const provider = new EnvSecretsProvider();
            const secrets = await provider.listSecrets();
            expect(secrets).toContain('api-key');
            expect(secrets).toContain('database-url');
        });

        it('should support custom prefix', async () => {
            process.env.CUSTOM_SECRET_TOKEN = 'custom-token';

            const provider = new EnvSecretsProvider('CUSTOM_SECRET_');
            const secret = await provider.getSecret('token');
            expect(secret).toBe('custom-token');
        });
    });

    describe('VaultSecretsProvider', () => {
        it('should require token', () => {
            expect(() => new VaultSecretsProvider({
                address: 'http://vault:8200',
                token: undefined,
            })).toThrow('Vault token required');
        });
    });
});

// ============================================================================
// Type Tests
// ============================================================================

describe('Container Types', () => {
    it('should export all required types', async () => {
        const types = await import('../../server/src/container/types.js');

        // Errors
        expect(types.PoolExhaustedError).toBeDefined();
        expect(types.ContainerTimeoutError).toBeDefined();
        expect(types.ContainerExecutionError).toBeDefined();
        expect(types.EndpointUnavailableError).toBeDefined();
    });

    it('should create PoolExhaustedError correctly', async () => {
        const { PoolExhaustedError } = await import('../../server/src/container/types.js');

        const error = new PoolExhaustedError('Pool is full');
        expect(error.name).toBe('PoolExhaustedError');
        expect(error.message).toBe('Pool is full');
    });

    it('should create ContainerTimeoutError correctly', async () => {
        const { ContainerTimeoutError } = await import('../../server/src/container/types.js');

        const error = new ContainerTimeoutError('abc123', 30000);
        expect(error.name).toBe('ContainerTimeoutError');
        expect(error.containerId).toBe('abc123');
        expect(error.timeout).toBe(30000);
    });
});

// ============================================================================
// Index Export Tests
// ============================================================================

describe('Container Module Exports', () => {
    it('should export all public APIs', async () => {
        const container = await import('../../server/src/container/index.js');

        // Pool
        expect(container.ContainerPool).toBeDefined();
        expect(container.createContainerPool).toBeDefined();

        // Scheduler
        expect(container.ContainerScheduler).toBeDefined();
        expect(container.createScheduler).toBeDefined();

        // Client
        expect(container.ContainerClient).toBeDefined();
        expect(container.createContainerClient).toBeDefined();

        // Config
        expect(container.loadConfig).toBeDefined();
        expect(container.getDefaultConfig).toBeDefined();
        expect(container.validateConfig).toBeDefined();

        // Secrets
        expect(container.EnvSecretsProvider).toBeDefined();
        expect(container.VaultSecretsProvider).toBeDefined();
        expect(container.createSecretsProvider).toBeDefined();

        // SSH Tunnel
        expect(container.SSHTunnel).toBeDefined();
        expect(container.TunnelManager).toBeDefined();

        // Metrics
        expect(container.initializeMetrics).toBeDefined();
        expect(container.getMetrics).toBeDefined();

        // Executor
        expect(container.ContainerExecutor).toBeDefined();
        expect(container.createContainerExecutor).toBeDefined();

        // Errors
        expect(container.PoolExhaustedError).toBeDefined();
        expect(container.ContainerTimeoutError).toBeDefined();
    });
});
