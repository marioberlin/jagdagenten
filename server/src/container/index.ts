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

// Auto-Configuration
export {
    detectEnvironment,
    detectDocker,
    detectSystem,
    detectApiKeys,
    detectCliTools,
    detectNetwork,
    isMinimumViable,
    getEnvironmentSummary,
    type EnvironmentCapabilities,
    type DockerCapabilities,
    type SystemCapabilities,
    type ApiKeyCapabilities,
    type CliToolCapabilities,
    type NetworkCapabilities,
} from './auto-config.js';

// Smart Defaults
export {
    generateSmartDefaults,
    applyOverrides,
    toContainerConfig,
    SDK_COST_ESTIMATES,
    SDK_CAPABILITIES,
    type SDKType,
    type SDKPreferences,
    type SmartDefaults,
    type SecuritySettings,
} from './smart-defaults.js';

// API Key Detection
export {
    detectAndValidateApiKeys,
    validateApiKey,
    getKeyManagementUrl,
    getProviderInfo,
    getSupportedProviders,
    hasMinimumApiKeys,
    getKeysSummary,
    type ApiKeyStatus,
    type KeySource,
} from './api-key-detection.js';

// SDK Intelligence
export {
    analyzeTask,
    selectBestSdk,
    estimateCost,
    compareCosts,
    getAvailableSdks,
    analyzeTaskBatch,
    type TaskType,
    type TaskComplexity,
    type TaskAnalysis,
    type CostEstimate,
    type SDKAlternative,
    type SubPRD,
    type Story,
} from './sdk-intelligence.js';

// Natural Language Config
export {
    parseNLConfig,
    parseNLConfigBatch,
    validateNLConfigChanges,
    summarizePreferences,
    type NLConfigRequest,
    type NLConfigResult,
} from './nl-config.js';

// SDK Runners
export {
    // Gemini CLI
    GeminiCliRunner,
    createGeminiCliRunner,
    isGeminiCliInstalled,
    getGeminiCliVersion,
    executeGeminiCli,
    DEFAULT_GEMINI_CLI_CONFIG,
    type GeminiCliConfig,
    type GeminiCliResult,
    type GeminiStreamEvent,
    // Claude
    ClaudeRunner,
    createClaudeRunner,
    isClaudeCliInstalled,
    getClaudeCliVersion,
    executeClaude,
    DEFAULT_CLAUDE_CONFIG,
    type ClaudeRunnerConfig,
    type ClaudeRunnerResult,
    type ClaudeStreamEvent,
} from './runners/index.js';

// Security Auto-Configuration
export {
    generateSecurityConfig,
    validateSecurityConfig,
    calculateSecurityScore,
    toDockerSecurityOpts,
    generateNetworkRules,
    getSecurityPreset,
    DEFAULT_ALLOWED_DOMAINS,
    AI_PROVIDER_DOMAINS,
    DROP_CAPABILITIES,
    type SecurityConfig,
    type CredentialProxyConfig,
    type NetworkSecurityConfig,
    type ContainerSecurityConfig,
    type NestedSandboxConfig,
    type AuditConfig,
    type SecurityIssue,
    type SecurityPreset,
} from './security-auto.js';

// Lifecycle Management
export {
    ensureContainersReady,
    isDockerAvailable,
    isContainerPoolReady,
    getContainerStatus,
    shutdownContainers,
    getInitializationError,
    // Auto-Recovery & Health Monitoring
    startHealthMonitor,
    stopHealthMonitor,
    recoverService,
    getServicesHealth,
    type ServiceHealthStatus,
    type HealthMonitorConfig,
} from './lifecycle.js';
