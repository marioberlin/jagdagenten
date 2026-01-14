/**
 * LiquidContainer Auto-Configuration
 *
 * Automatically detects environment capabilities for zero-config setup.
 * Detects Docker, system resources, API keys, CLI tools, and network connectivity.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

/**
 * Docker runtime detection results
 */
export interface DockerCapabilities {
    /** Whether Docker is available and running */
    available: boolean;
    /** Docker version string */
    version?: string;
    /** Docker Compose availability */
    composeAvailable: boolean;
    /** Buildx availability for multi-arch builds */
    buildxAvailable: boolean;
    /** Whether running in rootless mode */
    rootless: boolean;
    /** Detected platform/runtime */
    platform: 'docker-desktop' | 'docker-ce' | 'podman' | 'orbstack' | 'colima' | 'rancher-desktop' | null;
    /** API version */
    apiVersion?: string;
    /** Docker socket path */
    socketPath?: string;
}

/**
 * System resource information
 */
export interface SystemCapabilities {
    /** Operating system platform */
    platform: 'darwin' | 'linux' | 'win32';
    /** CPU architecture */
    arch: 'x64' | 'arm64' | string;
    /** Total system memory in bytes */
    totalMemory: number;
    /** Available memory in bytes (estimated) */
    availableMemory: number;
    /** Number of CPU cores */
    cpuCores: number;
    /** CPU model string */
    cpuModel: string;
    /** System uptime in seconds */
    uptime: number;
}

/**
 * Detected API key availability (not the values, just presence)
 */
export interface ApiKeyCapabilities {
    /** Anthropic API key detected */
    anthropic: boolean;
    /** OpenAI API key detected */
    openai: boolean;
    /** Google/Gemini API key detected */
    google: boolean;
    /** MiniMax API key detected */
    minimax: boolean;
}

/**
 * CLI tool availability
 */
export interface CliToolCapabilities {
    /** Gemini CLI installed */
    geminiCli: boolean;
    /** Gemini CLI version */
    geminiCliVersion?: string;
    /** Claude Code CLI installed */
    claudeCode: boolean;
    /** Claude Code version */
    claudeCodeVersion?: string;
    /** Git available */
    git: boolean;
    /** Git version */
    gitVersion?: string;
    /** Bun runtime available */
    bun: boolean;
    /** Bun version */
    bunVersion?: string;
    /** Node.js available */
    node: boolean;
    /** Node version */
    nodeVersion?: string;
}

/**
 * Network connectivity status
 */
export interface NetworkCapabilities {
    /** Proxy configured in environment */
    proxyConfigured: boolean;
    /** Can reach Anthropic API */
    canReachAnthropicApi: boolean;
    /** Can reach OpenAI API */
    canReachOpenAiApi: boolean;
    /** Can reach Google AI API */
    canReachGoogleApi: boolean;
}

/**
 * Complete environment capabilities
 */
export interface EnvironmentCapabilities {
    docker: DockerCapabilities;
    system: SystemCapabilities;
    apiKeys: ApiKeyCapabilities;
    cliTools: CliToolCapabilities;
    network: NetworkCapabilities;
    /** When this detection was performed */
    detectedAt: number;
}

// ============================================================================
// Docker Detection
// ============================================================================

/**
 * Detect Docker availability and capabilities
 */
export async function detectDocker(): Promise<DockerCapabilities> {
    const result: DockerCapabilities = {
        available: false,
        composeAvailable: false,
        buildxAvailable: false,
        rootless: false,
        platform: null,
    };

    try {
        // Check Docker version
        const { stdout: versionOutput } = await execAsync('docker version --format "{{.Server.Version}}"', {
            timeout: 5000,
        });
        result.available = true;
        result.version = versionOutput.trim();

        // Get API version
        try {
            const { stdout: apiOutput } = await execAsync('docker version --format "{{.Server.APIVersion}}"', {
                timeout: 3000,
            });
            result.apiVersion = apiOutput.trim();
        } catch {
            // Ignore
        }

        // Detect platform
        result.platform = await detectDockerPlatform();

        // Check Docker Compose
        try {
            await execAsync('docker compose version', { timeout: 3000 });
            result.composeAvailable = true;
        } catch {
            // Try legacy docker-compose
            try {
                await execAsync('docker-compose version', { timeout: 3000 });
                result.composeAvailable = true;
            } catch {
                // No compose available
            }
        }

        // Check Buildx
        try {
            await execAsync('docker buildx version', { timeout: 3000 });
            result.buildxAvailable = true;
        } catch {
            // No buildx
        }

        // Check if rootless
        try {
            const { stdout: infoOutput } = await execAsync('docker info --format "{{.SecurityOptions}}"', {
                timeout: 5000,
            });
            result.rootless = infoOutput.includes('rootless');
        } catch {
            // Ignore
        }

        // Detect socket path
        result.socketPath = detectDockerSocket();

    } catch {
        // Docker not available
        result.available = false;
    }

    return result;
}

/**
 * Detect which Docker platform is running
 */
async function detectDockerPlatform(): Promise<DockerCapabilities['platform']> {
    const platform = os.platform();

    // Check for OrbStack first (macOS)
    if (platform === 'darwin') {
        try {
            const { stdout } = await execAsync('docker context show', { timeout: 3000 });
            if (stdout.includes('orbstack') || stdout.includes('orb')) {
                return 'orbstack';
            }
        } catch {
            // Ignore
        }

        // Check for Colima
        if (existsSync(join(os.homedir(), '.colima'))) {
            try {
                const { stdout } = await execAsync('colima status', { timeout: 3000 });
                if (stdout.includes('running')) {
                    return 'colima';
                }
            } catch {
                // Not running
            }
        }

        // Check for Rancher Desktop
        if (existsSync(join(os.homedir(), '.rd'))) {
            return 'rancher-desktop';
        }

        // Default to Docker Desktop on macOS
        if (existsSync('/Applications/Docker.app')) {
            return 'docker-desktop';
        }
    }

    // Linux: check for Docker CE vs Podman
    if (platform === 'linux') {
        try {
            const { stdout } = await execAsync('docker --version', { timeout: 3000 });
            if (stdout.toLowerCase().includes('podman')) {
                return 'podman';
            }
        } catch {
            // Ignore
        }
        return 'docker-ce';
    }

    // Windows: likely Docker Desktop
    if (platform === 'win32') {
        return 'docker-desktop';
    }

    return null;
}

/**
 * Find Docker socket path
 */
function detectDockerSocket(): string | undefined {
    const possiblePaths = [
        process.env.DOCKER_HOST,
        '/var/run/docker.sock',
        join(os.homedir(), '.docker', 'run', 'docker.sock'),
        join(os.homedir(), '.colima', 'docker.sock'),
        join(os.homedir(), '.orbstack', 'run', 'docker.sock'),
    ].filter(Boolean) as string[];

    for (const path of possiblePaths) {
        if (path.startsWith('unix://')) {
            const socketPath = path.replace('unix://', '');
            if (existsSync(socketPath)) {
                return path;
            }
        } else if (existsSync(path)) {
            return `unix://${path}`;
        }
    }

    return undefined;
}

// ============================================================================
// System Detection
// ============================================================================

/**
 * Detect system capabilities
 */
export function detectSystem(): SystemCapabilities {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Estimate available memory (free + cached, approximation)
    // On most systems, a good portion of "used" memory is actually cache
    const availableMemory = Math.floor(freeMemory + (totalMemory - freeMemory) * 0.3);

    const cpus = os.cpus();

    return {
        platform: os.platform() as 'darwin' | 'linux' | 'win32',
        arch: os.arch() as 'x64' | 'arm64' | string,
        totalMemory,
        availableMemory,
        cpuCores: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
        uptime: os.uptime(),
    };
}

// ============================================================================
// API Key Detection
// ============================================================================

/**
 * Detect API key presence from environment and config files
 * Note: This only detects presence, not the actual values
 */
export async function detectApiKeys(): Promise<ApiKeyCapabilities> {
    const result: ApiKeyCapabilities = {
        anthropic: false,
        openai: false,
        google: false,
        minimax: false,
    };

    // Check environment variables
    const anthropicEnvVars = ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'];
    const openaiEnvVars = ['OPENAI_API_KEY'];
    const googleEnvVars = ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'];
    const minimaxEnvVars = ['MINIMAX_API_KEY', 'MINIMAX_GROUP_ID'];

    result.anthropic = anthropicEnvVars.some(v => !!process.env[v]);
    result.openai = openaiEnvVars.some(v => !!process.env[v]);
    result.google = googleEnvVars.some(v => !!process.env[v]);
    result.minimax = minimaxEnvVars.some(v => !!process.env[v]);

    // If not found in env, check common config file locations
    if (!result.anthropic) {
        result.anthropic = await checkConfigFileExists([
            join(os.homedir(), '.anthropic', 'api_key'),
            join(os.homedir(), '.config', 'anthropic', 'credentials'),
        ]);
    }

    if (!result.google) {
        result.google = await checkConfigFileExists([
            join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json'),
        ]);
    }

    if (!result.openai) {
        result.openai = await checkConfigFileExists([
            join(os.homedir(), '.openai', 'credentials'),
        ]);
    }

    return result;
}

/**
 * Check if any of the config files exist and are non-empty
 */
async function checkConfigFileExists(paths: string[]): Promise<boolean> {
    for (const path of paths) {
        try {
            if (existsSync(path)) {
                const content = readFileSync(path, 'utf-8').trim();
                if (content.length > 0) {
                    return true;
                }
            }
        } catch {
            // File not readable
        }
    }
    return false;
}

// ============================================================================
// CLI Tools Detection
// ============================================================================

/**
 * Detect CLI tool availability
 */
export async function detectCliTools(): Promise<CliToolCapabilities> {
    const result: CliToolCapabilities = {
        geminiCli: false,
        claudeCode: false,
        git: false,
        bun: false,
        node: false,
    };

    // Check for Gemini CLI
    try {
        const { stdout } = await execAsync('gemini --version', { timeout: 3000 });
        result.geminiCli = true;
        result.geminiCliVersion = stdout.trim().split('\n')[0];
    } catch {
        // Not installed
    }

    // Check for Claude Code CLI
    try {
        const { stdout } = await execAsync('claude --version', { timeout: 3000 });
        result.claudeCode = true;
        result.claudeCodeVersion = stdout.trim().split('\n')[0];
    } catch {
        // Not installed
    }

    // Check for Git
    try {
        const { stdout } = await execAsync('git --version', { timeout: 3000 });
        result.git = true;
        result.gitVersion = stdout.trim();
    } catch {
        // Not installed
    }

    // Check for Bun
    try {
        const { stdout } = await execAsync('bun --version', { timeout: 3000 });
        result.bun = true;
        result.bunVersion = stdout.trim();
    } catch {
        // Not installed
    }

    // Check for Node.js
    try {
        const { stdout } = await execAsync('node --version', { timeout: 3000 });
        result.node = true;
        result.nodeVersion = stdout.trim();
    } catch {
        // Not installed
    }

    return result;
}

// ============================================================================
// Network Detection
// ============================================================================

/**
 * Detect network capabilities
 */
export async function detectNetwork(): Promise<NetworkCapabilities> {
    const result: NetworkCapabilities = {
        proxyConfigured: false,
        canReachAnthropicApi: false,
        canReachOpenAiApi: false,
        canReachGoogleApi: false,
    };

    // Check for proxy configuration
    result.proxyConfigured = !!(
        process.env.HTTP_PROXY ||
        process.env.HTTPS_PROXY ||
        process.env.http_proxy ||
        process.env.https_proxy
    );

    // Test API reachability (with timeout)
    const testEndpoints = [
        { key: 'canReachAnthropicApi' as const, url: 'https://api.anthropic.com' },
        { key: 'canReachOpenAiApi' as const, url: 'https://api.openai.com' },
        { key: 'canReachGoogleApi' as const, url: 'https://generativelanguage.googleapis.com' },
    ];

    // Run tests in parallel with timeout
    await Promise.all(
        testEndpoints.map(async ({ key, url }) => {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000),
                });
                // Any response (even 401/403) means the server is reachable
                result[key] = response.status < 500;
            } catch {
                result[key] = false;
            }
        })
    );

    return result;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect all environment capabilities
 *
 * This is the main entry point for auto-configuration.
 * Runs all detection in parallel for speed.
 */
export async function detectEnvironment(): Promise<EnvironmentCapabilities> {
    const [docker, system, apiKeys, cliTools, network] = await Promise.all([
        detectDocker(),
        Promise.resolve(detectSystem()),
        detectApiKeys(),
        detectCliTools(),
        detectNetwork(),
    ]);

    return {
        docker,
        system,
        apiKeys,
        cliTools,
        network,
        detectedAt: Date.now(),
    };
}

/**
 * Quick check for minimum viable configuration
 *
 * Returns true if the system can run containers:
 * - Docker is available
 * - At least one AI provider API key is present
 */
export function isMinimumViable(env: EnvironmentCapabilities): boolean {
    const hasDocker = env.docker.available;
    const hasApiKey = env.apiKeys.anthropic || env.apiKeys.openai || env.apiKeys.google;
    return hasDocker && hasApiKey;
}

/**
 * Get a human-readable summary of the environment
 */
export function getEnvironmentSummary(env: EnvironmentCapabilities): string {
    const lines: string[] = [];

    // Docker status
    if (env.docker.available) {
        lines.push(`Docker: ${env.docker.platform || 'available'} (v${env.docker.version})`);
    } else {
        lines.push('Docker: not available');
    }

    // System resources
    const memoryGB = (env.system.totalMemory / (1024 * 1024 * 1024)).toFixed(1);
    lines.push(`System: ${env.system.cpuCores} cores, ${memoryGB}GB RAM (${env.system.platform}/${env.system.arch})`);

    // API keys
    const providers: string[] = [];
    if (env.apiKeys.anthropic) providers.push('Anthropic');
    if (env.apiKeys.openai) providers.push('OpenAI');
    if (env.apiKeys.google) providers.push('Google');
    if (env.apiKeys.minimax) providers.push('MiniMax');
    lines.push(`API Keys: ${providers.length > 0 ? providers.join(', ') : 'none detected'}`);

    // CLI tools
    const tools: string[] = [];
    if (env.cliTools.geminiCli) tools.push('Gemini CLI');
    if (env.cliTools.claudeCode) tools.push('Claude Code');
    if (tools.length > 0) {
        lines.push(`CLI Tools: ${tools.join(', ')}`);
    }

    return lines.join('\n');
}
