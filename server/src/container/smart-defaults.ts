/**
 * LiquidContainer Smart Defaults Generator
 *
 * Generates optimal configuration based on detected environment capabilities.
 * Implements the "zero-config" philosophy - system works out of the box.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import type { EnvironmentCapabilities } from './auto-config.js';

// ============================================================================
// Types
// ============================================================================

/**
 * SDK types supported by the system
 */
export type SDKType =
    | 'claude-agent-sdk'
    | 'openai-agents-sdk'
    | 'google-adk'
    | 'gemini-cli'
    | 'minimax'
    | 'raw';

/**
 * SDK preferences for task-based routing
 */
export interface SDKPreferences {
    /** Default SDK to use when no specific preference applies */
    default: SDKType;
    /** SDK for UI/component work */
    uiSpecialist: SDKType | 'auto';
    /** SDK for API/backend work */
    apiSpecialist: SDKType | 'auto';
    /** SDK for test writing */
    testSpecialist: SDKType | 'auto';
    /** SDK for security-sensitive tasks (always Claude) */
    securitySpecialist: SDKType;
    /** Optimization priority */
    costOptimization: 'quality' | 'balanced' | 'cost';
}

/**
 * Pool settings
 */
export interface PoolSettings {
    minIdle: number;
    maxTotal: number;
    idleTimeout: number;
    acquireTimeout: number;
    healthCheckInterval: number;
    image: string;
}

/**
 * Resource limits per container
 */
export interface ResourceLimits {
    memory: number;
    cpuQuota: number;
    pidsLimit: number;
    maxExecutionTime: number;
}

/**
 * Security settings
 */
export interface SecuritySettings {
    /** Enable container sandbox */
    sandboxEnabled: boolean;
    /** Use credential proxy for API key injection */
    credentialProxy: boolean;
    /** Allowed outbound domains */
    allowedDomains: string[];
    /** Network isolation mode */
    networkIsolation: 'none' | 'bridge' | 'host';
    /** Enable nested sandbox (Gemini CLI --sandbox) */
    nestedSandbox: boolean;
}

/**
 * Complete smart defaults
 */
export interface SmartDefaults {
    placement: 'local' | 'remote' | 'hybrid';
    pool: PoolSettings;
    resources: ResourceLimits;
    sdkPreferences: SDKPreferences;
    security: SecuritySettings;
    /** Reasoning for each choice */
    reasoning: Record<string, string>;
}

// ============================================================================
// Default Generation
// ============================================================================

/**
 * Generate smart defaults based on environment detection
 */
export function generateSmartDefaults(env: EnvironmentCapabilities): SmartDefaults {
    const reasoning: Record<string, string> = {};

    // Placement: Local if Docker available, otherwise suggest remote setup
    let placement: SmartDefaults['placement'];
    if (env.docker.available) {
        placement = 'local';
        reasoning.placement = 'Docker detected locally, using local containers for lowest latency';
    } else {
        placement = 'remote';
        reasoning.placement = 'Docker not available locally, remote deployment recommended';
    }

    // Pool: Size based on available memory
    const pool = generatePoolSettings(env, reasoning);

    // Resources: Based on system specs
    const resources = generateResourceLimits(env, reasoning);

    // SDK Preferences: Based on available API keys
    const sdkPreferences = generateSdkPreferences(env, reasoning);

    // Security: Strictest safe defaults
    const security = generateSecuritySettings(env, reasoning);

    return { placement, pool, resources, sdkPreferences, security, reasoning };
}

/**
 * Generate pool settings based on system resources
 */
function generatePoolSettings(
    env: EnvironmentCapabilities,
    reasoning: Record<string, string>
): PoolSettings {
    const availableMemoryGB = env.system.availableMemory / (1024 * 1024 * 1024);
    const cpuCores = env.system.cpuCores;

    // Calculate pool size based on memory (512MB per idle container)
    // But cap based on CPU cores too
    const memoryBasedMin = Math.max(1, Math.floor(availableMemoryGB / 2)); // 2GB per idle container buffer
    const cpuBasedMax = Math.floor(cpuCores * 2); // 2 containers per core max

    const minIdle = Math.min(3, memoryBasedMin);
    const maxTotal = Math.min(20, cpuBasedMax, Math.floor(availableMemoryGB * 2));

    // Adjust acquire timeout based on Docker platform
    // Docker Desktop on Mac is slower to start containers
    let acquireTimeout = 5000;
    if (env.docker.platform === 'docker-desktop' && env.system.platform === 'darwin') {
        acquireTimeout = 10000;
        reasoning.acquireTimeout = 'Docker Desktop on macOS has slower container startup, using 10s timeout';
    } else {
        reasoning.acquireTimeout = 'Using 5s timeout for fast container acquisition';
    }

    reasoning.pool = `Pool sized for ${availableMemoryGB.toFixed(1)}GB available memory and ${cpuCores} CPU cores`;

    return {
        minIdle,
        maxTotal,
        idleTimeout: 300000,       // 5 minutes
        acquireTimeout,
        healthCheckInterval: 30000, // 30 seconds
        image: getOptimalImage(env),
    };
}

/**
 * Get optimal container image for the platform
 */
function getOptimalImage(env: EnvironmentCapabilities): string {
    const baseImage = 'ghcr.io/liquidcrypto/liquid-container';

    // Use platform-specific tag if available
    if (env.system.arch === 'arm64') {
        return `${baseImage}:latest-arm64`;
    }

    return `${baseImage}:latest`;
}

/**
 * Generate resource limits based on system specs
 */
function generateResourceLimits(
    env: EnvironmentCapabilities,
    reasoning: Record<string, string>
): ResourceLimits {
    const totalMemoryGB = env.system.totalMemory / (1024 * 1024 * 1024);
    const availableMemoryGB = env.system.availableMemory / (1024 * 1024 * 1024);

    // Memory per container: max 25% of available or 1GB, whichever is smaller
    const maxMemoryGB = Math.min(availableMemoryGB / 4, 1);
    const memory = Math.floor(maxMemoryGB * 1024 * 1024 * 1024);

    // CPU quota: max 1 core or 25% of total, whichever is smaller
    const cpuQuota = Math.min(1.0, env.system.cpuCores / 4);

    reasoning.resources = `Resources: ${(memory / (1024 * 1024)).toFixed(0)}MB memory, ${(cpuQuota * 100).toFixed(0)}% CPU per container`;

    return {
        memory,
        cpuQuota,
        pidsLimit: 100,
        maxExecutionTime: 300000, // 5 minutes
    };
}

/**
 * Generate SDK preferences based on available API keys
 */
function generateSdkPreferences(
    env: EnvironmentCapabilities,
    reasoning: Record<string, string>
): SDKPreferences {
    const defaultSdk = determineDefaultSdk(env);
    const reasons: string[] = [];

    // UI Specialist: Claude is best for React/CSS work
    let uiSpecialist: SDKType | 'auto' = 'auto';
    if (env.apiKeys.anthropic) {
        uiSpecialist = 'claude-agent-sdk';
        reasons.push('Claude for UI work (best React/CSS reasoning)');
    }

    // API Specialist: Gemini CLI is fastest for backend work
    let apiSpecialist: SDKType | 'auto' = 'auto';
    if (env.cliTools.geminiCli && env.apiKeys.google) {
        apiSpecialist = 'gemini-cli';
        reasons.push('Gemini CLI for API work (fastest, most cost-effective)');
    } else if (env.apiKeys.anthropic) {
        apiSpecialist = 'claude-agent-sdk';
        reasons.push('Claude for API work (high quality)');
    }

    // Test Specialist: Fast iteration preferred
    let testSpecialist: SDKType | 'auto' = 'auto';
    if (env.cliTools.geminiCli && env.apiKeys.google) {
        testSpecialist = 'gemini-cli';
        reasons.push('Gemini CLI for tests (fast iteration)');
    } else if (env.apiKeys.openai) {
        testSpecialist = 'openai-agents-sdk';
        reasons.push('OpenAI for tests');
    }

    // Security: Always Claude (most careful reasoning)
    const securitySpecialist: SDKType = 'claude-agent-sdk';
    reasons.push('Claude for security (always, most careful reasoning)');

    // Cost optimization: Default to balanced
    let costOptimization: SDKPreferences['costOptimization'] = 'balanced';
    if (env.cliTools.geminiCli && env.apiKeys.google) {
        costOptimization = 'cost';
        reasons.push('Gemini CLI available, defaulting to cost optimization');
    }

    reasoning.sdkPreferences = reasons.join('; ');

    return {
        default: defaultSdk,
        uiSpecialist,
        apiSpecialist,
        testSpecialist,
        securitySpecialist,
        costOptimization,
    };
}

/**
 * Determine the best default SDK based on availability
 */
function determineDefaultSdk(env: EnvironmentCapabilities): SDKType {
    // Priority: Gemini CLI (fastest, cheapest) > Claude (best quality) > OpenAI > Google ADK
    if (env.cliTools.geminiCli && env.apiKeys.google) {
        return 'gemini-cli';
    }
    if (env.apiKeys.anthropic) {
        return 'claude-agent-sdk';
    }
    if (env.apiKeys.openai) {
        return 'openai-agents-sdk';
    }
    if (env.apiKeys.google) {
        return 'google-adk';
    }
    if (env.apiKeys.minimax) {
        return 'minimax';
    }
    return 'raw';
}

/**
 * Generate security settings
 */
function generateSecuritySettings(
    env: EnvironmentCapabilities,
    reasoning: Record<string, string>
): SecuritySettings {
    const allowedDomains = getDefaultAllowedDomains(env.apiKeys);
    const reasons: string[] = [];

    // Always enable sandbox and credential proxy when Docker is available
    const sandboxEnabled = env.docker.available;
    const credentialProxy = env.docker.available;

    if (sandboxEnabled) {
        reasons.push('Container sandbox enabled');
    }
    if (credentialProxy) {
        reasons.push('Credential proxy active (API keys never enter containers)');
    }

    // Enable nested sandbox if Gemini CLI is available
    const nestedSandbox = env.cliTools.geminiCli;
    if (nestedSandbox) {
        reasons.push('Nested sandbox available via Gemini CLI');
    }

    reasoning.security = reasons.join('; ');

    return {
        sandboxEnabled,
        credentialProxy,
        allowedDomains,
        networkIsolation: 'bridge',
        nestedSandbox,
    };
}

/**
 * Get default allowed domains based on detected API keys
 */
function getDefaultAllowedDomains(apiKeys: EnvironmentCapabilities['apiKeys']): string[] {
    const domains: string[] = [];

    // AI Provider APIs (only if key is available)
    if (apiKeys.anthropic) {
        domains.push('api.anthropic.com');
    }
    if (apiKeys.openai) {
        domains.push('api.openai.com');
    }
    if (apiKeys.google) {
        domains.push('generativelanguage.googleapis.com', 'aiplatform.googleapis.com');
    }
    if (apiKeys.minimax) {
        domains.push('api.minimax.chat');
    }

    // Always allow package registries
    domains.push('registry.npmjs.org', 'pypi.org', 'crates.io');

    // Common development resources
    domains.push('raw.githubusercontent.com', 'api.github.com');

    return domains;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * SDK cost structure for calculations
 */
export interface SDKCostInfo {
    /** Human readable cost range per task */
    perTask: string;
    /** Human readable monthly estimate */
    monthly: string;
    /** Cost per 1M input tokens (USD) */
    inputPer1M: number;
    /** Cost per 1M output tokens (USD) */
    outputPer1M: number;
}

/**
 * Estimated cost ranges per task by SDK
 */
export const SDK_COST_ESTIMATES: Record<SDKType, SDKCostInfo> = {
    'claude-agent-sdk': {
        perTask: '$0.05-0.50',
        monthly: '$50-500',
        inputPer1M: 3.00,   // Claude Sonnet pricing
        outputPer1M: 15.00,
    },
    'openai-agents-sdk': {
        perTask: '$0.02-0.20',
        monthly: '$20-200',
        inputPer1M: 2.50,   // GPT-4o pricing
        outputPer1M: 10.00,
    },
    'google-adk': {
        perTask: '$0.01-0.10',
        monthly: '$10-100',
        inputPer1M: 0.125,  // Gemini 1.5 Flash pricing
        outputPer1M: 0.375,
    },
    'gemini-cli': {
        perTask: '$0.001-0.01',
        monthly: '$1-10',
        inputPer1M: 0.075,  // Gemini CLI uses free tier / flash
        outputPer1M: 0.30,
    },
    'minimax': {
        perTask: '$0.01-0.05',
        monthly: '$10-50',
        inputPer1M: 0.10,
        outputPer1M: 0.40,
    },
    'raw': {
        perTask: '$0',
        monthly: '$0',
        inputPer1M: 0,
        outputPer1M: 0,
    },
};

/**
 * SDK capability structure
 */
export interface SDKCapabilityInfo {
    /** Speed rating */
    speed: string;
    /** Quality rating */
    quality: string;
    /** Cost rating */
    cost: string;
    /** Supports streaming responses */
    streaming: boolean;
    /** Supports tool/function calling */
    toolUse: boolean;
    /** Supports code execution */
    codeExecution: boolean;
    /** Maximum context window */
    maxContextTokens: number;
}

/**
 * SDK capability comparison
 */
export const SDK_CAPABILITIES: Record<SDKType, SDKCapabilityInfo> = {
    'claude-agent-sdk': {
        speed: 'Medium',
        quality: 'Excellent',
        cost: '$$',
        streaming: true,
        toolUse: true,
        codeExecution: true,
        maxContextTokens: 200000,
    },
    'openai-agents-sdk': {
        speed: 'Medium',
        quality: 'Very Good',
        cost: '$$',
        streaming: true,
        toolUse: true,
        codeExecution: true,
        maxContextTokens: 128000,
    },
    'google-adk': {
        speed: 'Fast',
        quality: 'Good',
        cost: '$',
        streaming: true,
        toolUse: true,
        codeExecution: true,
        maxContextTokens: 1000000,
    },
    'gemini-cli': {
        speed: 'Very Fast',
        quality: 'Good',
        cost: '$',
        streaming: true,
        toolUse: true,
        codeExecution: true,
        maxContextTokens: 1000000,
    },
    'minimax': {
        speed: 'Fast',
        quality: 'Good',
        cost: '$',
        streaming: true,
        toolUse: false,
        codeExecution: false,
        maxContextTokens: 128000,
    },
    'raw': {
        speed: 'N/A',
        quality: 'N/A',
        cost: 'N/A',
        streaming: false,
        toolUse: false,
        codeExecution: false,
        maxContextTokens: 0,
    },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Apply user overrides to smart defaults
 */
export function applyOverrides(
    defaults: SmartDefaults,
    overrides: Partial<SmartDefaults>
): SmartDefaults {
    return {
        placement: overrides.placement ?? defaults.placement,
        pool: { ...defaults.pool, ...overrides.pool },
        resources: { ...defaults.resources, ...overrides.resources },
        sdkPreferences: { ...defaults.sdkPreferences, ...overrides.sdkPreferences },
        security: { ...defaults.security, ...overrides.security },
        reasoning: { ...defaults.reasoning, ...overrides.reasoning },
    };
}

/**
 * Convert smart defaults to container config format
 */
export function toContainerConfig(defaults: SmartDefaults): Record<string, unknown> {
    return {
        placement: {
            type: defaults.placement,
            localWeight: defaults.placement === 'hybrid' ? 0.7 : 1.0,
        },
        pool: defaults.pool,
        resources: defaults.resources,
        network: {
            mode: defaults.security.networkIsolation,
            allowedHosts: defaults.security.allowedDomains,
            enableOutbound: true,
        },
        secrets: {
            backend: 'env',
            envPrefix: 'LIQUID_SECRET_',
        },
        telemetry: {
            enabled: false,
            serviceName: 'liquid-container',
        },
    };
}
