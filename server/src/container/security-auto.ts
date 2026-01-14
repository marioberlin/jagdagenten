/**
 * Security Auto-Configuration
 *
 * Generates secure container configuration with defense-in-depth layers.
 * Implements automatic security based on detected environment.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import type { EnvironmentCapabilities } from './auto-config.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Credential proxy configuration
 */
export interface CredentialProxyConfig {
    /** Enable credential proxy */
    enabled: boolean;
    /** Unix socket path for proxy */
    socketPath: string;
    /** Domains allowed to receive credentials */
    allowedDomains: string[];
    /** Enable audit logging */
    auditLog: boolean;
    /** Rotate credentials automatically */
    autoRotate: boolean;
}

/**
 * Network security configuration
 */
export interface NetworkSecurityConfig {
    /** Network mode */
    mode: 'none' | 'bridge' | 'host';
    /** Egress policy */
    egressPolicy: 'block-all' | 'allow-list' | 'allow-all';
    /** Allowed outbound domains */
    allowedDomains: string[];
    /** Block DNS queries for unlisted domains */
    dnsFiltering: boolean;
    /** Rate limit outbound requests */
    rateLimitRps: number;
}

/**
 * Container security configuration
 */
export interface ContainerSecurityConfig {
    /** Read-only root filesystem */
    readOnlyRoot: boolean;
    /** Prevent privilege escalation */
    noNewPrivileges: boolean;
    /** Capabilities to drop */
    dropCapabilities: string[];
    /** Seccomp profile */
    seccompProfile: 'default' | 'unconfined' | string;
    /** User to run as */
    user: string;
    /** Tmpfs mounts for writable dirs */
    tmpfsMounts: string[];
    /** Maximum PIDs */
    pidsLimit: number;
}

/**
 * Nested sandbox configuration (SDK-level sandboxing)
 */
export interface NestedSandboxConfig {
    /** Enable nested sandbox */
    enabled: boolean;
    /** Type of nested sandbox */
    type: 'gemini-cli' | 'claude-sandbox' | 'none';
    /** Additional restrictions */
    restrictions: string[];
}

/**
 * Audit logging configuration
 */
export interface AuditConfig {
    /** Enable audit logging */
    enabled: boolean;
    /** Log file operations */
    logFileOps: boolean;
    /** Log network requests */
    logNetworkOps: boolean;
    /** Log shell commands */
    logShellOps: boolean;
    /** Audit log destination */
    destination: 'stdout' | 'file' | 'syslog';
    /** File path (if destination is 'file') */
    filePath?: string;
}

/**
 * Complete security configuration
 */
export interface SecurityConfig {
    credentialProxy: CredentialProxyConfig;
    network: NetworkSecurityConfig;
    container: ContainerSecurityConfig;
    nestedSandbox: NestedSandboxConfig;
    audit: AuditConfig;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_ALLOWED_DOMAINS = [
    // Package registries
    'registry.npmjs.org',
    'pypi.org',
    'crates.io',
    'pkg.go.dev',
    // Common development resources
    'raw.githubusercontent.com',
    'api.github.com',
];

const AI_PROVIDER_DOMAINS: Record<string, string[]> = {
    anthropic: ['api.anthropic.com'],
    openai: ['api.openai.com'],
    google: ['generativelanguage.googleapis.com', 'aiplatform.googleapis.com'],
    minimax: ['api.minimax.chat'],
};

const DROP_CAPABILITIES = [
    'AUDIT_CONTROL',
    'AUDIT_READ',
    'AUDIT_WRITE',
    'BLOCK_SUSPEND',
    'CHOWN',
    'DAC_OVERRIDE',
    'DAC_READ_SEARCH',
    'FOWNER',
    'FSETID',
    'IPC_LOCK',
    'IPC_OWNER',
    'KILL',
    'LEASE',
    'LINUX_IMMUTABLE',
    'MAC_ADMIN',
    'MAC_OVERRIDE',
    'MKNOD',
    'NET_ADMIN',
    'NET_BIND_SERVICE',
    'NET_BROADCAST',
    'NET_RAW',
    'SETFCAP',
    'SETGID',
    'SETPCAP',
    'SETUID',
    'SYS_ADMIN',
    'SYS_BOOT',
    'SYS_CHROOT',
    'SYS_MODULE',
    'SYS_NICE',
    'SYS_PACCT',
    'SYS_PTRACE',
    'SYS_RAWIO',
    'SYS_RESOURCE',
    'SYS_TIME',
    'SYS_TTY_CONFIG',
    'SYSLOG',
    'WAKE_ALARM',
];

// ============================================================================
// Security Configuration Generator
// ============================================================================

/**
 * Generate security configuration based on environment
 */
export function generateSecurityConfig(
    env: EnvironmentCapabilities,
    userPreferences?: Partial<SecurityConfig>
): SecurityConfig {
    // Build allowed domains list based on detected API keys
    const allowedDomains = buildAllowedDomains(env.apiKeys);

    // Default secure configuration
    const config: SecurityConfig = {
        credentialProxy: {
            enabled: env.docker.available,
            socketPath: '/var/run/liquid-proxy.sock',
            allowedDomains,
            auditLog: true,
            autoRotate: false,
        },
        network: {
            mode: 'bridge',
            egressPolicy: 'allow-list',
            allowedDomains,
            dnsFiltering: true,
            rateLimitRps: 100,
        },
        container: {
            readOnlyRoot: true,
            noNewPrivileges: true,
            dropCapabilities: DROP_CAPABILITIES,
            seccompProfile: 'default',
            user: 'agent:agent',
            tmpfsMounts: ['/tmp', '/var/tmp'],
            pidsLimit: 100,
        },
        nestedSandbox: {
            enabled: env.cliTools.geminiCli,
            type: env.cliTools.geminiCli ? 'gemini-cli' : 'none',
            restrictions: [],
        },
        audit: {
            enabled: true,
            logFileOps: true,
            logNetworkOps: true,
            logShellOps: true,
            destination: 'stdout',
        },
    };

    // Merge user preferences (with validation)
    if (userPreferences) {
        return mergeSecurityConfig(config, userPreferences);
    }

    return config;
}

/**
 * Build allowed domains list based on API keys
 */
function buildAllowedDomains(apiKeys: EnvironmentCapabilities['apiKeys']): string[] {
    const domains = [...DEFAULT_ALLOWED_DOMAINS];

    // Add AI provider domains based on detected keys
    if (apiKeys.anthropic) {
        domains.push(...AI_PROVIDER_DOMAINS.anthropic);
    }
    if (apiKeys.openai) {
        domains.push(...AI_PROVIDER_DOMAINS.openai);
    }
    if (apiKeys.google) {
        domains.push(...AI_PROVIDER_DOMAINS.google);
    }
    if (apiKeys.minimax) {
        domains.push(...AI_PROVIDER_DOMAINS.minimax);
    }

    return [...new Set(domains)]; // Deduplicate
}

/**
 * Merge user preferences with secure defaults
 */
function mergeSecurityConfig(
    base: SecurityConfig,
    overrides: Partial<SecurityConfig>
): SecurityConfig {
    const merged = { ...base };

    // Merge credential proxy (preserve enabled and socketPath)
    if (overrides.credentialProxy) {
        merged.credentialProxy = {
            ...base.credentialProxy,
            ...overrides.credentialProxy,
            // Always keep audit logging enabled
            auditLog: true,
        };
    }

    // Merge network config (validate egress policy changes)
    if (overrides.network) {
        merged.network = {
            ...base.network,
            ...overrides.network,
        };

        // Warn if switching to allow-all
        if (overrides.network.egressPolicy === 'allow-all') {
            console.warn('[Security] Warning: allow-all egress policy is insecure');
        }
    }

    // Merge container config (preserve critical security settings)
    if (overrides.container) {
        merged.container = {
            ...base.container,
            ...overrides.container,
            // Always enforce these
            noNewPrivileges: true,
        };
    }

    // Merge nested sandbox
    if (overrides.nestedSandbox) {
        merged.nestedSandbox = {
            ...base.nestedSandbox,
            ...overrides.nestedSandbox,
        };
    }

    // Merge audit config
    if (overrides.audit) {
        merged.audit = {
            ...base.audit,
            ...overrides.audit,
        };
    }

    return merged;
}

// ============================================================================
// Security Validation
// ============================================================================

/**
 * Security issues found during validation
 */
export interface SecurityIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    message: string;
    recommendation: string;
}

/**
 * Validate security configuration for issues
 */
export function validateSecurityConfig(config: SecurityConfig): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check credential proxy
    if (!config.credentialProxy.enabled) {
        issues.push({
            severity: 'high',
            category: 'credential-proxy',
            message: 'Credential proxy is disabled',
            recommendation: 'Enable credential proxy to prevent API keys from entering containers',
        });
    }

    // Check network egress
    if (config.network.egressPolicy === 'allow-all') {
        issues.push({
            severity: 'critical',
            category: 'network',
            message: 'Unrestricted network egress is enabled',
            recommendation: 'Use allow-list policy to restrict outbound connections',
        });
    }

    // Check container security
    if (!config.container.noNewPrivileges) {
        issues.push({
            severity: 'high',
            category: 'container',
            message: 'Privilege escalation is allowed',
            recommendation: 'Enable noNewPrivileges to prevent privilege escalation',
        });
    }

    if (!config.container.readOnlyRoot) {
        issues.push({
            severity: 'medium',
            category: 'container',
            message: 'Root filesystem is writable',
            recommendation: 'Use read-only root with tmpfs for writable directories',
        });
    }

    if (config.container.user === 'root') {
        issues.push({
            severity: 'high',
            category: 'container',
            message: 'Container running as root',
            recommendation: 'Run container as non-root user (agent:agent)',
        });
    }

    // Check audit logging
    if (!config.audit.enabled) {
        issues.push({
            severity: 'medium',
            category: 'audit',
            message: 'Audit logging is disabled',
            recommendation: 'Enable audit logging for security monitoring',
        });
    }

    return issues;
}

/**
 * Calculate overall security score
 */
export function calculateSecurityScore(config: SecurityConfig): number {
    let score = 100;
    const issues = validateSecurityConfig(config);

    for (const issue of issues) {
        switch (issue.severity) {
            case 'critical':
                score -= 30;
                break;
            case 'high':
                score -= 20;
                break;
            case 'medium':
                score -= 10;
                break;
            case 'low':
                score -= 5;
                break;
        }
    }

    return Math.max(0, score);
}

// ============================================================================
// Docker Security Options
// ============================================================================

/**
 * Convert security config to Docker run options
 */
export function toDockerSecurityOpts(config: SecurityConfig): string[] {
    const opts: string[] = [];

    // Read-only root
    if (config.container.readOnlyRoot) {
        opts.push('--read-only');
    }

    // No new privileges
    if (config.container.noNewPrivileges) {
        opts.push('--security-opt', 'no-new-privileges');
    }

    // Drop capabilities
    for (const cap of config.container.dropCapabilities) {
        opts.push('--cap-drop', cap);
    }

    // Seccomp profile
    if (config.container.seccompProfile !== 'unconfined') {
        opts.push('--security-opt', `seccomp=${config.container.seccompProfile}`);
    }

    // User
    opts.push('--user', config.container.user);

    // PIDs limit
    opts.push('--pids-limit', String(config.container.pidsLimit));

    // Tmpfs mounts
    for (const mount of config.container.tmpfsMounts) {
        opts.push('--tmpfs', `${mount}:rw,noexec,nosuid,size=100m`);
    }

    // Network mode
    if (config.network.mode !== 'bridge') {
        opts.push('--network', config.network.mode);
    }

    return opts;
}

/**
 * Generate Docker network rules for allowed domains
 */
export function generateNetworkRules(config: SecurityConfig): string[] {
    const rules: string[] = [];

    if (config.network.egressPolicy === 'allow-list') {
        // Default deny
        rules.push('iptables -P OUTPUT DROP');

        // Allow loopback
        rules.push('iptables -A OUTPUT -o lo -j ACCEPT');

        // Allow established connections
        rules.push('iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');

        // Allow DNS
        rules.push('iptables -A OUTPUT -p udp --dport 53 -j ACCEPT');

        // Allow HTTPS to listed domains
        for (const domain of config.network.allowedDomains) {
            rules.push(`iptables -A OUTPUT -p tcp --dport 443 -d ${domain} -j ACCEPT`);
        }
    }

    return rules;
}

// ============================================================================
// Security Presets
// ============================================================================

export type SecurityPreset = 'maximum' | 'strict' | 'standard' | 'permissive';

/**
 * Get security configuration for a preset level
 */
export function getSecurityPreset(
    preset: SecurityPreset,
    env: EnvironmentCapabilities
): SecurityConfig {
    const base = generateSecurityConfig(env);

    switch (preset) {
        case 'maximum':
            // Maximum security - minimal attack surface
            return {
                ...base,
                network: {
                    ...base.network,
                    egressPolicy: 'allow-list',
                    dnsFiltering: true,
                    rateLimitRps: 50,
                },
                container: {
                    ...base.container,
                    readOnlyRoot: true,
                    dropCapabilities: DROP_CAPABILITIES,
                },
                nestedSandbox: {
                    enabled: true,
                    type: env.cliTools.geminiCli ? 'gemini-cli' : 'none',
                    restrictions: ['network', 'filesystem'],
                },
            };

        case 'strict':
            // Strict security with some flexibility
            return {
                ...base,
                network: {
                    ...base.network,
                    egressPolicy: 'allow-list',
                    rateLimitRps: 100,
                },
            };

        case 'standard':
            // Standard security (default)
            return base;

        case 'permissive':
            // Permissive - for development only
            return {
                ...base,
                network: {
                    ...base.network,
                    egressPolicy: 'allow-all',
                    dnsFiltering: false,
                    rateLimitRps: 1000,
                },
                container: {
                    ...base.container,
                    readOnlyRoot: false,
                },
                audit: {
                    ...base.audit,
                    enabled: false,
                },
            };
    }
}

// ============================================================================
// Exports
// ============================================================================

export {
    DEFAULT_ALLOWED_DOMAINS,
    AI_PROVIDER_DOMAINS,
    DROP_CAPABILITIES,
};
