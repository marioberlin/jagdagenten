/**
 * Container Configuration Store
 *
 * Manages state for LiquidContainer deployment settings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type PlacementType = 'local' | 'remote' | 'hybrid';
export type SecretsBackend = 'env' | 'vault' | 'aws';
export type CloudProvider = 'hetzner' | 'digitalocean' | 'flyio' | 'railway' | 'aws' | 'gcp' | 'azure' | 'bare-metal' | 'custom';

/**
 * SDK types supported by the system
 */
export type SDKType =
    | 'claude-agent-sdk'
    | 'openai-agents-sdk'
    | 'google-adk'
    | 'gemini-cli'
    | 'minimax'
    | 'raw'
    | 'auto';

/**
 * SDK preferences for task-based routing
 */
export interface SDKPreferences {
    /** Default SDK to use when no specific preference applies */
    default: SDKType;
    /** SDK for UI/component work */
    uiSpecialist: SDKType;
    /** SDK for API/backend work */
    apiSpecialist: SDKType;
    /** SDK for test writing */
    testSpecialist: SDKType;
    /** SDK for security-sensitive tasks */
    securitySpecialist: SDKType;
    /** Optimization priority */
    costOptimization: 'quality' | 'balanced' | 'cost';
}

/**
 * Auto-configuration state
 */
export interface AutoConfigState {
    /** Whether auto-configuration is enabled */
    enabled: boolean;
    /** When the last detection was performed */
    lastDetected?: number;
    /** Detected Docker availability */
    dockerAvailable?: boolean;
    /** Detected Docker platform */
    dockerPlatform?: string;
    /** Detected API keys (provider -> present) */
    detectedApiKeys?: Record<string, boolean>;
    /** Detected CLI tools */
    detectedCliTools?: Record<string, boolean>;
    /** System memory in bytes */
    systemMemory?: number;
    /** CPU cores */
    cpuCores?: number;
}

export interface RemoteEndpoint {
    id: string;
    name: string;
    url: string;
    provider: CloudProvider;
    maxContainers: number;
    weight: number;
    labels: Record<string, string>;
    enabled: boolean;
    sshKey?: string;
    tlsEnabled?: boolean;
    healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
    lastChecked?: number;
}

export interface ResourceLimits {
    memory: number;       // bytes
    cpuQuota: number;     // 0-1 (e.g., 0.5 = 50% of one core)
    pidsLimit: number;
    maxExecutionTime: number; // ms
}

export interface PoolSettings {
    minIdle: number;
    maxTotal: number;
    idleTimeout: number;     // ms
    acquireTimeout: number;  // ms
    healthCheckInterval: number; // ms
    image: string;
}

export interface NetworkSettings {
    mode: 'none' | 'bridge' | 'host';
    allowedHosts: string[];
    enableOutbound: boolean;
}

export interface SecretsSettings {
    backend: SecretsBackend;
    envPrefix: string;
    vaultAddress?: string;
    vaultPath?: string;
    awsRegion?: string;
    awsSecretPrefix?: string;
}

export interface ContainerConfig {
    placement: {
        type: PlacementType;
        localWeight: number;
    };
    pool: PoolSettings;
    resources: ResourceLimits;
    network: NetworkSettings;
    secrets: SecretsSettings;
    endpoints: RemoteEndpoint[];
    telemetry: {
        enabled: boolean;
        endpoint?: string;
        serviceName: string;
    };
    /** SDK preferences for task-based routing */
    sdkPreferences: SDKPreferences;
    /** Auto-configuration state */
    autoConfig: AutoConfigState;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultSdkPreferences: SDKPreferences = {
    default: 'auto',
    uiSpecialist: 'auto',
    apiSpecialist: 'auto',
    testSpecialist: 'auto',
    securitySpecialist: 'claude-agent-sdk', // Always Claude for security
    costOptimization: 'balanced',
};

const defaultAutoConfig: AutoConfigState = {
    enabled: true, // Auto-config enabled by default
};

const defaultConfig: ContainerConfig = {
    placement: {
        type: 'local',
        localWeight: 1.0,
    },
    pool: {
        minIdle: 3,
        maxTotal: 20,
        idleTimeout: 300000,      // 5 minutes
        acquireTimeout: 5000,     // 5 seconds
        healthCheckInterval: 30000, // 30 seconds
        image: 'ghcr.io/liquidcrypto/liquid-container:latest',
    },
    resources: {
        memory: 536870912,        // 512 MB
        cpuQuota: 0.5,
        pidsLimit: 100,
        maxExecutionTime: 60000,  // 1 minute
    },
    network: {
        mode: 'bridge',
        allowedHosts: [],
        enableOutbound: false,
    },
    secrets: {
        backend: 'env',
        envPrefix: 'LIQUID_SECRET_',
    },
    endpoints: [],
    telemetry: {
        enabled: false,
        serviceName: 'liquid-container',
    },
    sdkPreferences: defaultSdkPreferences,
    autoConfig: defaultAutoConfig,
};

// ============================================================================
// Provider Presets
// ============================================================================

export interface ProviderPreset {
    id: CloudProvider;
    name: string;
    description: string;
    pricing: string;
    setupCommand?: string;
    defaultUrl: string;
    features: string[];
    recommended?: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
    {
        id: 'hetzner',
        name: 'Hetzner Cloud',
        description: 'Best value for CPU-intensive workloads in Europe',
        pricing: 'From €3.29/mo (CX22: 2 vCPU, 4GB)',
        defaultUrl: 'ssh://deploy@',
        features: ['Excellent price/performance', 'EU data centers', 'SSH key auth', 'Fast SSD'],
        recommended: true,
    },
    {
        id: 'digitalocean',
        name: 'DigitalOcean',
        description: 'Simple, developer-friendly cloud platform',
        pricing: 'From $6/mo (1 vCPU, 1GB)',
        defaultUrl: 'ssh://root@',
        features: ['Easy setup', 'Good documentation', 'Worldwide locations', 'Managed databases'],
    },
    {
        id: 'flyio',
        name: 'Fly.io',
        description: 'Edge deployment with automatic scaling',
        pricing: 'From $1.94/mo per shared CPU',
        defaultUrl: 'tcp://',
        features: ['Global edge network', 'Auto-scaling', 'Built-in TLS', 'Firecracker VMs'],
    },
    {
        id: 'railway',
        name: 'Railway',
        description: 'Deploy anything with zero configuration',
        pricing: 'Usage-based, ~$5-20/mo typical',
        defaultUrl: 'tcp://',
        features: ['One-click deploy', 'Auto-scaling', 'Built-in CI/CD', 'Sleep on idle'],
    },
    {
        id: 'aws',
        name: 'AWS (EC2/ECS)',
        description: 'Enterprise-grade with comprehensive services',
        pricing: 'From $0.0116/hr (t3.micro)',
        defaultUrl: 'tcp://',
        features: ['Enterprise SLAs', 'Global infrastructure', 'IAM integration', 'Spot instances'],
    },
    {
        id: 'gcp',
        name: 'Google Cloud',
        description: 'Best-in-class networking and ML integration',
        pricing: 'From $0.0075/hr (e2-micro)',
        defaultUrl: 'tcp://',
        features: ['Global network', 'Preemptible VMs', 'Cloud Run', 'ML integration'],
    },
    {
        id: 'azure',
        name: 'Microsoft Azure',
        description: 'Enterprise integration with Microsoft ecosystem',
        pricing: 'From $0.0052/hr (B1s)',
        defaultUrl: 'tcp://',
        features: ['Enterprise compliance', 'Hybrid cloud', 'Active Directory', 'Reserved pricing'],
    },
    {
        id: 'bare-metal',
        name: 'Bare Metal / VPS',
        description: 'Any server with Docker and SSH access',
        pricing: 'Varies by provider',
        defaultUrl: 'ssh://deploy@',
        features: ['Full control', 'Custom hardware', 'No hypervisor overhead', 'Dedicated resources'],
    },
    {
        id: 'custom',
        name: 'Custom Endpoint',
        description: 'Manual Docker daemon configuration',
        pricing: 'N/A',
        defaultUrl: 'tcp://',
        features: ['Full flexibility', 'Any Docker host', 'TLS support', 'Custom networking'],
    },
];

// ============================================================================
// Store
// ============================================================================

interface ContainerStore {
    config: ContainerConfig;

    // Placement
    setPlacementType: (type: PlacementType) => void;
    setLocalWeight: (weight: number) => void;

    // Pool
    setPoolSetting: <K extends keyof PoolSettings>(key: K, value: PoolSettings[K]) => void;

    // Resources
    setResourceLimit: <K extends keyof ResourceLimits>(key: K, value: ResourceLimits[K]) => void;

    // Network
    setNetworkMode: (mode: NetworkSettings['mode']) => void;
    setAllowedHosts: (hosts: string[]) => void;
    setEnableOutbound: (enabled: boolean) => void;

    // Secrets
    setSecretsBackend: (backend: SecretsBackend) => void;
    setSecretsConfig: (config: Partial<SecretsSettings>) => void;

    // Endpoints
    addEndpoint: (endpoint: RemoteEndpoint) => void;
    updateEndpoint: (id: string, updates: Partial<RemoteEndpoint>) => void;
    removeEndpoint: (id: string) => void;
    toggleEndpoint: (id: string) => void;
    reorderEndpoints: (fromIndex: number, toIndex: number) => void;

    // Telemetry
    setTelemetryEnabled: (enabled: boolean) => void;
    setTelemetryConfig: (config: Partial<ContainerConfig['telemetry']>) => void;

    // SDK Preferences
    setSdkPreference: <K extends keyof SDKPreferences>(key: K, value: SDKPreferences[K]) => void;
    setAllSdkPreferences: (prefs: Partial<SDKPreferences>) => void;

    // Auto-Configuration
    setAutoConfigEnabled: (enabled: boolean) => void;
    updateAutoConfigState: (state: Partial<AutoConfigState>) => void;
    applySmartDefaults: (defaults: Partial<ContainerConfig>) => void;

    // Bulk
    importConfig: (config: Partial<ContainerConfig>) => void;
    resetToDefaults: () => void;
    exportConfig: () => ContainerConfig;
}

export const useContainerStore = create<ContainerStore>()(
    persist(
        (set, get): ContainerStore => ({
            config: defaultConfig,

            // Placement
            setPlacementType: (type: PlacementType) => set((state: ContainerStore) => ({
                config: { ...state.config, placement: { ...state.config.placement, type } }
            })),
            setLocalWeight: (localWeight: number) => set((state: ContainerStore) => ({
                config: { ...state.config, placement: { ...state.config.placement, localWeight } }
            })),

            // Pool
            setPoolSetting: <K extends keyof PoolSettings>(key: K, value: PoolSettings[K]) => set((state: ContainerStore) => ({
                config: { ...state.config, pool: { ...state.config.pool, [key]: value } }
            })),

            // Resources
            setResourceLimit: <K extends keyof ResourceLimits>(key: K, value: ResourceLimits[K]) => set((state: ContainerStore) => ({
                config: { ...state.config, resources: { ...state.config.resources, [key]: value } }
            })),

            // Network
            setNetworkMode: (mode: NetworkSettings['mode']) => set((state: ContainerStore) => ({
                config: { ...state.config, network: { ...state.config.network, mode } }
            })),
            setAllowedHosts: (allowedHosts: string[]) => set((state: ContainerStore) => ({
                config: { ...state.config, network: { ...state.config.network, allowedHosts } }
            })),
            setEnableOutbound: (enableOutbound: boolean) => set((state: ContainerStore) => ({
                config: { ...state.config, network: { ...state.config.network, enableOutbound } }
            })),

            // Secrets
            setSecretsBackend: (backend: SecretsBackend) => set((state: ContainerStore) => ({
                config: { ...state.config, secrets: { ...state.config.secrets, backend } }
            })),
            setSecretsConfig: (secretsConfig: Partial<SecretsSettings>) => set((state: ContainerStore) => ({
                config: { ...state.config, secrets: { ...state.config.secrets, ...secretsConfig } }
            })),

            // Endpoints
            addEndpoint: (endpoint: RemoteEndpoint) => set((state: ContainerStore) => ({
                config: { ...state.config, endpoints: [...state.config.endpoints, endpoint] }
            })),
            updateEndpoint: (id: string, updates: Partial<RemoteEndpoint>) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    endpoints: state.config.endpoints.map((ep: RemoteEndpoint) =>
                        ep.id === id ? { ...ep, ...updates } : ep
                    )
                }
            })),
            removeEndpoint: (id: string) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    endpoints: state.config.endpoints.filter((ep: RemoteEndpoint) => ep.id !== id)
                }
            })),
            toggleEndpoint: (id: string) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    endpoints: state.config.endpoints.map((ep: RemoteEndpoint) =>
                        ep.id === id ? { ...ep, enabled: !ep.enabled } : ep
                    )
                }
            })),
            reorderEndpoints: (fromIndex: number, toIndex: number) => set((state: ContainerStore) => {
                const endpoints = [...state.config.endpoints];
                const [removed] = endpoints.splice(fromIndex, 1);
                endpoints.splice(toIndex, 0, removed);
                return { config: { ...state.config, endpoints } };
            }),

            // Telemetry
            setTelemetryEnabled: (enabled: boolean) => set((state: ContainerStore) => ({
                config: { ...state.config, telemetry: { ...state.config.telemetry, enabled } }
            })),
            setTelemetryConfig: (telemetryConfig: Partial<ContainerConfig['telemetry']>) => set((state: ContainerStore) => ({
                config: { ...state.config, telemetry: { ...state.config.telemetry, ...telemetryConfig } }
            })),

            // SDK Preferences
            setSdkPreference: <K extends keyof SDKPreferences>(key: K, value: SDKPreferences[K]) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    sdkPreferences: { ...state.config.sdkPreferences, [key]: value }
                }
            })),
            setAllSdkPreferences: (prefs: Partial<SDKPreferences>) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    sdkPreferences: { ...state.config.sdkPreferences, ...prefs }
                }
            })),

            // Auto-Configuration
            setAutoConfigEnabled: (enabled: boolean) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    autoConfig: { ...state.config.autoConfig, enabled }
                }
            })),
            updateAutoConfigState: (autoConfigUpdate: Partial<AutoConfigState>) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    autoConfig: { ...state.config.autoConfig, ...autoConfigUpdate }
                }
            })),
            applySmartDefaults: (defaults: Partial<ContainerConfig>) => set((state: ContainerStore) => ({
                config: {
                    ...state.config,
                    ...defaults,
                    // Preserve auto-config state
                    autoConfig: {
                        ...state.config.autoConfig,
                        ...defaults.autoConfig,
                        lastDetected: Date.now(),
                    },
                }
            })),

            // Bulk
            importConfig: (newConfig: Partial<ContainerConfig>) => set((state: ContainerStore) => ({
                config: { ...state.config, ...newConfig }
            })),
            resetToDefaults: () => set({ config: defaultConfig }),
            exportConfig: () => get().config,
        }),
        {
            name: 'liquid-container-config',
            version: 1,
        }
    )
);

// ============================================================================
// Utility Functions
// ============================================================================

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function parseBytes(str: string): number {
    const match = str.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024,
    };
    return value * (multipliers[unit] || 1);
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

export function parseDuration(str: string): number {
    const match = str.match(/^([\d.]+)\s*(ms|s|m|h)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
        'ms': 1,
        's': 1000,
        'm': 60000,
        'h': 3600000,
    };
    return value * (multipliers[unit] || 1);
}

export function generateEndpointId(): string {
    return `endpoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
