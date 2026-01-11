/**
 * Plugin Validator and Security Scanner
 *
 * Validates plugin manifests and performs security scans on plugin code.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 */

import { randomUUID } from 'crypto';
import { saveScan, getVersion, saveVersion } from './store.js';
import type {
    PluginManifest,
    PluginCapability,
    SecurityScan,
    SecurityFinding,
    ScanStatus
} from './types.js';

// Lazy logger import
let _logger: any = null;

function getLogger() {
    if (_logger === null) {
        try {
            const { componentLoggers } = require('../logger.js');
            _logger = componentLoggers.http;
        } catch {
            _logger = {
                info: console.log,
                error: console.error,
                warn: console.warn,
                debug: () => {}
            };
        }
    }
    return _logger;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    warnings: string[];
}

export interface ValidationIssue {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

// Valid plugin name regex
const PLUGIN_NAME_REGEX = /^[a-z][a-z0-9-]*[a-z0-9]$/;

// Valid semver regex
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

// Valid capabilities
const VALID_CAPABILITIES: PluginCapability[] = [
    'filesystem:read',
    'filesystem:write',
    'network:http',
    'network:websocket',
    'system:env',
    'system:exec',
    'ai:claude',
    'ai:gemini'
];

// Reserved plugin names
const RESERVED_NAMES = [
    'core',
    'liquid',
    'glass',
    'system',
    'admin',
    'registry',
    'official',
    'api',
    'cli',
    'sdk'
];

// Dangerous patterns in code
const DANGEROUS_PATTERNS = [
    { pattern: /eval\s*\(/, message: 'Use of eval() is dangerous', severity: 'high' as const },
    {
        pattern: /new\s+Function\s*\(/,
        message: 'Dynamic function creation is dangerous',
        severity: 'high' as const
    },
    {
        pattern: /child_process/,
        message: 'Direct child_process access detected',
        severity: 'medium' as const
    },
    {
        pattern: /process\.exit/,
        message: 'process.exit() can terminate the host',
        severity: 'medium' as const
    },
    {
        pattern: /require\s*\(\s*[`'"]fs[`'"]\s*\)/,
        message: 'Direct filesystem access detected',
        severity: 'low' as const
    },
    {
        pattern: /\bexec\b.*\$\{/,
        message: 'Potential command injection',
        severity: 'critical' as const
    },
    { pattern: /rm\s+-rf\s+\//, message: 'Dangerous file deletion pattern', severity: 'critical' as const },
    {
        pattern: /process\.env\./,
        message: 'Environment variable access detected',
        severity: 'low' as const
    },
    {
        pattern: /(?:api[_-]?key|secret|password|token)\s*[=:]/i,
        message: 'Potential hardcoded secret',
        severity: 'high' as const
    }
];

/**
 * Validate plugin manifest
 */
export function validateManifest(manifest: PluginManifest): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.name) {
        issues.push({ field: 'name', message: 'Name is required', severity: 'error' });
    } else {
        // Validate name format
        if (!PLUGIN_NAME_REGEX.test(manifest.name)) {
            issues.push({
                field: 'name',
                message:
                    'Name must start with lowercase letter, contain only lowercase letters, numbers, and hyphens',
                severity: 'error'
            });
        }

        // Check reserved names
        if (RESERVED_NAMES.includes(manifest.name.toLowerCase())) {
            issues.push({
                field: 'name',
                message: `"${manifest.name}" is a reserved name`,
                severity: 'error'
            });
        }

        // Check length
        if (manifest.name.length < 2 || manifest.name.length > 64) {
            issues.push({
                field: 'name',
                message: 'Name must be between 2 and 64 characters',
                severity: 'error'
            });
        }
    }

    if (!manifest.version) {
        issues.push({ field: 'version', message: 'Version is required', severity: 'error' });
    } else if (!SEMVER_REGEX.test(manifest.version)) {
        issues.push({
            field: 'version',
            message: 'Version must be valid semver (e.g., 1.0.0)',
            severity: 'error'
        });
    }

    if (!manifest.description) {
        issues.push({
            field: 'description',
            message: 'Description is required',
            severity: 'error'
        });
    } else if (manifest.description.length < 10) {
        warnings.push('Description should be at least 10 characters');
    }

    if (!manifest.author) {
        issues.push({ field: 'author', message: 'Author is required', severity: 'error' });
    }

    if (!manifest.license) {
        issues.push({ field: 'license', message: 'License is required', severity: 'error' });
    }

    // Validate capabilities
    if (manifest.capabilities) {
        for (const cap of manifest.capabilities) {
            if (!VALID_CAPABILITIES.includes(cap)) {
                issues.push({
                    field: 'capabilities',
                    message: `Unknown capability: ${cap}`,
                    severity: 'error'
                });
            }
        }

        // Check for dangerous capability combinations
        if (
            manifest.capabilities.includes('system:exec') &&
            manifest.capabilities.includes('network:http')
        ) {
            warnings.push(
                'Plugin requests both system:exec and network:http - this is a powerful combination'
            );
        }
    }

    // Validate dependencies
    if (manifest.dependencies) {
        for (const [dep, range] of Object.entries(manifest.dependencies)) {
            if (!PLUGIN_NAME_REGEX.test(dep)) {
                issues.push({
                    field: 'dependencies',
                    message: `Invalid dependency name: ${dep}`,
                    severity: 'error'
                });
            }

            // Basic semver range validation
            if (!isValidVersionRange(range)) {
                issues.push({
                    field: 'dependencies',
                    message: `Invalid version range for ${dep}: ${range}`,
                    severity: 'error'
                });
            }
        }
    }

    // Validate hooks
    if (manifest.hooks) {
        const validHookTypes = [
            'PreToolUse',
            'PostToolUse',
            'Stop',
            'SubagentStop',
            'SessionStart',
            'SessionEnd',
            'UserPromptSubmit'
        ];

        for (const [hookType, hooks] of Object.entries(manifest.hooks)) {
            if (!validHookTypes.includes(hookType)) {
                issues.push({
                    field: 'hooks',
                    message: `Unknown hook type: ${hookType}`,
                    severity: 'error'
                });
            }

            if (Array.isArray(hooks)) {
                for (const hook of hooks) {
                    if (!hook.command && !hook.prompt) {
                        issues.push({
                            field: 'hooks',
                            message: `Hook in ${hookType} must have either command or prompt`,
                            severity: 'error'
                        });
                    }
                }
            }
        }
    }

    // Validate commands
    if (manifest.commands) {
        for (const cmd of manifest.commands) {
            if (!cmd.name) {
                issues.push({
                    field: 'commands',
                    message: 'Command must have a name',
                    severity: 'error'
                });
            }

            if (!cmd.file) {
                issues.push({
                    field: 'commands',
                    message: `Command ${cmd.name} must have a file`,
                    severity: 'error'
                });
            }
        }
    }

    // Validate skills
    if (manifest.skills) {
        for (const skill of manifest.skills) {
            if (!skill.name) {
                issues.push({
                    field: 'skills',
                    message: 'Skill must have a name',
                    severity: 'error'
                });
            }

            if (!skill.file) {
                issues.push({
                    field: 'skills',
                    message: `Skill ${skill.name} must have a file`,
                    severity: 'error'
                });
            }
        }
    }

    // Validate agents
    if (manifest.agents) {
        for (const agent of manifest.agents) {
            if (!agent.name) {
                issues.push({
                    field: 'agents',
                    message: 'Agent must have a name',
                    severity: 'error'
                });
            }

            if (!agent.file) {
                issues.push({
                    field: 'agents',
                    message: `Agent ${agent.name} must have a file`,
                    severity: 'error'
                });
            }
        }
    }

    // Validate MCP servers
    if (manifest.mcp) {
        for (const mcp of manifest.mcp) {
            if (!mcp.name) {
                issues.push({
                    field: 'mcp',
                    message: 'MCP server must have a name',
                    severity: 'error'
                });
            }

            if (!['stdio', 'sse', 'http'].includes(mcp.type)) {
                issues.push({
                    field: 'mcp',
                    message: `MCP server ${mcp.name} has invalid type: ${mcp.type}`,
                    severity: 'error'
                });
            }

            if (mcp.type === 'stdio' && !mcp.command) {
                issues.push({
                    field: 'mcp',
                    message: `MCP server ${mcp.name} (stdio) must have a command`,
                    severity: 'error'
                });
            }

            if ((mcp.type === 'sse' || mcp.type === 'http') && !mcp.url) {
                issues.push({
                    field: 'mcp',
                    message: `MCP server ${mcp.name} (${mcp.type}) must have a URL`,
                    severity: 'error'
                });
            }
        }
    }

    return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        issues,
        warnings
    };
}

/**
 * Validate semver range
 */
function isValidVersionRange(range: string): boolean {
    // Support common semver range patterns
    const patterns = [
        /^\d+\.\d+\.\d+$/, // Exact version
        /^\^?\d+\.\d+\.\d+$/, // Caret range
        /^~\d+\.\d+\.\d+$/, // Tilde range
        /^>=?\d+\.\d+\.\d+$/, // Greater than
        /^<=?\d+\.\d+\.\d+$/, // Less than
        /^\d+\.\d+\.x$/, // Wildcard
        /^\*$/ // Any version
    ];

    return patterns.some(p => p.test(range));
}

/**
 * Scan plugin code for security issues
 */
export async function scanPlugin(pluginId: string, version: string): Promise<SecurityScan> {
    const log = getLogger();

    const scan: SecurityScan = {
        id: randomUUID(),
        pluginId,
        version,
        status: 'scanning',
        startedAt: new Date(),
        findings: [],
        score: 100
    };

    await saveScan(scan);

    try {
        // Get version info
        const versionInfo = await getVersion(pluginId, version);
        if (!versionInfo) {
            throw new Error('Version not found');
        }

        // In a real implementation, we'd:
        // 1. Download and extract the tarball
        // 2. Scan all code files
        // 3. Check for known vulnerabilities
        // For now, scan the manifest for obvious issues

        const manifest = versionInfo.manifest;

        // Check capabilities
        if (manifest.capabilities) {
            if (manifest.capabilities.includes('system:exec')) {
                scan.findings.push({
                    severity: 'high',
                    type: 'capability',
                    message: 'Plugin requests system:exec capability',
                    remediation: 'Ensure exec capability is necessary and sandboxed'
                });
                scan.score -= 20;
            }

            if (manifest.capabilities.includes('filesystem:write')) {
                scan.findings.push({
                    severity: 'medium',
                    type: 'capability',
                    message: 'Plugin requests filesystem:write capability',
                    remediation: 'Ensure write access is scoped to appropriate directories'
                });
                scan.score -= 10;
            }
        }

        // Check hooks for potentially dangerous patterns
        if (manifest.hooks) {
            for (const [hookType, hooks] of Object.entries(manifest.hooks)) {
                if (!Array.isArray(hooks)) continue;

                for (const hook of hooks) {
                    if (hook.command) {
                        // Scan command for dangerous patterns
                        for (const dp of DANGEROUS_PATTERNS) {
                            if (dp.pattern.test(hook.command)) {
                                scan.findings.push({
                                    severity: dp.severity,
                                    type: 'code_pattern',
                                    message: dp.message,
                                    file: `hooks.${hookType}`,
                                    remediation: 'Review and sanitize the command'
                                });
                                scan.score -= dp.severity === 'critical' ? 30 : dp.severity === 'high' ? 20 : 10;
                            }
                        }
                    }
                }
            }
        }

        // Determine final status
        scan.status = scan.score >= 60 ? 'passed' : scan.score >= 40 ? 'warning' : 'failed';
        scan.score = Math.max(0, scan.score);

    } catch (error) {
        scan.status = 'failed';
        scan.score = 0;
        scan.findings.push({
            severity: 'critical',
            type: 'scan_error',
            message: `Scan failed: ${(error as Error).message}`
        });
        log.error({ error: (error as Error).message, pluginId, version }, 'Security scan failed');
    }

    scan.completedAt = new Date();

    // Save final scan result
    await saveScan(scan);

    // Update version with scan result
    const ver = await getVersion(pluginId, version);
    if (ver) {
        ver.securityScan = scan;
        await saveVersion(ver);
    }

    log.info(
        {
            pluginId,
            version,
            status: scan.status,
            score: scan.score,
            findings: scan.findings.length
        },
        'Security scan completed'
    );

    return scan;
}

/**
 * Scan code content for dangerous patterns
 */
export function scanCode(content: string, filename: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const dp of DANGEROUS_PATTERNS) {
            if (dp.pattern.test(line)) {
                findings.push({
                    severity: dp.severity,
                    type: 'code_pattern',
                    message: dp.message,
                    file: filename,
                    line: i + 1,
                    remediation: 'Review and remove or sanitize the code'
                });
            }
        }
    }

    return findings;
}

/**
 * Calculate security score from findings
 */
export function calculateScore(findings: SecurityFinding[]): number {
    let score = 100;

    for (const finding of findings) {
        switch (finding.severity) {
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

export default {
    validateManifest,
    scanPlugin,
    scanCode,
    calculateScore
};
