/**
 * Federated Plugin Registry Types
 *
 * Defines the data models for the plugin registry system.
 * Supports version management, security scanning, and dependency resolution.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 */

/**
 * Plugin capability permissions
 */
export type PluginCapability =
    | 'filesystem:read'
    | 'filesystem:write'
    | 'network:http'
    | 'network:websocket'
    | 'system:env'
    | 'system:exec'
    | 'ai:claude'
    | 'ai:gemini';

/**
 * Security scan status
 */
export type ScanStatus = 'pending' | 'scanning' | 'passed' | 'failed' | 'warning';

/**
 * Plugin version status
 */
export type VersionStatus = 'draft' | 'published' | 'deprecated' | 'yanked';

/**
 * Plugin manifest - the plugin.json schema
 */
export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    capabilities?: PluginCapability[];
    dependencies?: Record<string, string>; // plugin-name: version-range
    peerDependencies?: Record<string, string>;
    hooks?: {
        PreToolUse?: HookDefinition[];
        PostToolUse?: HookDefinition[];
        Stop?: HookDefinition[];
        SubagentStop?: HookDefinition[];
        SessionStart?: HookDefinition[];
        SessionEnd?: HookDefinition[];
        UserPromptSubmit?: HookDefinition[];
    };
    commands?: CommandDefinition[];
    skills?: SkillDefinition[];
    agents?: AgentDefinition[];
    mcp?: MCPDefinition[];
}

export interface HookDefinition {
    command?: string;
    prompt?: string;
    matcher?: string;
}

export interface CommandDefinition {
    name: string;
    description: string;
    file: string;
    args?: CommandArg[];
}

export interface CommandArg {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: string | number | boolean;
}

export interface SkillDefinition {
    name: string;
    description: string;
    file: string;
}

export interface AgentDefinition {
    name: string;
    description: string;
    file: string;
    tools?: string[];
}

export interface MCPDefinition {
    name: string;
    type: 'stdio' | 'sse' | 'http';
    command?: string;
    url?: string;
    env?: Record<string, string>;
}

/**
 * Security scan result
 */
export interface SecurityScan {
    id: string;
    pluginId: string;
    version: string;
    status: ScanStatus;
    startedAt: Date;
    completedAt?: Date;
    findings: SecurityFinding[];
    score: number; // 0-100
}

export interface SecurityFinding {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    message: string;
    file?: string;
    line?: number;
    remediation?: string;
}

/**
 * Plugin version record
 */
export interface PluginVersion {
    id: string;
    pluginId: string;
    version: string;
    status: VersionStatus;
    manifest: PluginManifest;
    tarballUrl: string;
    tarballSha256: string;
    size: number;
    publishedAt: Date;
    publishedBy: string;
    downloads: number;
    securityScan?: SecurityScan;
}

/**
 * Plugin record - represents a plugin in the registry
 */
export interface Plugin {
    id: string;
    name: string;
    description: string;
    author: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    latestVersion: string;
    versions: string[];
    keywords: string[];
    homepage?: string;
    repository?: string;
    license: string;
    downloads: number;
    stars: number;
    verified: boolean;
    deprecated: boolean;
    deprecationMessage?: string;
}

/**
 * Registry user
 */
export interface RegistryUser {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    verified: boolean;
    tokens: APIToken[];
}

export interface APIToken {
    id: string;
    name: string;
    hashedToken: string;
    createdAt: Date;
    lastUsedAt?: Date;
    expiresAt?: Date;
    scopes: TokenScope[];
}

export type TokenScope = 'read' | 'publish' | 'admin';

/**
 * Search query parameters
 */
export interface SearchQuery {
    query?: string;
    author?: string;
    keywords?: string[];
    capability?: PluginCapability;
    sortBy?: 'downloads' | 'stars' | 'updated' | 'name';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

/**
 * Search result
 */
export interface SearchResult {
    plugins: Plugin[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Version resolution request
 */
export interface ResolutionRequest {
    plugins: Record<string, string>; // plugin-name: version-range
}

/**
 * Version resolution result
 */
export interface ResolutionResult {
    resolved: Record<string, string>; // plugin-name: resolved-version
    conflicts: ResolutionConflict[];
    warnings: string[];
}

export interface ResolutionConflict {
    plugin: string;
    requestedBy: string[];
    ranges: string[];
    suggestion?: string;
}

/**
 * Publish request
 */
export interface PublishRequest {
    manifest: PluginManifest;
    tarball: Buffer;
    token: string;
}

/**
 * Publish result
 */
export interface PublishResult {
    success: boolean;
    pluginId: string;
    version: string;
    tarballUrl: string;
    message: string;
    warnings?: string[];
}

/**
 * Registry statistics
 */
export interface RegistryStats {
    totalPlugins: number;
    totalVersions: number;
    totalDownloads: number;
    totalUsers: number;
    recentPublishes: PluginVersion[];
    topPlugins: Plugin[];
}

/**
 * Webhook event for registry changes
 */
export interface RegistryWebhookEvent {
    type: 'plugin.published' | 'plugin.deprecated' | 'plugin.yanked' | 'security.alert';
    timestamp: Date;
    plugin: string;
    version?: string;
    actor: string;
    data?: Record<string, unknown>;
}
