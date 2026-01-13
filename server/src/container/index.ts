/**
 * LiquidContainer Module
 *
 * Container runtime for executing AI agents in isolated environments.
 *
 * @example
 * ```typescript
 * import { createContainerPool, loadConfig } from './container';
 *
 * const config = loadConfig();
 * const pool = await createContainerPool(config.pool);
 *
 * const container = await pool.acquire({ agentId: 'my-agent' });
 * await pool.initContainer(container.id, { agentId: 'my-agent' });
 *
 * const result = await pool.executeInContainer(container.id, {
 *     command: 'bun',
 *     args: ['run', 'agent-script.ts'],
 * });
 *
 * await pool.release(container.id);
 * ```
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md
 */

// Types
export type {
    PoolConfig,
    ResourceLimits,
    NetworkConfig,
    PlacementStrategy,
    LocalPlacement,
    RemotePlacement,
    HybridPlacement,
    RemoteEndpoint,
    TLSConfig,
    ContainerState,
    PooledContainer,
    ContainerStats,
    AcquireOptions,
    ReleaseOptions,
    AffinityRule,
    InitRequest,
    ExecuteRequest,
    ExecuteResponse,
    HealthResponse,
    PoolEvent,
    PoolEventHandler,
    EndpointState,
    SchedulerMetrics,
    SecretsBackend,
    SecretsConfig,
    SecretsProvider,
    PoolStatus,
    ContainerConfig,
} from './types.js';

// Errors
export {
    PoolExhaustedError,
    ContainerTimeoutError,
    ContainerExecutionError,
    EndpointUnavailableError,
} from './types.js';

// Pool
export { ContainerPool, createContainerPool } from './pool.js';

// Scheduler
export { ContainerScheduler, createScheduler } from './scheduler.js';

// Client
export { ContainerClient, createContainerClient, type StreamEvent } from './client.js';

// Configuration
export {
    loadConfig,
    getDefaultConfig,
    validateConfig,
    formatBytes,
    formatDuration,
    PoolConfigSchema,
    ResourceLimitsSchema,
    NetworkConfigSchema,
    PlacementStrategySchema,
    RemoteEndpointSchema,
    SecretsConfigSchema,
    ContainerConfigSchema,
} from './config.js';

// Secrets
export {
    EnvSecretsProvider,
    VaultSecretsProvider,
    AWSSecretsProvider,
    createSecretsProvider,
    injectSecrets,
    clearSecrets,
} from './secrets.js';

// SSH Tunnel
export {
    SSHTunnel,
    TunnelManager,
    createSSHTunnel,
    parseSSHUrl,
    type SSHTunnelConfig,
    type TunnelConnection,
} from './remote/ssh-tunnel.js';

// Metrics
export {
    initializeMetrics,
    getMetrics,
    registerPoolMetrics,
    registerSchedulerMetrics,
    traceAcquire,
    traceCreate,
    traceExecution,
    traceHealthCheck,
    recordEndpointLatency,
    type ContainerMetrics,
} from './metrics.js';

// Executor (Orchestrator Integration)
export {
    ContainerExecutor,
    createContainerExecutor,
    getDefaultExecutorConfig,
    type ExecutorConfig,
    type AgentScript,
} from './executor.js';
