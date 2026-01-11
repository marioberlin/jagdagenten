/**
 * Plugin Sandbox Execution
 *
 * Provides isolated execution environment for plugin commands with:
 * - Environment variable filtering
 * - Temporary sandbox directories
 * - Timeout enforcement
 * - Resource cleanup
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.1 Plugin Sandbox Execution
 */

import { spawn } from 'child_process';
import { mkdir, rm, cp, access } from 'fs/promises';
import { join, resolve, basename, dirname } from 'path';
import { randomUUID } from 'crypto';
import { componentLoggers } from './logger.js';

const sandboxLog = componentLoggers.security;

/**
 * Configuration options for sandbox execution
 */
export interface SandboxOptions {
    /** Maximum execution time in milliseconds (default: 30000) */
    timeout: number;
    /** Maximum memory in bytes (default: 128MB) */
    maxMemory: number;
    /** Environment variables allowed to pass through */
    allowedEnv: string[];
    /** Paths allowed to be copied to sandbox */
    allowedPaths: string[];
    /** Working directory for command execution */
    cwd?: string;
    /** Whether to inherit parent process stdio */
    inheritStdio?: boolean;
    /** Custom sandbox root directory (default: /tmp) */
    sandboxRoot?: string;
}

/**
 * Result from sandbox execution
 */
export interface SandboxResult {
    /** Standard output from the command */
    stdout: string;
    /** Standard error from the command */
    stderr: string;
    /** Exit code (0 = success) */
    exitCode: number;
    /** Whether execution was killed due to timeout */
    timedOut: boolean;
    /** Execution duration in milliseconds */
    duration: number;
    /** Sandbox directory path (for debugging) */
    sandboxPath: string;
}

/**
 * Permission declarations for plugins
 */
export interface PluginPermissions {
    /** Allowed file system paths (globs) */
    filesystem?: string[];
    /** Allowed network hosts */
    network?: string[];
    /** Allowed environment variables */
    env?: string[];
    /** Maximum execution time override */
    maxTimeout?: number;
    /** Maximum memory override */
    maxMemory?: number;
}

/**
 * Default sandbox configuration
 */
const DEFAULT_OPTIONS: SandboxOptions = {
    timeout: 30000, // 30 seconds
    maxMemory: 128 * 1024 * 1024, // 128MB
    allowedEnv: ['PATH', 'HOME', 'NODE_ENV', 'BUN_INSTALL', 'TERM'],
    allowedPaths: [],
    inheritStdio: false,
    sandboxRoot: '/tmp'
};

/**
 * Active sandbox tracking for cleanup
 */
const activeSandboxes = new Set<string>();

/**
 * Run a command in an isolated sandbox environment
 *
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Sandbox configuration options
 * @returns Promise resolving to sandbox execution result
 *
 * @example
 * ```typescript
 * const result = await runInSandbox('bun', ['run', 'audit.ts'], {
 *     allowedPaths: ['/path/to/plugin'],
 *     timeout: 10000
 * });
 *
 * if (result.exitCode === 0) {
 *     console.log('Output:', result.stdout);
 * } else {
 *     console.error('Failed:', result.stderr);
 * }
 * ```
 */
export async function runInSandbox(
    command: string,
    args: string[] = [],
    options: Partial<SandboxOptions> = {}
): Promise<SandboxResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sandboxId = randomUUID();
    const sandboxPath = join(opts.sandboxRoot!, `liquid-sandbox-${sandboxId}`);
    const startTime = Date.now();

    sandboxLog.info({
        sandboxId,
        command,
        args,
        timeout: opts.timeout,
        allowedPaths: opts.allowedPaths.length
    }, 'Starting sandbox execution');

    try {
        // Create sandbox directory
        await mkdir(sandboxPath, { recursive: true });
        activeSandboxes.add(sandboxPath);

        // Copy allowed paths to sandbox
        for (const sourcePath of opts.allowedPaths) {
            try {
                await access(sourcePath);
                const targetPath = join(sandboxPath, basename(sourcePath));
                await cp(sourcePath, targetPath, { recursive: true });
            } catch (err) {
                sandboxLog.warn({
                    sandboxId,
                    path: sourcePath,
                    error: (err as Error).message
                }, 'Failed to copy path to sandbox');
            }
        }

        // Build filtered environment
        const safeEnv: Record<string, string> = {};
        for (const key of opts.allowedEnv) {
            if (process.env[key]) {
                safeEnv[key] = process.env[key]!;
            }
        }

        // Add sandbox-specific variables
        safeEnv['SANDBOX_ID'] = sandboxId;
        safeEnv['SANDBOX_PATH'] = sandboxPath;

        // Determine working directory
        const cwd = opts.cwd ? join(sandboxPath, basename(opts.cwd)) : sandboxPath;

        // Execute command
        const result = await executeWithTimeout(
            command,
            args,
            {
                cwd,
                env: safeEnv,
                timeout: opts.timeout
            }
        );

        const duration = Date.now() - startTime;

        sandboxLog.info({
            sandboxId,
            exitCode: result.exitCode,
            timedOut: result.timedOut,
            duration,
            stdoutLength: result.stdout.length,
            stderrLength: result.stderr.length
        }, 'Sandbox execution completed');

        return {
            ...result,
            duration,
            sandboxPath
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        sandboxLog.error({
            sandboxId,
            error: (error as Error).message,
            duration
        }, 'Sandbox execution failed');

        return {
            stdout: '',
            stderr: (error as Error).message,
            exitCode: 1,
            timedOut: false,
            duration,
            sandboxPath
        };
    } finally {
        // Cleanup sandbox directory
        await cleanupSandbox(sandboxPath);
        activeSandboxes.delete(sandboxPath);
    }
}

/**
 * Execute a command with timeout enforcement
 */
async function executeWithTimeout(
    command: string,
    args: string[],
    options: {
        cwd: string;
        env: Record<string, string>;
        timeout: number;
    }
): Promise<Omit<SandboxResult, 'duration' | 'sandboxPath'>> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let resolved = false;

        const proc = spawn(command, args, {
            cwd: options.cwd,
            env: options.env,
            shell: false, // Don't use shell for better isolation
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Collect stdout
        proc.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
            // Limit output size to prevent memory issues
            if (stdout.length > 1024 * 1024) {
                stdout = stdout.slice(-1024 * 1024);
            }
        });

        // Collect stderr
        proc.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
            if (stderr.length > 1024 * 1024) {
                stderr = stderr.slice(-1024 * 1024);
            }
        });

        // Timeout handler
        const timeoutHandle = setTimeout(() => {
            if (!resolved) {
                timedOut = true;
                proc.kill('SIGKILL');
            }
        }, options.timeout);

        // Process completion
        proc.on('close', (code) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutHandle);
                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: timedOut ? 124 : (code ?? 1), // 124 is conventional timeout exit code
                    timedOut
                });
            }
        });

        // Process error
        proc.on('error', (error) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutHandle);
                resolve({
                    stdout: '',
                    stderr: error.message,
                    exitCode: 1,
                    timedOut: false
                });
            }
        });
    });
}

/**
 * Cleanup sandbox directory
 */
async function cleanupSandbox(sandboxPath: string): Promise<void> {
    try {
        await rm(sandboxPath, { recursive: true, force: true });
    } catch (error) {
        sandboxLog.warn({
            path: sandboxPath,
            error: (error as Error).message
        }, 'Failed to cleanup sandbox directory');
    }
}

/**
 * Run a plugin hook command in sandbox
 *
 * @param pluginRoot - Root directory of the plugin
 * @param command - The hook command from plugin.json
 * @param permissions - Plugin-declared permissions
 * @returns Promise resolving to sandbox execution result
 *
 * @example
 * ```typescript
 * // From plugin.json hook:
 * // "command": "bun run ${CLAUDE_PLUGIN_ROOT}/tools/audit.ts"
 *
 * const result = await runPluginHook(
 *     '/path/to/plugin',
 *     'bun run ${CLAUDE_PLUGIN_ROOT}/tools/audit.ts',
 *     { env: ['API_KEY'] }
 * );
 * ```
 */
export async function runPluginHook(
    pluginRoot: string,
    command: string,
    permissions: PluginPermissions = {}
): Promise<SandboxResult> {
    // Expand ${CLAUDE_PLUGIN_ROOT} variable
    const expandedCommand = command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, pluginRoot);

    // Parse command into parts
    const parts = expandedCommand.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Build allowed paths
    const allowedPaths = [
        pluginRoot,
        ...(permissions.filesystem || [])
    ];

    // Build allowed env
    const allowedEnv = [
        ...DEFAULT_OPTIONS.allowedEnv,
        ...(permissions.env || [])
    ];

    // Apply timeout override
    const timeout = permissions.maxTimeout
        ? Math.min(permissions.maxTimeout, 60000) // Cap at 60 seconds
        : DEFAULT_OPTIONS.timeout;

    return runInSandbox(cmd, args, {
        allowedPaths,
        allowedEnv,
        timeout,
        cwd: pluginRoot
    });
}

/**
 * Validate plugin permissions against policy
 *
 * @param permissions - Plugin-declared permissions
 * @returns Validation result with any issues found
 */
export function validatePluginPermissions(permissions: PluginPermissions): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    // Check filesystem paths
    if (permissions.filesystem) {
        for (const path of permissions.filesystem) {
            // Disallow absolute paths outside of expected directories
            if (path.startsWith('/') && !path.startsWith('/tmp') && !path.includes('LiquidSkills')) {
                issues.push(`Filesystem access to '${path}' is not allowed`);
            }
            // Disallow parent traversal
            if (path.includes('..')) {
                issues.push(`Path traversal not allowed in '${path}'`);
            }
        }
    }

    // Check network hosts
    if (permissions.network) {
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.'];
        for (const host of permissions.network) {
            if (blockedHosts.some(blocked => host.includes(blocked))) {
                issues.push(`Network access to '${host}' is blocked`);
            }
        }
    }

    // Check env variables
    if (permissions.env) {
        const sensitiveEnv = ['AWS_SECRET', 'PRIVATE_KEY', 'PASSWORD', 'TOKEN', 'CREDENTIAL'];
        for (const env of permissions.env) {
            if (sensitiveEnv.some(s => env.toUpperCase().includes(s))) {
                issues.push(`Access to sensitive environment variable '${env}' requires approval`);
            }
        }
    }

    // Check timeout
    if (permissions.maxTimeout && permissions.maxTimeout > 60000) {
        issues.push(`Timeout ${permissions.maxTimeout}ms exceeds maximum (60000ms)`);
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Parse plugin.json and extract permission requirements
 *
 * @param pluginJsonPath - Path to plugin.json file
 * @returns Extracted permissions or null if parsing fails
 */
export async function extractPluginPermissions(
    pluginJsonPath: string
): Promise<PluginPermissions | null> {
    try {
        const file = Bun.file(pluginJsonPath);
        if (!await file.exists()) {
            return null;
        }

        const pluginConfig = await file.json();
        const permissions: PluginPermissions = {};

        // Extract from explicit permissions field
        if (pluginConfig.permissions) {
            Object.assign(permissions, pluginConfig.permissions);
        }

        // Infer from hooks
        if (pluginConfig.hooks) {
            const commands: string[] = [];
            for (const hookType of Object.values(pluginConfig.hooks) as any[]) {
                for (const hook of hookType) {
                    if (hook.hooks) {
                        for (const h of hook.hooks) {
                            if (h.command) {
                                commands.push(h.command);
                            }
                        }
                    }
                }
            }

            // Infer filesystem needs from commands
            for (const cmd of commands) {
                if (cmd.includes('${CLAUDE_PLUGIN_ROOT}')) {
                    const pluginDir = dirname(pluginJsonPath);
                    if (!permissions.filesystem) {
                        permissions.filesystem = [];
                    }
                    if (!permissions.filesystem.includes(pluginDir)) {
                        permissions.filesystem.push(pluginDir);
                    }
                }
            }
        }

        return permissions;
    } catch (error) {
        sandboxLog.warn({
            path: pluginJsonPath,
            error: (error as Error).message
        }, 'Failed to parse plugin.json');
        return null;
    }
}

/**
 * Cleanup all active sandboxes (for graceful shutdown)
 */
export async function cleanupAllSandboxes(): Promise<void> {
    sandboxLog.info({ count: activeSandboxes.size }, 'Cleaning up all active sandboxes');

    const cleanupPromises = Array.from(activeSandboxes).map(path => cleanupSandbox(path));
    await Promise.allSettled(cleanupPromises);
    activeSandboxes.clear();
}

/**
 * Get sandbox statistics
 */
export function getSandboxStats(): {
    activeSandboxes: number;
    sandboxPaths: string[];
} {
    return {
        activeSandboxes: activeSandboxes.size,
        sandboxPaths: Array.from(activeSandboxes)
    };
}

// Register cleanup on process exit
process.on('SIGTERM', () => {
    cleanupAllSandboxes().catch(err => {
        sandboxLog.error({ error: err.message }, 'Failed to cleanup sandboxes on SIGTERM');
    });
});

process.on('SIGINT', () => {
    cleanupAllSandboxes().catch(err => {
        sandboxLog.error({ error: err.message }, 'Failed to cleanup sandboxes on SIGINT');
    });
});

export default {
    runInSandbox,
    runPluginHook,
    validatePluginPermissions,
    extractPluginPermissions,
    cleanupAllSandboxes,
    getSandboxStats
};
