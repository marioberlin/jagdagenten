/**
 * LiquidContainer Type Definitions
 *
 * Core types for the container runtime system.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md
 */

import type Dockerode from 'dockerode';

// ============================================================================
// Pool Configuration
// ============================================================================

/**
 * Pool configuration for container management
 */
export interface PoolConfig {
    /** Minimum idle containers to maintain */
    minIdle: number;
    /** Maximum total containers */
    maxTotal: number;
    /** Container idle timeout before destruction (ms) */
    idleTimeout: number;
    /** Max time to wait for container acquisition (ms) */
    acquireTimeout: number;
    /** Health check interval (ms) */
    healthCheckInterval: number;
    /** Container image to use */
    image: string;
    /** Image registry URL */
    registry?: string;
    /** Resource limits per container */
    resources: ResourceLimits;
    /** Placement strategy */
    placement: PlacementStrategy;
    /** Network configuration */
    network: NetworkConfig;
}

/**
 * Resource limits for containers
 */
export interface ResourceLimits {
    /** Memory limit in bytes */
    memory: number;
    /** CPU quota (1.0 = 1 core) */
    cpuQuota: number;
    /** Max PIDs (process limit) */
    pidsLimit: number;
    /** Disk quota in bytes (if supported) */
    diskQuota?: number;
    /** Max execution time in ms */
    maxExecutionTime: number;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
    /** Network mode */
    mode: 'bridge' | 'none' | 'host';
    /** Allowed egress hosts (for restricted mode) */
    allowedHosts: string[];
    /** DNS servers */
    dns?: string[];
}

// ============================================================================
// Placement Strategy
// ============================================================================

/**
 * Placement strategy discriminated union
 */
export type PlacementStrategy =
    | LocalPlacement
    | RemotePlacement
    | HybridPlacement;

export interface LocalPlacement {
    type: 'local';
}

export interface RemotePlacement {
    type: 'remote';
    endpoints: RemoteEndpoint[];
}

export interface HybridPlacement {
    type: 'hybrid';
    /** Weight for local execution (0-1) */
    localWeight: number;
    /** Remote endpoints */
    remoteEndpoints: RemoteEndpoint[];
}

/**
 * Remote Docker endpoint configuration
 */
export interface RemoteEndpoint {
    /** Unique endpoint ID */
    id: string;
    /** Docker API URL (tcp://, ssh://, unix://) */
    url: string;
    /** TLS configuration for tcp:// */
    tls?: TLSConfig;
    /** SSH private key for ssh:// */
    sshKey?: string;
    /** SSH user (default: deploy) */
    sshUser?: string;
    /** Maximum containers on this endpoint */
    maxContainers: number;
    /** Weight for load balancing (higher = more traffic) */
    weight: number;
    /** Labels for affinity matching */
    labels: Record<string, string>;
    /** Whether endpoint is enabled */
    enabled: boolean;
}

/**
 * TLS configuration for secure Docker connections
 */
export interface TLSConfig {
    /** CA certificate */
    ca?: string;
    /** Client certificate */
    cert?: string;
    /** Client key */
    key?: string;
    /** Skip TLS verification (not recommended) */
    skipVerify?: boolean;
}

// ============================================================================
// Container State
// ============================================================================

/**
 * Container lifecycle states
 */
export type ContainerState =
    | 'creating'
    | 'idle'
    | 'initializing'
    | 'ready'
    | 'executing'
    | 'resetting'
    | 'destroying'
    | 'destroyed'
    | 'error';

/**
 * A container managed by the pool
 */
export interface PooledContainer {
    /** Docker container ID */
    id: string;
    /** Short ID for logging */
    shortId: string;
    /** Endpoint this container runs on */
    endpointId: string;
    /** Container IP address */
    ipAddress: string;
    /** Runtime server port */
    port: number;
    /** Current state */
    state: ContainerState;
    /** When container was created */
    createdAt: number;
    /** When container was acquired (if acquired) */
    acquiredAt?: number;
    /** When container became idle (if idle) */
    idleSince?: number;
    /** Current agent ID (if assigned) */
    agentId?: string;
    /** Health check failures count */
    healthFailures: number;
    /** Last health check timestamp */
    lastHealthCheck?: number;
    /** Docker container reference */
    dockerContainer: Dockerode.Container;
}

/**
 * Container statistics
 */
export interface ContainerStats {
    /** CPU usage percentage */
    cpuPercent: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Memory limit in bytes */
    memoryLimit: number;
    /** Network RX bytes */
    networkRxBytes: number;
    /** Network TX bytes */
    networkTxBytes: number;
    /** PIDs count */
    pidsCount: number;
}

// ============================================================================
// Pool Operations
// ============================================================================

/**
 * Options for acquiring a container
 */
export interface AcquireOptions {
    /** Affinity rules for endpoint selection */
    affinity?: AffinityRule[];
    /** Agent ID to assign */
    agentId?: string;
    /** Timeout override (ms) */
    timeout?: number;
    /** Priority (higher = prefer warm pool) */
    priority?: 'normal' | 'high';
}

/**
 * Options for releasing a container
 */
export interface ReleaseOptions {
    /** Force destroy instead of recycling */
    destroy?: boolean;
    /** Reason for release */
    reason?: string;
}

/**
 * Affinity rule for endpoint selection
 */
export interface AffinityRule {
    /** Label key to match */
    key: string;
    /** Match operator */
    operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
    /** Values to match (for In/NotIn) */
    values?: string[];
}

// ============================================================================
// Runtime Server Protocol
// ============================================================================

/**
 * Request to initialize a container for an agent
 */
export interface InitRequest {
    /** Unique agent identifier */
    agentId: string;
    /** Script to execute */
    script?: {
        type: 'path' | 'inline';
        content: string;
        filename?: string;
    };
    /** Additional environment variables */
    env?: Record<string, string>;
    /** Working directory */
    workdir?: string;
    /** Secrets to inject (names only, fetched by runtime) */
    secrets?: string[];
}

/**
 * Request to execute a command
 */
export interface ExecuteRequest {
    /** Command to execute */
    command: string;
    /** Command arguments */
    args?: string[];
    /** Execution timeout in ms */
    timeout?: number;
    /** Working directory */
    cwd?: string;
    /** Additional environment variables */
    env?: Record<string, string>;
    /** Stream output via SSE */
    stream?: boolean;
}

/**
 * Response from command execution
 */
export interface ExecuteResponse {
    /** Exit code */
    exitCode: number;
    /** Standard output */
    stdout: string;
    /** Standard error */
    stderr: string;
    /** Execution duration in ms */
    duration: number;
    /** Whether execution was killed due to timeout */
    timedOut: boolean;
    /** Whether execution was killed due to OOM */
    oomKilled: boolean;
}

/**
 * Health check response
 */
export interface HealthResponse {
    /** Overall status */
    status: 'ok' | 'degraded' | 'error';
    /** Runtime mode */
    mode: ContainerState;
    /** Uptime in seconds */
    uptime: number;
    /** Memory usage */
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
    };
    /** Current agent (if assigned) */
    agentId?: string;
    /** Last error (if any) */
    lastError?: string;
}

// ============================================================================
// Pool Events
// ============================================================================

/**
 * Events emitted by the container pool
 */
export type PoolEvent =
    | { type: 'container_created'; containerId: string; endpointId: string }
    | { type: 'container_acquired'; containerId: string; fromPool: boolean; agentId?: string }
    | { type: 'container_released'; containerId: string; recycled: boolean }
    | { type: 'container_destroyed'; containerId: string; reason: string }
    | { type: 'container_error'; containerId: string; error: string }
    | { type: 'pool_replenishing'; current: number; target: number }
    | { type: 'pool_exhausted'; waiting: number }
    | { type: 'endpoint_unhealthy'; endpointId: string; consecutiveFailures: number }
    | { type: 'endpoint_recovered'; endpointId: string }
    | { type: 'health_check_failed'; containerId: string; error: string };

/**
 * Event handler for pool events
 */
export type PoolEventHandler = (event: PoolEvent) => void;

// ============================================================================
// Scheduler
// ============================================================================

/**
 * State tracking for an endpoint
 */
export interface EndpointState {
    /** Endpoint configuration */
    config: RemoteEndpoint;
    /** Docker client for this endpoint */
    client: Dockerode;
    /** Active container count */
    activeContainers: number;
    /** Recent request count (for rate calculation) */
    recentRequests: number;
    /** Recent failure count */
    recentFailures: number;
    /** Average latency (ms) */
    avgLatency: number;
    /** Whether endpoint is healthy */
    healthy: boolean;
    /** Last health check time */
    lastCheck: number;
    /** Consecutive failures */
    consecutiveFailures: number;
}

/**
 * Scheduler metrics
 */
export interface SchedulerMetrics {
    /** Total endpoints */
    totalEndpoints: number;
    /** Healthy endpoints */
    healthyEndpoints: number;
    /** Total active containers */
    totalActiveContainers: number;
    /** Total capacity */
    totalCapacity: number;
    /** Requests per second */
    requestsPerSecond: number;
}

// ============================================================================
// Secrets
// ============================================================================

/**
 * Secrets backend type
 */
export type SecretsBackend = 'env' | 'vault' | 'aws-sm' | 'gcp-sm';

/**
 * Secrets configuration
 */
export interface SecretsConfig {
    /** Backend to use */
    backend: SecretsBackend;
    /** Backend-specific configuration */
    config: Record<string, string>;
}

/**
 * Secrets provider interface
 */
export interface SecretsProvider {
    /** Get a secret by name */
    getSecret(name: string): Promise<string>;
    /** Check if a secret exists */
    hasSecret(name: string): Promise<boolean>;
    /** List available secret names */
    listSecrets(): Promise<string[]>;
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Pool exhausted error
 */
export class PoolExhaustedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PoolExhaustedError';
    }
}

/**
 * Container timeout error
 */
export class ContainerTimeoutError extends Error {
    constructor(
        public containerId: string,
        public timeout: number
    ) {
        super(`Container ${containerId} timed out after ${timeout}ms`);
        this.name = 'ContainerTimeoutError';
    }
}

/**
 * Container execution error
 */
export class ContainerExecutionError extends Error {
    constructor(
        public containerId: string,
        public exitCode: number,
        public stderr: string
    ) {
        super(`Container ${containerId} exited with code ${exitCode}: ${stderr}`);
        this.name = 'ContainerExecutionError';
    }
}

/**
 * Endpoint unavailable error
 */
export class EndpointUnavailableError extends Error {
    constructor(public endpointId: string) {
        super(`Endpoint ${endpointId} is unavailable`);
        this.name = 'EndpointUnavailableError';
    }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Container creation options
 */
export interface ContainerCreateOptions {
    /** Endpoint to create on */
    endpointId: string;
    /** Environment variables */
    env?: Record<string, string>;
    /** Volume mounts */
    mounts?: Array<{
        source: string;
        target: string;
        readonly: boolean;
    }>;
    /** Labels */
    labels?: Record<string, string>;
}

/**
 * Pool status
 */
export interface PoolStatus {
    /** Number of idle containers */
    idle: number;
    /** Number of acquired containers */
    acquired: number;
    /** Total containers */
    total: number;
    /** Maximum allowed */
    maxTotal: number;
    /** Containers by endpoint */
    byEndpoint: Record<string, { idle: number; acquired: number }>;
    /** Pool health */
    health: 'healthy' | 'degraded' | 'unhealthy';
    /** Active replenishment */
    replenishing: boolean;
}

/**
 * Full container configuration
 */
export interface ContainerConfig {
    pool: PoolConfig;
    secrets: SecretsConfig;
}
