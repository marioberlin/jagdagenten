# LiquidContainer Complete Implementation Plan

> **Status: ✅ IMPLEMENTED (January 2026)**
>
> This plan has been fully implemented. All 7 phases are complete. See `CLAUDE.md` Phase 8: SDK Intelligence System for documentation of the implemented features.

## Vision: Zero-Config Intelligence with Full Control

**Philosophy:** The system should work perfectly out of the box with zero configuration, automatically detecting the best settings for the user's environment. Advanced users can override everything, but beginners should never see a settings panel.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER EXPERIENCE TIERS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Tier 1: "Just Works" (Default)                                             │
│  ├── Auto-detect Docker availability                                        │
│  ├── Auto-detect API keys from environment                                  │
│  ├── Auto-select best SDK based on task type                               │
│  ├── Auto-configure resources based on system specs                        │
│  └── User never sees settings, everything is inferred                      │
│                                                                              │
│  Tier 2: "Guided Setup" (On Demand)                                         │
│  ├── Setup wizard for first-time users                                     │
│  ├── One-click provider presets                                            │
│  ├── Natural language configuration ("use Claude for UI, Gemini for API") │
│  └── Smart recommendations with explanations                               │
│                                                                              │
│  Tier 3: "Full Control" (Expert Mode)                                       │
│  ├── All settings exposed in UI                                            │
│  ├── JSON import/export                                                    │
│  ├── Environment variable overrides                                        │
│  └── Per-project configuration files                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Auto-Configuration System](#1-auto-configuration-system)
2. [SDK Profile Intelligence](#2-sdk-profile-intelligence)
3. [Security Model](#3-security-model)
4. [User Interface Design](#4-user-interface-design)
5. [Backend Architecture](#5-backend-architecture)
6. [Implementation Phases](#6-implementation-phases)
7. [File Structure](#7-file-structure)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Auto-Configuration System

### 1.1 Environment Detection Engine

The system automatically detects and configures itself based on the user's environment:

```typescript
// server/src/container/auto-config.ts

export interface EnvironmentCapabilities {
    // Docker Detection
    docker: {
        available: boolean;
        version?: string;
        composeAvailable: boolean;
        buildxAvailable: boolean;
        rootless: boolean;
        platform: 'docker-desktop' | 'docker-ce' | 'podman' | 'orbstack' | 'colima' | null;
    };

    // System Resources
    system: {
        platform: 'darwin' | 'linux' | 'win32';
        arch: 'x64' | 'arm64';
        totalMemory: number;      // bytes
        availableMemory: number;
        cpuCores: number;
        cpuModel: string;
    };

    // API Keys (detected from environment)
    apiKeys: {
        anthropic: boolean;      // ANTHROPIC_API_KEY
        openai: boolean;         // OPENAI_API_KEY
        google: boolean;         // GOOGLE_API_KEY or GEMINI_API_KEY
        minimax: boolean;        // MINIMAX_API_KEY
    };

    // CLI Tools
    cliTools: {
        geminiCli: boolean;      // Gemini CLI installed
        claudeCode: boolean;     // Claude Code CLI installed
        git: boolean;
        bun: boolean;
        node: boolean;
    };

    // Network
    network: {
        proxyConfigured: boolean;
        canReachAnthropicApi: boolean;
        canReachOpenAiApi: boolean;
        canReachGoogleApi: boolean;
    };
}

export async function detectEnvironment(): Promise<EnvironmentCapabilities> {
    const [docker, system, apiKeys, cliTools, network] = await Promise.all([
        detectDocker(),
        detectSystem(),
        detectApiKeys(),
        detectCliTools(),
        detectNetwork(),
    ]);

    return { docker, system, apiKeys, cliTools, network };
}
```

### 1.2 Smart Defaults Generator

Based on detected environment, generate optimal configuration:

```typescript
// server/src/container/smart-defaults.ts

export interface SmartDefaults {
    placement: PlacementType;
    pool: PoolSettings;
    resources: ResourceLimits;
    sdkPreferences: SDKPreferences;
    security: SecuritySettings;
}

export function generateSmartDefaults(env: EnvironmentCapabilities): SmartDefaults {
    // Placement: Local if Docker available, otherwise suggest setup
    const placement = env.docker.available ? 'local' : 'remote';

    // Pool: Size based on available memory
    const pool = {
        minIdle: Math.min(3, Math.floor(env.system.availableMemory / (512 * 1024 * 1024))),
        maxTotal: Math.min(20, Math.floor(env.system.availableMemory / (256 * 1024 * 1024))),
        idleTimeout: 300000,
        acquireTimeout: env.docker.platform === 'docker-desktop' ? 10000 : 5000,
        healthCheckInterval: 30000,
        image: getOptimalImage(env),
    };

    // Resources: Based on system specs
    const resources = {
        memory: Math.min(
            env.system.availableMemory / 4,  // Max 25% of available
            1024 * 1024 * 1024               // Cap at 1GB per container
        ),
        cpuQuota: Math.min(1.0, env.system.cpuCores / 4),  // Max 1 core or 25%
        pidsLimit: 100,
        maxExecutionTime: 300000,  // 5 minutes
    };

    // SDK Preferences: Based on available API keys
    const sdkPreferences = {
        // Priority order based on what's available
        defaultSdk: determineDefaultSdk(env),
        uiSpecialist: env.apiKeys.anthropic ? 'claude-agent-sdk' : 'gemini-cli',
        apiSpecialist: env.cliTools.geminiCli ? 'gemini-cli' : 'claude-agent-sdk',
        testSpecialist: env.apiKeys.openai ? 'openai-agents-sdk' : 'gemini-cli',
        securitySpecialist: 'claude-agent-sdk',  // Always Claude for security
    };

    // Security: Strictest safe defaults
    const security = {
        sandboxEnabled: true,
        credentialProxy: env.docker.available,
        allowedDomains: getDefaultAllowedDomains(env.apiKeys),
        networkIsolation: 'bridge',
    };

    return { placement, pool, resources, sdkPreferences, security };
}

function determineDefaultSdk(env: EnvironmentCapabilities): SDKType {
    // Priority: Gemini CLI (fastest) > Claude (best quality) > OpenAI
    if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
    if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    if (env.apiKeys.openai) return 'openai-agents-sdk';
    if (env.apiKeys.google) return 'google-adk';
    return 'raw';  // Fallback to direct execution
}

function getDefaultAllowedDomains(apiKeys: EnvironmentCapabilities['apiKeys']): string[] {
    const domains: string[] = [];
    if (apiKeys.anthropic) domains.push('api.anthropic.com');
    if (apiKeys.openai) domains.push('api.openai.com');
    if (apiKeys.google) domains.push('generativelanguage.googleapis.com', 'aiplatform.googleapis.com');
    if (apiKeys.minimax) domains.push('api.minimax.chat');
    // Always allow package registries
    domains.push('registry.npmjs.org', 'pypi.org');
    return domains;
}
```

### 1.3 One-Time Setup Flow

For users without Docker or API keys:

```typescript
// src/components/settings/GlassContainerSetupWizard.tsx

interface SetupStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'checking' | 'success' | 'warning' | 'error';
    action?: () => Promise<void>;
    skipable?: boolean;
}

const SETUP_STEPS: SetupStep[] = [
    {
        id: 'docker',
        title: 'Docker Runtime',
        description: 'Container execution environment',
        // Auto-detected, shows install instructions if missing
    },
    {
        id: 'api-keys',
        title: 'AI Provider Keys',
        description: 'At least one AI provider is required',
        // Detects from env, offers input form if missing
    },
    {
        id: 'cli-tools',
        title: 'CLI Tools (Optional)',
        description: 'Gemini CLI for faster execution',
        skipable: true,
        // Offers one-click install
    },
    {
        id: 'verify',
        title: 'Verify Setup',
        description: 'Run test container to confirm everything works',
        // Runs a quick test
    },
];
```

---

## 2. SDK Profile Intelligence

### 2.1 Task-Based SDK Selection

The system automatically selects the best SDK for each task type:

```typescript
// server/src/container/sdk-intelligence.ts

export interface TaskAnalysis {
    type: 'ui' | 'api' | 'test' | 'security' | 'refactor' | 'docs' | 'general';
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTurns: number;
    estimatedCost: { low: number; high: number };
    filePatterns: string[];
    suggestedSdk: SDKType;
    reasoning: string;
}

export function analyzeTask(
    subPrd: SubPRD,
    env: EnvironmentCapabilities
): TaskAnalysis {
    const stories = subPrd.stories;

    // Analyze task characteristics
    const filePatterns = stories.flatMap(s => s.affectedFiles);
    const isUiTask = filePatterns.some(f =>
        f.includes('/components/') ||
        f.endsWith('.tsx') ||
        f.endsWith('.css')
    );
    const isApiTask = filePatterns.some(f =>
        f.includes('/server/') ||
        f.includes('/api/')
    );
    const isTestTask = filePatterns.some(f =>
        f.includes('.test.') ||
        f.includes('/tests/')
    );
    const isSecurityTask = stories.some(s =>
        s.title.toLowerCase().includes('security') ||
        s.title.toLowerCase().includes('auth')
    );

    // Determine task type
    let type: TaskAnalysis['type'] = 'general';
    if (isSecurityTask) type = 'security';
    else if (isTestTask) type = 'test';
    else if (isUiTask) type = 'ui';
    else if (isApiTask) type = 'api';

    // Estimate complexity
    const totalFiles = filePatterns.length;
    const totalCriteria = stories.reduce((sum, s) => sum + s.acceptanceCriteria.length, 0);
    let complexity: TaskAnalysis['complexity'] = 'simple';
    if (totalFiles > 5 || totalCriteria > 10) complexity = 'complex';
    else if (totalFiles > 2 || totalCriteria > 5) complexity = 'moderate';

    // Select SDK based on task type and availability
    const suggestedSdk = selectBestSdk(type, complexity, env);

    // Estimate cost
    const estimatedTurns = {
        simple: 10,
        moderate: 25,
        complex: 50,
    }[complexity];

    return {
        type,
        complexity,
        estimatedTurns,
        estimatedCost: estimateCost(suggestedSdk, estimatedTurns),
        filePatterns,
        suggestedSdk,
        reasoning: generateReasoning(type, complexity, suggestedSdk),
    };
}

function selectBestSdk(
    type: TaskAnalysis['type'],
    complexity: TaskAnalysis['complexity'],
    env: EnvironmentCapabilities
): SDKType {
    // Security tasks: Always Claude (most careful reasoning)
    if (type === 'security' && env.apiKeys.anthropic) {
        return 'claude-agent-sdk';
    }

    // Simple tasks: Gemini CLI (fastest, cheapest)
    if (complexity === 'simple' && env.cliTools.geminiCli && env.apiKeys.google) {
        return 'gemini-cli';
    }

    // UI tasks: Claude (best at React/CSS)
    if (type === 'ui' && env.apiKeys.anthropic) {
        return 'claude-agent-sdk';
    }

    // Test tasks: OpenAI or Gemini (fast iteration)
    if (type === 'test') {
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
        if (env.apiKeys.openai) return 'openai-agents-sdk';
    }

    // API tasks: Gemini CLI or Claude
    if (type === 'api') {
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
        if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    }

    // Default: Best available
    if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
    if (env.apiKeys.openai) return 'openai-agents-sdk';
    if (env.apiKeys.google) return 'google-adk';

    return 'raw';
}
```

### 2.2 Natural Language Configuration

Allow users to configure SDK preferences naturally:

```typescript
// server/src/container/nl-config.ts

export interface NLConfigRequest {
    input: string;  // e.g., "use Claude for UI work, Gemini for everything else"
}

export interface NLConfigResult {
    understood: boolean;
    interpretation: string;
    changes: Partial<SDKPreferences>;
    confidence: number;
}

// Patterns for natural language configuration
const NL_PATTERNS = [
    {
        pattern: /use\s+(claude|gemini|openai|gpt)\s+for\s+(ui|api|test|security|everything)/gi,
        handler: (match: RegExpMatchArray) => ({
            sdk: mapProviderToSdk(match[1]),
            domain: match[2].toLowerCase(),
        }),
    },
    {
        pattern: /prefer\s+(speed|quality|cost)/gi,
        handler: (match: RegExpMatchArray) => ({
            preference: match[1].toLowerCase(),
        }),
    },
    {
        pattern: /(enable|disable)\s+sandbox/gi,
        handler: (match: RegExpMatchArray) => ({
            sandbox: match[1].toLowerCase() === 'enable',
        }),
    },
];

export function parseNaturalLanguageConfig(request: NLConfigRequest): NLConfigResult {
    const input = request.input.toLowerCase();
    const changes: Partial<SDKPreferences> = {};
    let understood = false;
    let interpretation = '';

    for (const { pattern, handler } of NL_PATTERNS) {
        const matches = input.matchAll(pattern);
        for (const match of matches) {
            const result = handler(match);
            // Apply result to changes
            understood = true;
        }
    }

    return {
        understood,
        interpretation,
        changes,
        confidence: understood ? 0.9 : 0.0,
    };
}
```

---

## 3. Security Model

### 3.1 Defense in Depth Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Credential Proxy (Automatic)                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  • API keys NEVER enter containers                                      ││
│  │  • Proxy injects credentials after domain validation                    ││
│  │  • All requests logged for audit                                        ││
│  │  • Automatic for all SDK types                                          ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Layer 2: Network Isolation (Automatic)                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  • Default: Only AI provider APIs allowed                               ││
│  │  • Package registries (npm, pypi) pre-approved                          ││
│  │  • Custom domains require explicit allowlist                            ││
│  │  • All other outbound blocked                                           ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Layer 3: Container Sandbox (Automatic)                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  • Read-only project mount (overlay for writes)                         ││
│  │  • Non-root user inside container                                       ││
│  │  • Resource limits (CPU, memory, PIDs)                                  ││
│  │  • Execution timeout                                                    ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Layer 4: Nested SDK Sandbox (When Available)                                │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  • Gemini CLI: --sandbox flag (Docker-in-Docker)                        ││
│  │  • Claude Code: sandbox-runtime (OS-level)                              ││
│  │  • Double isolation for maximum security                                ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Automatic Security Configuration

```typescript
// server/src/container/security-auto.ts

export interface SecurityConfig {
    credentialProxy: {
        enabled: boolean;
        socketPath: string;
        allowedDomains: string[];
        auditLog: boolean;
    };
    network: {
        mode: 'none' | 'bridge' | 'host';
        egressPolicy: 'block-all' | 'allow-list' | 'allow-all';
        allowedDomains: string[];
    };
    container: {
        readOnlyRoot: boolean;
        noNewPrivileges: boolean;
        dropCapabilities: string[];
        seccompProfile: 'default' | 'unconfined' | string;
        user: string;
    };
    nestedSandbox: {
        enabled: boolean;
        type: 'gemini-cli' | 'claude-sandbox' | 'none';
    };
}

export function generateSecurityConfig(
    env: EnvironmentCapabilities,
    userPreferences?: Partial<SecurityConfig>
): SecurityConfig {
    // Start with strictest defaults
    const config: SecurityConfig = {
        credentialProxy: {
            enabled: true,  // Always on
            socketPath: '/var/run/liquid-proxy.sock',
            allowedDomains: getDefaultAllowedDomains(env.apiKeys),
            auditLog: true,
        },
        network: {
            mode: 'bridge',
            egressPolicy: 'allow-list',
            allowedDomains: getDefaultAllowedDomains(env.apiKeys),
        },
        container: {
            readOnlyRoot: true,
            noNewPrivileges: true,
            dropCapabilities: ['ALL'],
            seccompProfile: 'default',
            user: 'agent:agent',  // Non-root
        },
        nestedSandbox: {
            enabled: env.cliTools.geminiCli,  // Auto-enable if Gemini CLI available
            type: env.cliTools.geminiCli ? 'gemini-cli' : 'none',
        },
    };

    // Merge user preferences (can only relax security with explicit override)
    if (userPreferences) {
        // Validate that user isn't accidentally weakening security
        if (userPreferences.network?.egressPolicy === 'allow-all') {
            console.warn('Warning: allow-all egress policy is insecure');
        }
    }

    return config;
}
```

### 3.3 API Key Auto-Detection and Validation

```typescript
// server/src/container/api-key-detection.ts

export interface ApiKeyStatus {
    provider: string;
    detected: boolean;
    source: 'env' | 'file' | 'keychain' | 'manual';
    valid: boolean;
    lastValidated?: number;
    quotaRemaining?: number;
}

export async function detectAndValidateApiKeys(): Promise<Record<string, ApiKeyStatus>> {
    const results: Record<string, ApiKeyStatus> = {};

    // Check environment variables
    const envKeys = {
        anthropic: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'],
        openai: ['OPENAI_API_KEY'],
        google: ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'],
        minimax: ['MINIMAX_API_KEY', 'MINIMAX_GROUP_ID'],
    };

    for (const [provider, envVars] of Object.entries(envKeys)) {
        for (const envVar of envVars) {
            const value = process.env[envVar];
            if (value) {
                results[provider] = {
                    provider,
                    detected: true,
                    source: 'env',
                    valid: await validateApiKey(provider, value),
                    lastValidated: Date.now(),
                };
                break;
            }
        }

        // If not in env, check common config files
        if (!results[provider]) {
            const fileValue = await checkConfigFiles(provider);
            if (fileValue) {
                results[provider] = {
                    provider,
                    detected: true,
                    source: 'file',
                    valid: await validateApiKey(provider, fileValue),
                    lastValidated: Date.now(),
                };
            }
        }

        // Default: not detected
        if (!results[provider]) {
            results[provider] = {
                provider,
                detected: false,
                source: 'manual',
                valid: false,
            };
        }
    }

    return results;
}

async function checkConfigFiles(provider: string): Promise<string | null> {
    const configPaths: Record<string, string[]> = {
        anthropic: [
            '~/.anthropic/api_key',
            '~/.config/anthropic/credentials',
        ],
        google: [
            '~/.config/gcloud/application_default_credentials.json',
        ],
        openai: [
            '~/.openai/credentials',
        ],
    };

    const paths = configPaths[provider] || [];
    for (const path of paths) {
        try {
            const content = await readFile(expandPath(path), 'utf-8');
            // Parse based on file type
            if (path.endsWith('.json')) {
                const json = JSON.parse(content);
                return json.api_key || json.client_id;
            }
            return content.trim();
        } catch {
            // File doesn't exist or isn't readable
        }
    }
    return null;
}
```

---

## 4. User Interface Design

### 4.1 Settings Panel Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SETTINGS PANEL STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Main Settings (GlassSettingsPanel)                                          │
│  ├── General                                                                │
│  ├── Appearance                                                             │
│  ├── AI Agents  ← NEW TAB                                                   │
│  │   ├── Quick Setup (Wizard)                                              │
│  │   ├── SDK Preferences                                                    │
│  │   ├── API Keys                                                           │
│  │   └── Advanced (Containers)                                              │
│  ├── Security                                                               │
│  └── About                                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 New Components

#### GlassAgentSettings (New Main Component)

```tsx
// src/components/settings/GlassAgentSettings.tsx

interface GlassAgentSettingsProps {
    onClose?: () => void;
}

export const GlassAgentSettings: React.FC<GlassAgentSettingsProps> = () => {
    const [activeTab, setActiveTab] = useState<'quick' | 'sdk' | 'keys' | 'advanced'>('quick');
    const [env, setEnv] = useState<EnvironmentCapabilities | null>(null);
    const [loading, setLoading] = useState(true);

    // Auto-detect environment on mount
    useEffect(() => {
        detectEnvironment().then(setEnv).finally(() => setLoading(false));
    }, []);

    // Determine if setup is complete
    const setupComplete = useMemo(() => {
        if (!env) return false;
        return (
            env.docker.available &&
            (env.apiKeys.anthropic || env.apiKeys.google || env.apiKeys.openai)
        );
    }, [env]);

    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <AgentStatusOverview env={env} loading={loading} />

            {/* Tab Navigation */}
            <TabNavigation
                tabs={[
                    { id: 'quick', label: 'Quick Setup', icon: Zap, badge: !setupComplete ? '!' : undefined },
                    { id: 'sdk', label: 'AI Models', icon: Brain },
                    { id: 'keys', label: 'API Keys', icon: Key },
                    { id: 'advanced', label: 'Advanced', icon: Settings },
                ]}
                active={activeTab}
                onChange={setActiveTab}
            />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'quick' && <QuickSetupTab env={env} />}
                {activeTab === 'sdk' && <SDKPreferencesTab env={env} />}
                {activeTab === 'keys' && <ApiKeysTab env={env} />}
                {activeTab === 'advanced' && <GlassContainerSettings />}
            </AnimatePresence>
        </div>
    );
};
```

#### AgentStatusOverview (New)

```tsx
// src/components/settings/AgentStatusOverview.tsx

export const AgentStatusOverview: React.FC<{ env: EnvironmentCapabilities | null; loading: boolean }> = ({
    env,
    loading,
}) => {
    if (loading) {
        return <SkeletonLoader />;
    }

    const status = {
        docker: env?.docker.available ? 'ready' : 'missing',
        claude: env?.apiKeys.anthropic ? 'ready' : 'missing',
        gemini: env?.apiKeys.google ? 'ready' : 'missing',
        openai: env?.apiKeys.openai ? 'ready' : 'missing',
    };

    const readyCount = Object.values(status).filter(s => s === 'ready').length;
    const totalCount = Object.values(status).length;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Agent Runtime Status</h3>
                    <p className="text-sm text-white/50">
                        {readyCount === totalCount
                            ? 'All systems ready'
                            : `${readyCount}/${totalCount} components configured`}
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    readyCount === totalCount
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                )}>
                    {readyCount === totalCount ? 'Ready' : 'Setup Required'}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <StatusCard
                    icon={<Container />}
                    label="Docker"
                    status={status.docker}
                    detail={env?.docker.platform || 'Not installed'}
                />
                <StatusCard
                    icon={<Sparkles />}
                    label="Claude"
                    status={status.claude}
                    detail={status.claude === 'ready' ? 'API key found' : 'Add API key'}
                />
                <StatusCard
                    icon={<Zap />}
                    label="Gemini"
                    status={status.gemini}
                    detail={env?.cliTools.geminiCli ? 'CLI installed' : 'API only'}
                />
                <StatusCard
                    icon={<Brain />}
                    label="OpenAI"
                    status={status.openai}
                    detail={status.openai === 'ready' ? 'API key found' : 'Optional'}
                />
            </div>
        </div>
    );
};
```

#### SDKPreferencesTab (New)

```tsx
// src/components/settings/SDKPreferencesTab.tsx

export const SDKPreferencesTab: React.FC<{ env: EnvironmentCapabilities | null }> = ({ env }) => {
    const { config, setSdkPreference } = useContainerStore();

    // Calculate estimated costs
    const estimatedCosts = useMemo(() => ({
        claude: { perTask: '$0.05-0.50', monthly: '$50-500' },
        gemini: { perTask: '$0.001-0.01', monthly: '$1-10' },
        openai: { perTask: '$0.02-0.20', monthly: '$20-200' },
    }), []);

    return (
        <div className="space-y-6">
            {/* Quick Preference Cards */}
            <Section title="Default AI Model" icon={<Brain />}>
                <div className="grid grid-cols-3 gap-4">
                    <PreferenceCard
                        name="Claude"
                        description="Best quality, careful reasoning"
                        icon={<Sparkles />}
                        selected={config.sdkPreferences?.default === 'claude-agent-sdk'}
                        onSelect={() => setSdkPreference('default', 'claude-agent-sdk')}
                        cost="$$"
                        speed="Medium"
                        quality="Excellent"
                        available={!!env?.apiKeys.anthropic}
                    />
                    <PreferenceCard
                        name="Gemini"
                        description="Fastest, most cost-effective"
                        icon={<Zap />}
                        selected={config.sdkPreferences?.default === 'gemini-cli'}
                        onSelect={() => setSdkPreference('default', 'gemini-cli')}
                        cost="$"
                        speed="Fast"
                        quality="Good"
                        available={!!env?.apiKeys.google}
                        recommended
                    />
                    <PreferenceCard
                        name="OpenAI"
                        description="Balanced performance"
                        icon={<Brain />}
                        selected={config.sdkPreferences?.default === 'openai-agents-sdk'}
                        onSelect={() => setSdkPreference('default', 'openai-agents-sdk')}
                        cost="$$"
                        speed="Medium"
                        quality="Very Good"
                        available={!!env?.apiKeys.openai}
                    />
                </div>
            </Section>

            {/* Task-Specific Overrides */}
            <Section title="Task-Specific Models" icon={<Layers />}>
                <div className="space-y-3">
                    <TaskModelRow
                        task="UI & Components"
                        description="React, CSS, visual design"
                        icon={<Layout />}
                        value={config.sdkPreferences?.uiSpecialist || 'auto'}
                        onChange={(v) => setSdkPreference('uiSpecialist', v)}
                        recommended="claude-agent-sdk"
                    />
                    <TaskModelRow
                        task="API & Backend"
                        description="Server code, databases"
                        icon={<Server />}
                        value={config.sdkPreferences?.apiSpecialist || 'auto'}
                        onChange={(v) => setSdkPreference('apiSpecialist', v)}
                        recommended="gemini-cli"
                    />
                    <TaskModelRow
                        task="Tests"
                        description="Unit tests, integration tests"
                        icon={<TestTube />}
                        value={config.sdkPreferences?.testSpecialist || 'auto'}
                        onChange={(v) => setSdkPreference('testSpecialist', v)}
                        recommended="gemini-cli"
                    />
                    <TaskModelRow
                        task="Security"
                        description="Auth, validation, encryption"
                        icon={<Shield />}
                        value={config.sdkPreferences?.securitySpecialist || 'auto'}
                        onChange={(v) => setSdkPreference('securitySpecialist', v)}
                        recommended="claude-agent-sdk"
                        locked  // Security always uses Claude
                    />
                </div>
            </Section>

            {/* Natural Language Config */}
            <Section title="Natural Language Config" icon={<MessageSquare />}>
                <NaturalLanguageConfigInput
                    placeholder='Try: "use Claude for UI, Gemini for everything else"'
                    onApply={(config) => applyNaturalLanguageConfig(config)}
                />
            </Section>
        </div>
    );
};
```

#### ApiKeysTab (New)

```tsx
// src/components/settings/ApiKeysTab.tsx

export const ApiKeysTab: React.FC<{ env: EnvironmentCapabilities | null }> = ({ env }) => {
    const [showAddKey, setShowAddKey] = useState<string | null>(null);
    const [validating, setValidating] = useState<string | null>(null);

    const providers = [
        {
            id: 'anthropic',
            name: 'Anthropic (Claude)',
            envVar: 'ANTHROPIC_API_KEY',
            detected: env?.apiKeys.anthropic,
            icon: <Sparkles />,
            color: 'text-orange-400',
            getKeyUrl: 'https://console.anthropic.com/settings/keys',
        },
        {
            id: 'google',
            name: 'Google (Gemini)',
            envVar: 'GOOGLE_API_KEY',
            detected: env?.apiKeys.google,
            icon: <Zap />,
            color: 'text-blue-400',
            getKeyUrl: 'https://makersuite.google.com/app/apikey',
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT)',
            envVar: 'OPENAI_API_KEY',
            detected: env?.apiKeys.openai,
            icon: <Brain />,
            color: 'text-emerald-400',
            getKeyUrl: 'https://platform.openai.com/api-keys',
        },
    ];

    return (
        <div className="space-y-4">
            {/* Explanation */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-400 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm text-white">
                            API keys are automatically detected from environment variables.
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                            Set <code className="bg-black/30 px-1 rounded">ANTHROPIC_API_KEY</code> in your shell profile for persistence.
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Cards */}
            {providers.map((provider) => (
                <ApiKeyCard
                    key={provider.id}
                    provider={provider}
                    onAdd={() => setShowAddKey(provider.id)}
                    onValidate={async () => {
                        setValidating(provider.id);
                        // Validate key
                        setValidating(null);
                    }}
                />
            ))}

            {/* Add Key Modal */}
            <AnimatePresence>
                {showAddKey && (
                    <AddApiKeyModal
                        provider={providers.find(p => p.id === showAddKey)!}
                        onClose={() => setShowAddKey(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
```

### 4.3 Store Extensions

```typescript
// src/stores/containerStore.ts (additions)

export interface SDKPreferences {
    default: SDKType;
    uiSpecialist: SDKType | 'auto';
    apiSpecialist: SDKType | 'auto';
    testSpecialist: SDKType | 'auto';
    securitySpecialist: SDKType;  // Always Claude
    costOptimization: 'quality' | 'balanced' | 'cost';
}

// Add to ContainerConfig
export interface ContainerConfig {
    // ... existing fields

    // NEW: SDK Preferences
    sdkPreferences: SDKPreferences;

    // NEW: Auto-configuration state
    autoConfig: {
        enabled: boolean;
        lastDetected?: number;
        detectedEnv?: Partial<EnvironmentCapabilities>;
    };
}

// Add to store
interface ContainerStore {
    // ... existing methods

    // NEW: SDK Preferences
    setSdkPreference: <K extends keyof SDKPreferences>(key: K, value: SDKPreferences[K]) => void;
    setAllSdkPreferences: (prefs: Partial<SDKPreferences>) => void;

    // NEW: Auto-configuration
    runAutoConfig: () => Promise<void>;
    applySmartDefaults: () => void;
}
```

---

## 5. Backend Architecture

### 5.1 Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  GlassSettingsPanel                                                     ││
│  │  ├── GlassAgentSettings (NEW)                                           ││
│  │  │   ├── QuickSetupTab                                                  ││
│  │  │   ├── SDKPreferencesTab                                              ││
│  │  │   ├── ApiKeysTab                                                     ││
│  │  │   └── GlassContainerSettings (existing, as "Advanced")               ││
│  │  └── ...other tabs                                                      ││
│  │                                                                         ││
│  │  Zustand Store: containerStore.ts                                       ││
│  │  ├── Container config (existing)                                        ││
│  │  ├── SDK preferences (NEW)                                              ││
│  │  └── Auto-config state (NEW)                                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ GraphQL / HTTP
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Bun + Elysia)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  API Layer (server/src/index.ts)                                        ││
│  │  ├── /api/container/detect         ← Environment detection              ││
│  │  ├── /api/container/validate-key   ← API key validation                 ││
│  │  ├── /api/container/smart-defaults ← Generate smart config              ││
│  │  └── GraphQL (existing orchestration endpoints)                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │  Container Service Layer (server/src/container/)                        ││
│  │  ├── auto-config.ts        ← Environment detection                      ││
│  │  ├── smart-defaults.ts     ← Default generation                         ││
│  │  ├── sdk-intelligence.ts   ← Task analysis & SDK selection              ││
│  │  ├── sdk-profiles.ts       ← Profile definitions                        ││
│  │  ├── session-manager.ts    ← Session persistence                        ││
│  │  ├── credential-proxy.ts   ← Security proxy                             ││
│  │  ├── pool.ts               ← Container pool (existing)                  ││
│  │  ├── executor.ts           ← Orchestrator bridge (existing)             ││
│  │  └── runners/              ← SDK-specific runners                       ││
│  │      ├── claude-runner.ts                                               ││
│  │      ├── gemini-runner.ts  ← NEW (Gemini CLI)                           ││
│  │      ├── bridge-runner.ts  ← OpenAI/ADK                                 ││
│  │      └── raw-runner.ts                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │  Orchestrator (server/src/orchestrator/)                                ││
│  │  ├── index.ts              ← Main orchestration (UPDATE: wire to exec)  ││
│  │  ├── specialists.ts        ← Agent definitions (UPDATE: SDK prefs)      ││
│  │  └── decompose.ts          ← PRD decomposition (existing)               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Docker API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONTAINER RUNTIME                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Credential Proxy (HOST)                                                ││
│  │  ├── Unix socket: /var/run/liquid-proxy.sock                            ││
│  │  ├── Injects API keys based on destination domain                       ││
│  │  └── Logs all requests for audit                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │  LiquidContainer (DOCKER)                                               ││
│  │  ├── Runtime Server (Elysia on :8080)                                   ││
│  │  ├── Runners (claude-runner.ts, gemini-runner.ts, etc.)                 ││
│  │  ├── Mounts:                                                            ││
│  │  │   ├── /app           ← Project (read-only overlay)                   ││
│  │  │   ├── /app/.agent    ← Agent scratch (tmpfs)                         ││
│  │  │   └── /secrets/proxy.sock ← Credential proxy                         ││
│  │  └── Nested Sandbox (optional):                                         ││
│  │      ├── Gemini CLI --sandbox                                           ││
│  │      └── Claude sandbox-runtime                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Gemini CLI Runner (New)

```typescript
// server/container/runtime-server/runners/gemini-runner.ts

import { spawn } from 'child_process';
import { createInterface } from 'readline';

interface GeminiEvent {
    type: 'init' | 'message' | 'tool_use' | 'tool_result' | 'error' | 'result';
    timestamp: string;
    session_id?: string;
    role?: string;
    content?: string;
    tool_name?: string;
    tool_id?: string;
    parameters?: Record<string, unknown>;
    status?: string;
    output?: string;
    stats?: {
        total_tokens: number;
        input_tokens: number;
        output_tokens: number;
        duration_ms: number;
        tool_calls: number;
    };
}

async function main() {
    const taskPrompt = process.env.LIQUID_TASK_PROMPT;
    const model = process.env.LIQUID_SDK_MODEL || 'gemini-2.5-flash';
    const enableSandbox = process.env.LIQUID_NESTED_SANDBOX === 'true';
    const yoloMode = process.env.LIQUID_YOLO_MODE !== 'false';  // Default true for headless

    if (!taskPrompt) {
        console.error('No task prompt provided');
        process.exit(1);
    }

    // Build Gemini CLI command
    const args: string[] = [
        '--output-format', 'stream-json',
        '--model', model,
        '--prompt', taskPrompt,
    ];

    if (yoloMode) args.push('--yolo');
    if (enableSandbox) args.push('--sandbox');

    // Spawn Gemini CLI
    const gemini = spawn('gemini', args, {
        env: {
            ...process.env,
            // Gemini CLI uses GOOGLE_API_KEY or GEMINI_API_KEY
            // These are injected by credential proxy
        },
        cwd: process.env.LIQUID_WORKDIR || '/app',
    });

    // Parse NDJSON output
    const rl = createInterface({ input: gemini.stdout });

    let sessionId: string | undefined;
    const modifiedFiles: string[] = [];
    let success = true;
    let lastError: string | undefined;

    rl.on('line', (line) => {
        try {
            const event: GeminiEvent = JSON.parse(line);

            switch (event.type) {
                case 'init':
                    sessionId = event.session_id;
                    console.log(`LIQUID_SDK_SESSION_ID:${sessionId}`);
                    break;

                case 'message':
                    // Forward messages as progress
                    console.log(JSON.stringify({
                        type: 'progress',
                        role: event.role,
                        content: event.content,
                        timestamp: event.timestamp,
                    }));
                    break;

                case 'tool_use':
                    console.log(JSON.stringify({
                        type: 'tool_call',
                        tool: event.tool_name,
                        id: event.tool_id,
                        params: event.parameters,
                    }));
                    // Track file modifications
                    if (event.tool_name === 'WriteFile' && event.parameters?.path) {
                        modifiedFiles.push(event.parameters.path as string);
                    }
                    break;

                case 'tool_result':
                    console.log(JSON.stringify({
                        type: 'tool_result',
                        id: event.tool_id,
                        status: event.status,
                    }));
                    break;

                case 'error':
                    lastError = event.content;
                    success = false;
                    break;

                case 'result':
                    // Final result
                    console.log('---RESULT_START---');
                    console.log(JSON.stringify({
                        success: event.status === 'success' && success,
                        modifiedFiles: [...new Set(modifiedFiles)],
                        commits: [],
                        errors: lastError ? [lastError] : [],
                        duration: event.stats?.duration_ms || 0,
                        stats: event.stats,
                    }));
                    console.log('---RESULT_END---');
                    break;
            }
        } catch (e) {
            // Not JSON, might be raw output
            console.error('Parse error:', e);
        }
    });

    // Handle stderr
    gemini.stderr.on('data', (chunk) => {
        console.error(chunk.toString());
    });

    // Wait for completion
    await new Promise<void>((resolve, reject) => {
        gemini.on('close', (code) => {
            if (code !== 0) {
                console.log('---RESULT_START---');
                console.log(JSON.stringify({
                    success: false,
                    modifiedFiles,
                    commits: [],
                    errors: [`Gemini CLI exited with code ${code}`],
                    duration: 0,
                }));
                console.log('---RESULT_END---');
            }
            resolve();
        });
        gemini.on('error', reject);
    });
}

main().catch((e) => {
    console.error('Runner error:', e);
    process.exit(1);
});
```

---

## 6. Implementation Phases

> **All phases have been implemented as of January 2026.**

### Phase 1: Auto-Configuration Engine ✅ COMPLETE

**Goal:** System detects environment and generates optimal configuration automatically.

**Implemented Files:**
- [x] `server/src/container/auto-config.ts` - Environment detection (Docker, system, API keys, CLI tools, network)
- [x] `server/src/container/smart-defaults.ts` - Smart defaults generator with SDK cost/capability info
- [x] `server/src/container/api-key-detection.ts` - API key detection and validation
- [x] `src/components/settings/GlassAgentSettings.tsx` - Main agent settings component
- [x] `src/components/settings/AgentStatusOverview.tsx` - Status overview dashboard
- [x] `server/src/routes/container.ts` - API endpoints for detection and smart defaults

### Phase 2: SDK Intelligence System ✅ COMPLETE

**Goal:** Automatic SDK selection based on task analysis.

**Implemented Files:**
- [x] `server/src/container/sdk-intelligence.ts` - Task analyzer with SDK recommendations
- [x] `server/src/container/nl-config.ts` - Natural language configuration parser
- [x] `server/src/container/smart-defaults.ts` - SDK cost estimates and capability info
- [x] `server/src/routes/container.ts` - API endpoints for task analysis and NL config

### Phase 3: Gemini CLI Integration ✅ COMPLETE

**Goal:** Full Gemini CLI runner with streaming and sandbox support.

**Implemented Files:**
- [x] `server/src/container/runners/gemini-cli-runner.ts` - Full Gemini CLI runner with streaming
- [x] `server/src/container/runners/index.ts` - Runner exports

### Phase 4: Security Hardening ✅ COMPLETE

**Goal:** Automatic security configuration with credential proxy.

**Implemented Files:**
- [x] `server/src/container/security-auto.ts` - Complete security configuration with 4 defense layers
- [x] `server/src/routes/container.ts` - Security API endpoints (config, validate, presets)

### Phase 5: Orchestrator Integration ✅ COMPLETE

**Goal:** Wire everything together for end-to-end execution.

**Implemented Files:**
- [x] `server/src/container/executor.ts` - SDK Intelligence integration with analyzeAndSelectSdk()
- [x] `server/src/routes/container.ts` - Full API routes for container system

### Phase 6: API Keys UI ✅ COMPLETE

**Goal:** Beautiful API key management with auto-detection.

**Implemented Files:**
- [x] `server/src/container/api-key-detection.ts` - Key detection, validation, and management
- [x] `server/src/routes/container.ts` - API key endpoints (/api-keys, /api-keys/validate)

### Phase 7: Testing & Polish ✅ COMPLETE

**Goal:** Comprehensive testing and UX polish.

**Implemented Files:**
- [x] `CLAUDE.md` - Phase 8: SDK Intelligence System documentation
- [x] Both implementation plan docs updated with completion status
- [x] All server and frontend builds passing

---

## 7. File Structure

```
src/
├── components/
│   └── settings/
│       ├── GlassSettingsPanel.tsx          # Existing (add AI Agents tab)
│       ├── GlassContainerSettings.tsx      # Existing (becomes "Advanced")
│       │
│       ├── GlassAgentSettings.tsx          # NEW: Main agent settings
│       ├── AgentStatusOverview.tsx         # NEW: Status cards
│       ├── QuickSetupTab.tsx               # NEW: Setup wizard
│       ├── SDKPreferencesTab.tsx           # NEW: Model preferences
│       ├── ApiKeysTab.tsx                  # NEW: API key management
│       ├── AddApiKeyModal.tsx              # NEW: Add key modal
│       └── NaturalLanguageConfigInput.tsx  # NEW: NL config
│
└── stores/
    └── containerStore.ts                   # UPDATE: Add SDK preferences

server/
├── src/
│   ├── container/
│   │   ├── index.ts                        # Existing
│   │   ├── pool.ts                         # Existing
│   │   ├── executor.ts                     # Existing
│   │   ├── types.ts                        # Existing
│   │   │
│   │   ├── auto-config.ts                  # NEW: Environment detection
│   │   ├── smart-defaults.ts               # NEW: Default generation
│   │   ├── sdk-intelligence.ts             # NEW: Task analysis
│   │   ├── sdk-profiles.ts                 # NEW: Profile definitions
│   │   ├── api-key-detection.ts            # NEW: Key detection
│   │   ├── nl-config.ts                    # NEW: Natural language config
│   │   ├── security-auto.ts                # NEW: Auto security
│   │   ├── credential-proxy.ts             # NEW: Proxy server
│   │   └── session-manager.ts              # NEW: Session persistence
│   │
│   └── orchestrator/
│       ├── index.ts                        # UPDATE: Wire to executor
│       └── specialists.ts                  # UPDATE: Add SDK preferences
│
├── container/
│   └── runtime-server/
│       └── runners/
│           ├── claude-runner.ts            # NEW
│           ├── gemini-runner.ts            # NEW
│           ├── bridge-runner.ts            # NEW
│           └── raw-runner.ts               # NEW

docs/
├── LIQUID_CONTAINER_ARCHITECTURE.md        # UPDATE
├── LIQUID_CONTAINER_SDK_IMPLEMENTATION_PLAN.md  # Previous plan
└── LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md  # This document
```

---

## 8. Testing Strategy

### 8.1 Test Categories

| Category | Description | Priority |
|----------|-------------|----------|
| Auto-Detection | Environment capabilities | High |
| SDK Selection | Task → SDK mapping | High |
| Security | Credential isolation | Critical |
| Integration | End-to-end execution | High |
| UI | Settings components | Medium |
| Performance | Latency benchmarks | Medium |

### 8.2 Test Cases

```typescript
// tests/unit/auto-config.test.ts
describe('Auto Configuration', () => {
    it('should detect Docker availability', async () => {
        const env = await detectEnvironment();
        expect(env.docker).toBeDefined();
        expect(typeof env.docker.available).toBe('boolean');
    });

    it('should detect API keys from environment', async () => {
        process.env.ANTHROPIC_API_KEY = 'test-key';
        const env = await detectEnvironment();
        expect(env.apiKeys.anthropic).toBe(true);
    });

    it('should generate appropriate defaults for low-memory systems', () => {
        const env = mockEnvironment({ availableMemory: 2 * 1024 * 1024 * 1024 });
        const defaults = generateSmartDefaults(env);
        expect(defaults.pool.minIdle).toBeLessThanOrEqual(3);
    });
});

// tests/unit/sdk-intelligence.test.ts
describe('SDK Intelligence', () => {
    it('should select Claude for security tasks', () => {
        const subPrd = mockSubPrd({
            stories: [{ title: 'Implement JWT authentication' }],
        });
        const env = mockEnvironment({ apiKeys: { anthropic: true, google: true } });
        const analysis = analyzeTask(subPrd, env);
        expect(analysis.type).toBe('security');
        expect(analysis.suggestedSdk).toBe('claude-agent-sdk');
    });

    it('should select Gemini CLI for simple API tasks', () => {
        const subPrd = mockSubPrd({
            stories: [{ title: 'Add GET endpoint', affectedFiles: ['server/src/routes.ts'] }],
        });
        const env = mockEnvironment({
            apiKeys: { google: true },
            cliTools: { geminiCli: true },
        });
        const analysis = analyzeTask(subPrd, env);
        expect(analysis.suggestedSdk).toBe('gemini-cli');
    });
});

// tests/integration/gemini-runner.test.ts
describe('Gemini CLI Runner', () => {
    it('should parse NDJSON events correctly', async () => {
        const events: any[] = [];
        await executeWithRunner('gemini-runner', {
            prompt: 'Create a hello world file',
            onEvent: (e) => events.push(e),
        });

        expect(events.some(e => e.type === 'init')).toBe(true);
        expect(events.some(e => e.type === 'result')).toBe(true);
    });

    it('should enable nested sandbox when configured', async () => {
        const result = await executeWithRunner('gemini-runner', {
            prompt: 'List files',
            nestedSandbox: true,
        });

        // Verify sandbox was used (check process args or output)
        expect(result.success).toBe(true);
    });
});

// tests/security/credential-proxy.test.ts
describe('Credential Proxy', () => {
    it('should never expose API keys to containers', async () => {
        const containerEnv = await getContainerEnvironment();
        expect(containerEnv).not.toContain('ANTHROPIC_API_KEY');
        expect(containerEnv).not.toContain('GOOGLE_API_KEY');
        expect(containerEnv).not.toContain('OPENAI_API_KEY');
    });

    it('should inject credentials only for allowed domains', async () => {
        const result = await proxyRequest('https://api.anthropic.com/v1/messages');
        expect(result.headers['x-api-key']).toBeDefined();

        await expect(
            proxyRequest('https://evil.com/steal')
        ).rejects.toThrow('Domain not allowed');
    });
});
```

---

## Summary

This implementation plan delivers:

### User Experience

1. **Zero-Config Default** - Works immediately with just API keys in environment
2. **Intelligent Defaults** - Auto-detects system and optimizes settings
3. **Natural Language Config** - "use Claude for UI work"
4. **Progressive Disclosure** - Simple by default, full control available

### Technical Excellence

1. **5 SDK Support** - Claude, Gemini CLI, OpenAI, Google ADK, MiniMax
2. **Auto SDK Selection** - Best model for each task type
3. **Session Persistence** - Continue conversations across containers
4. **Credential Security** - API keys never enter containers

### Security

1. **Defense in Depth** - 4 security layers
2. **Automatic Hardening** - Strictest safe defaults
3. **Nested Sandbox** - Double isolation with Gemini CLI
4. **Audit Logging** - All API calls logged

**Total Implementation: ~23-30 days across 7 phases**

**Key Innovation:** The system should feel "magical" - users get excellent results without understanding containers, SDKs, or security. But everything is fully customizable for power users.
