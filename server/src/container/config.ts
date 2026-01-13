/**
 * LiquidContainer Configuration
 *
 * Environment-variable driven configuration with Zod validation.
 * Supports optional YAML file override for complex deployments.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 5
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
    PoolConfig,
    ResourceLimits,
    NetworkConfig,
    PlacementStrategy,
    RemoteEndpoint,
    SecretsConfig,
    ContainerConfig,
} from './types.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const ResourceLimitsSchema = z.object({
    memory: z.number().min(67108864).max(17179869184).default(536870912), // 64MB - 16GB, default 512MB
    cpuQuota: z.number().min(0.1).max(16).default(0.5),
    pidsLimit: z.number().min(10).max(10000).default(100),
    diskQuota: z.number().optional(),
    maxExecutionTime: z.number().min(1000).max(3600000).default(300000), // 1s - 1hr, default 5min
});

const NetworkConfigSchema = z.object({
    mode: z.enum(['bridge', 'none', 'host']).default('bridge'),
    allowedHosts: z.array(z.string()).default([
        'api.anthropic.com',
        'api.google.com',
        'api.openai.com',
        'registry.npmjs.org',
    ]),
    dns: z.array(z.string()).optional(),
});

const TLSConfigSchema = z.object({
    ca: z.string().optional(),
    cert: z.string().optional(),
    key: z.string().optional(),
    skipVerify: z.boolean().default(false),
});

const RemoteEndpointSchema = z.object({
    id: z.string().min(1),
    url: z.string().min(1),
    tls: TLSConfigSchema.optional(),
    sshKey: z.string().optional(),
    sshUser: z.string().default('deploy'),
    maxContainers: z.number().min(1).default(10),
    weight: z.number().min(0).max(100).default(1),
    labels: z.record(z.string(), z.string()).default({}),
    enabled: z.boolean().default(true),
});

const PlacementStrategySchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('local') }),
    z.object({
        type: z.literal('remote'),
        endpoints: z.array(RemoteEndpointSchema).min(1),
    }),
    z.object({
        type: z.literal('hybrid'),
        localWeight: z.number().min(0).max(1).default(0.7),
        remoteEndpoints: z.array(RemoteEndpointSchema).min(1),
    }),
]);

const PoolConfigSchema = z.object({
    minIdle: z.number().min(0).max(100).default(3),
    maxTotal: z.number().min(1).max(1000).default(20),
    idleTimeout: z.number().min(10000).max(3600000).default(300000), // 10s - 1hr, default 5min
    acquireTimeout: z.number().min(1000).max(60000).default(30000), // 1s - 60s, default 30s
    healthCheckInterval: z.number().min(1000).max(60000).default(10000), // 1s - 60s, default 10s
    image: z.string().default('liquid-container:latest'),
    registry: z.string().optional(),
    resources: ResourceLimitsSchema,
    placement: PlacementStrategySchema,
    network: NetworkConfigSchema,
});

const SecretsConfigSchema = z.object({
    backend: z.enum(['env', 'vault', 'aws-sm', 'gcp-sm']).default('env'),
    config: z.record(z.string(), z.string()).default({}),
});

const ContainerConfigSchema = z.object({
    pool: PoolConfigSchema,
    secrets: SecretsConfigSchema,
});

// ============================================================================
// Environment Parsing
// ============================================================================

/**
 * Parse placement strategy from environment variables
 */
function parsePlacement(): PlacementStrategy {
    const strategy = process.env.LIQUID_PLACEMENT_STRATEGY ?? 'local';

    if (strategy === 'local') {
        return { type: 'local' };
    }

    // Parse remote endpoints from JSON
    const endpointsJson = process.env.LIQUID_REMOTE_ENDPOINTS;
    if (!endpointsJson) {
        console.warn('LIQUID_REMOTE_ENDPOINTS not set, falling back to local');
        return { type: 'local' };
    }

    let endpoints: RemoteEndpoint[];
    try {
        endpoints = JSON.parse(endpointsJson);
    } catch (e) {
        console.error('Failed to parse LIQUID_REMOTE_ENDPOINTS:', e);
        return { type: 'local' };
    }

    if (strategy === 'remote') {
        return {
            type: 'remote',
            endpoints,
        };
    }

    if (strategy === 'hybrid') {
        return {
            type: 'hybrid',
            localWeight: parseFloat(process.env.LIQUID_PLACEMENT_LOCAL_WEIGHT ?? '0.7'),
            remoteEndpoints: endpoints,
        };
    }

    return { type: 'local' };
}

/**
 * Parse network config from environment variables
 */
function parseNetworkConfig(): NetworkConfig {
    const allowedHosts = process.env.LIQUID_ALLOWED_HOSTS?.split(',').map(h => h.trim()) ?? [
        'api.anthropic.com',
        'api.google.com',
        'api.openai.com',
        'registry.npmjs.org',
    ];

    const dns = process.env.LIQUID_DNS?.split(',').map(h => h.trim());

    return {
        mode: (process.env.LIQUID_NETWORK_MODE as 'bridge' | 'none' | 'host') ?? 'bridge',
        allowedHosts,
        dns,
    };
}

/**
 * Load configuration from environment variables
 */
function loadFromEnv(): ContainerConfig {
    const pool: PoolConfig = {
        minIdle: parseInt(process.env.LIQUID_POOL_MIN_IDLE ?? '3'),
        maxTotal: parseInt(process.env.LIQUID_POOL_MAX_TOTAL ?? '20'),
        idleTimeout: parseInt(process.env.LIQUID_POOL_IDLE_TIMEOUT ?? '300000'),
        acquireTimeout: parseInt(process.env.LIQUID_POOL_ACQUIRE_TIMEOUT ?? '30000'),
        healthCheckInterval: parseInt(process.env.LIQUID_POOL_HEALTH_INTERVAL ?? '10000'),
        image: process.env.LIQUID_CONTAINER_IMAGE ?? 'liquid-container:latest',
        registry: process.env.LIQUID_CONTAINER_REGISTRY,
        resources: {
            memory: parseInt(process.env.LIQUID_CONTAINER_MEMORY ?? '536870912'),
            cpuQuota: parseFloat(process.env.LIQUID_CONTAINER_CPU ?? '0.5'),
            pidsLimit: parseInt(process.env.LIQUID_CONTAINER_PIDS ?? '100'),
            maxExecutionTime: parseInt(process.env.LIQUID_MAX_EXECUTION_TIME ?? '300000'),
        },
        placement: parsePlacement(),
        network: parseNetworkConfig(),
    };

    const secrets: SecretsConfig = {
        backend: (process.env.LIQUID_SECRETS_BACKEND as SecretsConfig['backend']) ?? 'env',
        config: {},
    };

    // Parse backend-specific config
    if (secrets.backend === 'vault') {
        secrets.config = {
            address: process.env.VAULT_ADDR ?? '',
            role: process.env.VAULT_ROLE ?? 'liquid-container',
        };
    }

    return { pool, secrets };
}

/**
 * Load configuration from YAML file
 */
function loadFromFile(filePath: string): Partial<ContainerConfig> | null {
    if (!existsSync(filePath)) {
        return null;
    }

    try {
        const content = readFileSync(filePath, 'utf-8');

        // Simple YAML parsing (for basic key-value configs)
        // For complex configs, consider using js-yaml
        const lines = content.split('\n');
        const result: Record<string, unknown> = {};
        let currentSection = '';
        let currentIndent = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const indent = line.search(/\S/);
            const colonIndex = trimmed.indexOf(':');

            if (colonIndex === -1) continue;

            const key = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim();

            if (indent === 0) {
                currentSection = key;
                result[key] = value || {};
                currentIndent = indent;
            } else if (value && currentSection) {
                if (typeof result[currentSection] === 'object') {
                    (result[currentSection] as Record<string, string>)[key] = value;
                }
            }
        }

        return result as Partial<ContainerConfig>;
    } catch (e) {
        console.warn('Failed to load config file:', e);
        return null;
    }
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Load and validate container configuration
 *
 * Priority:
 * 1. Environment variables
 * 2. YAML config file (.liquid/container.yaml)
 * 3. Defaults
 */
export function loadConfig(): ContainerConfig {
    // Load base config from environment
    const envConfig = loadFromEnv();

    // Try to load file overrides
    const configPaths = [
        join(process.cwd(), '.liquid', 'container.yaml'),
        join(process.cwd(), '.liquid', 'container.yml'),
        join(process.cwd(), 'container.config.yaml'),
    ];

    let fileConfig: Partial<ContainerConfig> | null = null;
    for (const path of configPaths) {
        fileConfig = loadFromFile(path);
        if (fileConfig) {
            console.log(`Loaded container config from ${path}`);
            break;
        }
    }

    // Merge configs (env takes precedence, then file, then defaults)
    const merged = fileConfig
        ? deepMerge(fileConfig, envConfig)
        : envConfig;

    // Validate with Zod
    const validated = ContainerConfigSchema.parse(merged);

    return validated as ContainerConfig;
}

/**
 * Get default configuration (for testing)
 */
export function getDefaultConfig(): ContainerConfig {
    return ContainerConfigSchema.parse({
        pool: {
            resources: {},
            placement: { type: 'local' },
            network: {},
        },
        secrets: {},
    }) as ContainerConfig;
}

/**
 * Validate a partial configuration
 */
export function validateConfig(config: unknown): { valid: boolean; errors: string[] } {
    try {
        ContainerConfigSchema.parse(config);
        return { valid: true, errors: [] };
    } catch (e) {
        // Zod v4 uses a different error structure
        if (e && typeof e === 'object' && 'issues' in e) {
            const zodError = e as { issues: Array<{ path: (string | number)[]; message: string }> };
            return {
                valid: false,
                errors: zodError.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
            };
        }
        return { valid: false, errors: [(e as Error).message] };
    }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
    const result = { ...base };

    for (const key of Object.keys(override)) {
        const baseValue = base[key];
        const overrideValue = override[key];

        if (
            baseValue &&
            typeof baseValue === 'object' &&
            !Array.isArray(baseValue) &&
            overrideValue &&
            typeof overrideValue === 'object' &&
            !Array.isArray(overrideValue)
        ) {
            result[key as keyof T] = deepMerge(
                baseValue as Record<string, unknown>,
                overrideValue as Record<string, unknown>
            ) as T[keyof T];
        } else if (overrideValue !== undefined) {
            result[key as keyof T] = overrideValue as T[keyof T];
        }
    }

    return result;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration to human readable
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

// Export schemas for external validation
export {
    PoolConfigSchema,
    ResourceLimitsSchema,
    NetworkConfigSchema,
    PlacementStrategySchema,
    RemoteEndpointSchema,
    SecretsConfigSchema,
    ContainerConfigSchema,
};
