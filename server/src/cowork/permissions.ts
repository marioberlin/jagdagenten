/**
 * Cowork Permission Service
 *
 * Security layer that validates all file system operations before execution.
 * Enforces workspace boundaries, extension filters, and capability-based access control.
 */

import { resolve, extname, relative, isAbsolute } from 'path';
import { lstat, realpath } from 'fs/promises';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import type {
    FileOperationType,
    WorkspacePermissions,
    CoworkSession,
} from './types';

const logger = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

export interface PermissionCheckRequest {
    sessionId: string;
    operation: FileOperationType;
    path: string;
    targetPath?: string;      // For move/copy operations
    size?: number;            // For write operations (bytes)
    agentId?: string;         // For audit trail
}

export interface PermissionCheckResult {
    allowed: boolean;
    deniedAt?: 'normalize' | 'blocked_prefix' | 'boundary' | 'extension' | 'capability' | 'size' | 'sandbox';
    reason?: string;
    sanitizedPath?: string;
    sanitizedTargetPath?: string;
    warnings?: string[];
}

export interface SecurityPolicy {
    /** Paths that are always blocked */
    blockedPrefixes: string[];
    /** Paths that operations must stay within */
    allowedRoots: string[];
    /** File extensions that are blocked */
    blockedExtensions: string[];
    /** If set, only these extensions are allowed (whitelist mode) */
    allowedExtensions?: string[];
    /** Maximum size for a single file (bytes) */
    maxFileSize: number;
    /** Maximum total size per session (bytes) */
    maxTotalSize: number;
    /** Operation capabilities */
    capabilities: WorkspacePermissions;
}

export interface PermissionAuditEntry {
    id: string;
    timestamp: Date;
    sessionId: string;
    agentId?: string;
    operation: FileOperationType;
    requestedPath: string;
    resolvedPath?: string;
    targetPath?: string;
    allowed: boolean;
    deniedAt?: string;
    reason?: string;
}

export interface PermissionServiceConfig {
    /** Enable audit logging */
    enableAudit: boolean;
    /** Follow symlinks during path resolution */
    followSymlinks: boolean;
    /** Custom default policy overrides */
    defaultPolicy?: Partial<SecurityPolicy>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BLOCKED_PREFIXES = [
    // Unix system directories
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/opt',
    '/proc',
    '/sys',
    '/dev',
    '/boot',
    '/root',
    // macOS system directories
    '/System',
    '/Library',
    '/private',
    '/Applications',
    // Sensitive user directories
    '~/.ssh',
    '~/.gnupg',
    '~/.aws',
    '~/.config/gcloud',
    '~/.kube',
    '~/.docker',
    // Windows system directories (for cross-platform safety)
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
];

const DEFAULT_BLOCKED_EXTENSIONS = [
    // Executables
    '.exe', '.dll', '.so', '.dylib', '.app',
    // Shell scripts
    '.sh', '.bash', '.zsh', '.fish', '.ksh', '.csh',
    // Windows scripts
    '.bat', '.cmd', '.ps1', '.vbs', '.wsf',
    // Package formats
    '.dmg', '.pkg', '.deb', '.rpm', '.msi',
    // Other dangerous
    '.pif', '.scr', '.com',
];

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;  // 100MB
const DEFAULT_MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB per session

const DEFAULT_CAPABILITIES: WorkspacePermissions = {
    read: true,
    write: true,
    delete: false,  // Cautious default
    execute: false,
    network: false,
};

// ============================================================================
// Permission Service
// ============================================================================

export class PermissionService {
    private config: PermissionServiceConfig;
    private defaultPolicy: SecurityPolicy;
    private sessionPolicies: Map<string, Partial<SecurityPolicy>> = new Map();
    private sessionSizeTracking: Map<string, number> = new Map();
    private auditLog: PermissionAuditEntry[] = [];
    private sessionResolver?: (sessionId: string) => CoworkSession | undefined;
    private sandboxPathResolver?: (sandboxId: string) => string | undefined;

    constructor(config: Partial<PermissionServiceConfig> = {}) {
        this.config = {
            enableAudit: config.enableAudit ?? true,
            followSymlinks: config.followSymlinks ?? true,
            defaultPolicy: config.defaultPolicy,
        };

        this.defaultPolicy = {
            blockedPrefixes: [...DEFAULT_BLOCKED_PREFIXES],
            allowedRoots: [],  // Must be set per-session
            blockedExtensions: [...DEFAULT_BLOCKED_EXTENSIONS],
            allowedExtensions: undefined,
            maxFileSize: DEFAULT_MAX_FILE_SIZE,
            maxTotalSize: DEFAULT_MAX_TOTAL_SIZE,
            capabilities: { ...DEFAULT_CAPABILITIES },
            ...config.defaultPolicy,
        };
    }

    /**
     * Set the session resolver function (for getting session data)
     */
    setSessionResolver(resolver: (sessionId: string) => CoworkSession | undefined): void {
        this.sessionResolver = resolver;
    }

    /**
     * Set the sandbox path resolver function
     */
    setSandboxPathResolver(resolver: (sandboxId: string) => string | undefined): void {
        this.sandboxPathResolver = resolver;
    }

    /**
     * Main permission check - runs full validation pipeline
     */
    async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
        const policy = this.getEffectivePolicy(request.sessionId);
        const warnings: string[] = [];
        let result: PermissionCheckResult;

        try {
            // 1. Normalize and validate path
            const normalizeResult = await this.validateAndNormalizePath(request.path, policy);
            if (!normalizeResult.valid) {
                result = {
                    allowed: false,
                    deniedAt: 'normalize',
                    reason: normalizeResult.reason,
                };
                this.audit(request, result);
                return result;
            }
            const sanitizedPath = normalizeResult.resolved!;

            // Also validate target path for move/copy
            let sanitizedTargetPath: string | undefined;
            if (request.targetPath) {
                const targetResult = await this.validateAndNormalizePath(request.targetPath, policy);
                if (!targetResult.valid) {
                    result = {
                        allowed: false,
                        deniedAt: 'normalize',
                        reason: `Target path: ${targetResult.reason}`,
                    };
                    this.audit(request, result);
                    return result;
                }
                sanitizedTargetPath = targetResult.resolved;
            }

            // 2. Check blocked prefixes
            const blockedCheck = this.checkBlockedPrefixes(sanitizedPath, policy);
            if (!blockedCheck.allowed) {
                result = {
                    allowed: false,
                    deniedAt: 'blocked_prefix',
                    reason: blockedCheck.reason,
                    sanitizedPath,
                };
                this.audit(request, result);
                return result;
            }
            if (sanitizedTargetPath) {
                const targetBlockedCheck = this.checkBlockedPrefixes(sanitizedTargetPath, policy);
                if (!targetBlockedCheck.allowed) {
                    result = {
                        allowed: false,
                        deniedAt: 'blocked_prefix',
                        reason: `Target: ${targetBlockedCheck.reason}`,
                        sanitizedPath,
                        sanitizedTargetPath,
                    };
                    this.audit(request, result);
                    return result;
                }
            }

            // 3. Check workspace boundary
            const boundaryCheck = this.checkWorkspaceBoundary(sanitizedPath, policy);
            if (!boundaryCheck.allowed) {
                result = {
                    allowed: false,
                    deniedAt: 'boundary',
                    reason: boundaryCheck.reason,
                    sanitizedPath,
                };
                this.audit(request, result);
                return result;
            }
            if (sanitizedTargetPath) {
                const targetBoundaryCheck = this.checkWorkspaceBoundary(sanitizedTargetPath, policy);
                if (!targetBoundaryCheck.allowed) {
                    result = {
                        allowed: false,
                        deniedAt: 'boundary',
                        reason: `Target: ${targetBoundaryCheck.reason}`,
                        sanitizedPath,
                        sanitizedTargetPath,
                    };
                    this.audit(request, result);
                    return result;
                }
            }

            // 4. Check extension filter
            const extensionCheck = this.checkExtension(sanitizedPath, policy);
            if (!extensionCheck.allowed) {
                result = {
                    allowed: false,
                    deniedAt: 'extension',
                    reason: extensionCheck.reason,
                    sanitizedPath,
                };
                this.audit(request, result);
                return result;
            }

            // 5. Check capability
            const capabilityCheck = this.checkCapability(request.operation, policy);
            if (!capabilityCheck.allowed) {
                result = {
                    allowed: false,
                    deniedAt: 'capability',
                    reason: capabilityCheck.reason,
                    sanitizedPath,
                };
                this.audit(request, result);
                return result;
            }

            // 6. Check size limits (for write operations)
            if (request.size !== undefined && ['create', 'update'].includes(request.operation)) {
                const sizeCheck = this.checkSize(request.sessionId, request.size, policy);
                if (!sizeCheck.allowed) {
                    result = {
                        allowed: false,
                        deniedAt: 'size',
                        reason: sizeCheck.reason,
                        sanitizedPath,
                    };
                    this.audit(request, result);
                    return result;
                }
                if (sizeCheck.warning) {
                    warnings.push(sizeCheck.warning);
                }
            }

            // 7. Check sandbox isolation
            const sandboxCheck = await this.checkSandboxIsolation(request.sessionId, sanitizedPath);
            if (!sandboxCheck.allowed) {
                result = {
                    allowed: false,
                    deniedAt: 'sandbox',
                    reason: sandboxCheck.reason,
                    sanitizedPath,
                };
                this.audit(request, result);
                return result;
            }

            // All checks passed
            result = {
                allowed: true,
                sanitizedPath,
                sanitizedTargetPath,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
            this.audit(request, result);
            return result;

        } catch (error: any) {
            result = {
                allowed: false,
                deniedAt: 'normalize',
                reason: `Validation error: ${error.message}`,
            };
            this.audit(request, result);
            return result;
        }
    }

    /**
     * Validate and normalize a path
     */
    private async validateAndNormalizePath(
        path: string,
        policy: SecurityPolicy
    ): Promise<{ valid: boolean; resolved?: string; reason?: string }> {
        // Check for null bytes (injection attack)
        if (path.includes('\0')) {
            return { valid: false, reason: 'Path contains null bytes' };
        }

        // Expand home directory
        let normalizedPath = path.replace(/^~/, process.env.HOME || '/tmp');

        // Resolve to absolute path
        if (!isAbsolute(normalizedPath)) {
            // Use first allowed root as base, or cwd if none
            const base = policy.allowedRoots[0] || process.cwd();
            normalizedPath = resolve(base, normalizedPath);
        } else {
            normalizedPath = resolve(normalizedPath);
        }

        // Follow symlinks if enabled
        if (this.config.followSymlinks) {
            try {
                const stats = await lstat(normalizedPath);
                if (stats.isSymbolicLink()) {
                    const realPath = await realpath(normalizedPath);
                    // Check if symlink target is also valid
                    if (realPath !== normalizedPath) {
                        normalizedPath = realPath;
                    }
                }
            } catch {
                // File doesn't exist yet, that's OK for create operations
            }
        }

        // Check for path traversal attempts after resolution
        const traversalPatterns = ['..', './', '/./'];
        for (const pattern of traversalPatterns) {
            if (normalizedPath.includes(pattern)) {
                return { valid: false, reason: 'Path contains traversal sequences after resolution' };
            }
        }

        return { valid: true, resolved: normalizedPath };
    }

    /**
     * Check if path starts with any blocked prefix
     */
    private checkBlockedPrefixes(
        path: string,
        policy: SecurityPolicy
    ): { allowed: boolean; reason?: string } {
        // Expand home directory in blocked prefixes
        const expandedBlockedPrefixes = policy.blockedPrefixes.map(prefix =>
            prefix.replace(/^~/, process.env.HOME || '/tmp')
        );

        for (const prefix of expandedBlockedPrefixes) {
            if (path.startsWith(prefix)) {
                return {
                    allowed: false,
                    reason: `Access to ${prefix} is blocked for security`,
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Check if path is within allowed workspace boundaries
     */
    private checkWorkspaceBoundary(
        path: string,
        policy: SecurityPolicy
    ): { allowed: boolean; reason?: string } {
        // If no allowed roots specified, deny all
        if (policy.allowedRoots.length === 0) {
            return {
                allowed: false,
                reason: 'No workspace boundaries configured',
            };
        }

        // Check if path is within any allowed root
        for (const root of policy.allowedRoots) {
            const expandedRoot = root.replace(/^~/, process.env.HOME || '/tmp');
            const relativePath = relative(expandedRoot, path);

            // If relative path doesn't start with '..', it's within the root
            if (!relativePath.startsWith('..') && !isAbsolute(relativePath)) {
                return { allowed: true };
            }
        }

        return {
            allowed: false,
            reason: `Path is outside workspace boundaries: ${policy.allowedRoots.join(', ')}`,
        };
    }

    /**
     * Check file extension against filters
     */
    private checkExtension(
        path: string,
        policy: SecurityPolicy
    ): { allowed: boolean; reason?: string } {
        const ext = extname(path).toLowerCase();

        // If no extension, allow (directories, etc.)
        if (!ext) {
            return { allowed: true };
        }

        // Whitelist mode: only allow specified extensions
        if (policy.allowedExtensions && policy.allowedExtensions.length > 0) {
            if (!policy.allowedExtensions.includes(ext)) {
                return {
                    allowed: false,
                    reason: `Extension ${ext} is not in allowed list`,
                };
            }
            return { allowed: true };
        }

        // Blacklist mode: block dangerous extensions
        if (policy.blockedExtensions.includes(ext)) {
            return {
                allowed: false,
                reason: `Extension ${ext} is blocked for security`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check if operation type is allowed by capabilities
     */
    private checkCapability(
        operation: FileOperationType,
        policy: SecurityPolicy
    ): { allowed: boolean; reason?: string } {
        const caps = policy.capabilities;

        switch (operation) {
            case 'read':
                if (!caps.read) {
                    return { allowed: false, reason: 'Read operations not permitted' };
                }
                break;

            case 'create':
            case 'update':
                if (!caps.write) {
                    return { allowed: false, reason: 'Write operations not permitted' };
                }
                break;

            case 'delete':
                if (!caps.delete) {
                    return { allowed: false, reason: 'Delete operations not permitted' };
                }
                break;

            case 'move':
            case 'copy':
                if (!caps.read || !caps.write) {
                    return {
                        allowed: false,
                        reason: `${operation} requires both read and write permissions`,
                    };
                }
                break;
        }

        return { allowed: true };
    }

    /**
     * Check file size limits
     */
    private checkSize(
        sessionId: string,
        size: number,
        policy: SecurityPolicy
    ): { allowed: boolean; reason?: string; warning?: string } {
        // Check single file size
        if (size > policy.maxFileSize) {
            return {
                allowed: false,
                reason: `File size ${this.formatBytes(size)} exceeds limit of ${this.formatBytes(policy.maxFileSize)}`,
            };
        }

        // Check cumulative session size
        const currentTotal = this.sessionSizeTracking.get(sessionId) || 0;
        const newTotal = currentTotal + size;

        if (newTotal > policy.maxTotalSize) {
            return {
                allowed: false,
                reason: `Session total ${this.formatBytes(newTotal)} would exceed limit of ${this.formatBytes(policy.maxTotalSize)}`,
            };
        }

        // Warn if approaching limit
        let warning: string | undefined;
        if (newTotal > policy.maxTotalSize * 0.8) {
            warning = `Session is at ${Math.round((newTotal / policy.maxTotalSize) * 100)}% of size limit`;
        }

        // Track the size (will be committed if operation succeeds)
        this.sessionSizeTracking.set(sessionId, newTotal);

        return { allowed: true, warning };
    }

    /**
     * Check sandbox isolation (if session uses sandbox)
     */
    private async checkSandboxIsolation(
        sessionId: string,
        path: string
    ): Promise<{ allowed: boolean; reason?: string }> {
        if (!this.sessionResolver || !this.sandboxPathResolver) {
            return { allowed: true };  // No resolver, skip check
        }

        const session = this.sessionResolver(sessionId);
        if (!session?.sandboxId) {
            return { allowed: true };  // No sandbox, skip check
        }

        const sandboxPath = this.sandboxPathResolver(session.sandboxId);
        if (!sandboxPath) {
            return { allowed: true };  // Sandbox path not found, skip check
        }

        // Path must be within sandbox
        const relativePath = relative(sandboxPath, path);
        if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
            return {
                allowed: false,
                reason: `Path escapes sandbox boundary at ${sandboxPath}`,
            };
        }

        return { allowed: true };
    }

    // ========================================================================
    // Convenience Methods
    // ========================================================================

    /**
     * Quick check for read permission
     */
    async canRead(sessionId: string, path: string): Promise<boolean> {
        const result = await this.checkPermission({
            sessionId,
            operation: 'read',
            path,
        });
        return result.allowed;
    }

    /**
     * Quick check for write permission
     */
    async canWrite(sessionId: string, path: string, size?: number): Promise<boolean> {
        const result = await this.checkPermission({
            sessionId,
            operation: 'update',
            path,
            size,
        });
        return result.allowed;
    }

    /**
     * Quick check for create permission
     */
    async canCreate(sessionId: string, path: string, size?: number): Promise<boolean> {
        const result = await this.checkPermission({
            sessionId,
            operation: 'create',
            path,
            size,
        });
        return result.allowed;
    }

    /**
     * Quick check for delete permission
     */
    async canDelete(sessionId: string, path: string): Promise<boolean> {
        const result = await this.checkPermission({
            sessionId,
            operation: 'delete',
            path,
        });
        return result.allowed;
    }

    // ========================================================================
    // Policy Management
    // ========================================================================

    /**
     * Get the effective policy for a session (merges defaults + session overrides)
     */
    getEffectivePolicy(sessionId: string): SecurityPolicy {
        const policy = { ...this.defaultPolicy };

        // Merge session-specific policy
        const sessionPolicy = this.sessionPolicies.get(sessionId);
        if (sessionPolicy) {
            if (sessionPolicy.blockedPrefixes) {
                policy.blockedPrefixes = [...policy.blockedPrefixes, ...sessionPolicy.blockedPrefixes];
            }
            if (sessionPolicy.allowedRoots) {
                policy.allowedRoots = sessionPolicy.allowedRoots;
            }
            if (sessionPolicy.blockedExtensions) {
                policy.blockedExtensions = [...policy.blockedExtensions, ...sessionPolicy.blockedExtensions];
            }
            if (sessionPolicy.allowedExtensions) {
                policy.allowedExtensions = sessionPolicy.allowedExtensions;
            }
            if (sessionPolicy.maxFileSize !== undefined) {
                policy.maxFileSize = sessionPolicy.maxFileSize;
            }
            if (sessionPolicy.maxTotalSize !== undefined) {
                policy.maxTotalSize = sessionPolicy.maxTotalSize;
            }
            if (sessionPolicy.capabilities) {
                policy.capabilities = { ...policy.capabilities, ...sessionPolicy.capabilities };
            }
        }

        // Merge workspace config from session if available
        if (this.sessionResolver) {
            const session = this.sessionResolver(sessionId);
            if (session?.workspace) {
                // Add workspace paths to allowed roots
                policy.allowedRoots = [
                    ...session.workspace.inputPaths,
                    session.workspace.outputPath,
                    session.workspace.tempPath,
                ].filter(Boolean);

                // Merge workspace permissions
                policy.capabilities = { ...policy.capabilities, ...session.workspace.permissions };

                // Merge extension filters
                if (session.workspace.allowedExtensions?.length) {
                    policy.allowedExtensions = session.workspace.allowedExtensions;
                }
                if (session.workspace.blockedExtensions?.length) {
                    policy.blockedExtensions = [...policy.blockedExtensions, ...session.workspace.blockedExtensions];
                }

                // Use workspace max file size
                if (session.workspace.maxFileSize) {
                    policy.maxFileSize = session.workspace.maxFileSize;
                }

                // Override with sandbox path if active
                if (session.sandboxId && this.sandboxPathResolver) {
                    const sandboxPath = this.sandboxPathResolver(session.sandboxId);
                    if (sandboxPath) {
                        policy.allowedRoots = [sandboxPath];
                        // More restrictive in sandbox mode
                        policy.capabilities.delete = false;
                    }
                }
            }
        }

        return policy;
    }

    /**
     * Set session-specific policy overrides
     */
    setSessionPolicy(sessionId: string, overrides: Partial<SecurityPolicy>): void {
        this.sessionPolicies.set(sessionId, overrides);
        logger.info({ sessionId, overrides: Object.keys(overrides) }, 'Session policy updated');
    }

    /**
     * Clear session-specific policy
     */
    clearSessionPolicy(sessionId: string): void {
        this.sessionPolicies.delete(sessionId);
        this.sessionSizeTracking.delete(sessionId);
        logger.info({ sessionId }, 'Session policy cleared');
    }

    // ========================================================================
    // Audit
    // ========================================================================

    /**
     * Record an audit entry
     */
    private audit(request: PermissionCheckRequest, result: PermissionCheckResult): void {
        if (!this.config.enableAudit) return;

        const entry: PermissionAuditEntry = {
            id: randomUUID(),
            timestamp: new Date(),
            sessionId: request.sessionId,
            agentId: request.agentId,
            operation: request.operation,
            requestedPath: request.path,
            resolvedPath: result.sanitizedPath,
            targetPath: request.targetPath,
            allowed: result.allowed,
            deniedAt: result.deniedAt,
            reason: result.reason,
        };

        this.auditLog.push(entry);

        // Keep audit log bounded (last 10000 entries)
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }

        // Log denied access attempts
        if (!result.allowed) {
            logger.warn({
                sessionId: request.sessionId,
                operation: request.operation,
                path: request.path,
                deniedAt: result.deniedAt,
                reason: result.reason,
            }, 'Permission denied');
        }
    }

    /**
     * Get audit log for a session
     */
    getAuditLog(sessionId: string, limit = 100): PermissionAuditEntry[] {
        return this.auditLog
            .filter(entry => entry.sessionId === sessionId)
            .slice(-limit);
    }

    /**
     * Get all denied access attempts
     */
    getDeniedAttempts(limit = 100): PermissionAuditEntry[] {
        return this.auditLog
            .filter(entry => !entry.allowed)
            .slice(-limit);
    }

    // ========================================================================
    // Utilities
    // ========================================================================

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const permissionService = new PermissionService();
export default permissionService;
