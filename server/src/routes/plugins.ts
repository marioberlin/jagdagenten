import { Elysia, t } from 'elysia';
import { spawn } from 'child_process';
import {
    runPluginHook,
    validatePluginPermissions,
    extractPluginPermissions,
    getSandboxStats,
    type PluginPermissions
} from '../sandbox.js';
import { componentLoggers } from '../logger.js';

const pluginLog = componentLoggers.http;

// Helper to run shell commands (for non-sandboxed operations like claude CLI)
const runCommand = (command: string, args: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { shell: true });
        let data = '';
        let error = '';

        proc.stdout.on('data', (chunk) => { data += chunk; });
        proc.stderr.on('data', (chunk) => { error += chunk; });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(data.trim());
            } else {
                reject(error.trim() || `Command failed with code ${code}`);
            }
        });
    });
};

export const pluginRoutes = new Elysia({ prefix: '/api/v1/plugins' })
    // List Installed Plugins
    // List Installed Plugins
    .get('/', async () => {
        try {
            const installedPlugins: Array<{ id: string; scope: 'user' | 'project'; isInstalled: true }> = [];

            // 1. Check User Scope (~/.claude/settings.json)
            try {
                const userSettingsPath = Bun.env.HOME + '/.claude/settings.json';
                const userFile = Bun.file(userSettingsPath);
                if (await userFile.exists()) {
                    const userData = await userFile.json();
                    if (userData.enabledPlugins) {
                        Object.keys(userData.enabledPlugins).forEach(key => {
                            installedPlugins.push({ id: key.split('@')[0], scope: 'user', isInstalled: true });
                        });
                    }
                }
                console.log('Detected user plugins:', installedPlugins);
            } catch (e) {
                console.error('Error reading user settings:', e);
            }

            // 2. Check Project Scope (.claude/settings.json)
            try {
                // Resolve absolute path to project root using import.meta.dir
                // import.meta.dir is /Users/mario/projects/LiquidCrypto/server/src/routes
                const path = await import('path');
                const projectSettingsPath = path.resolve(import.meta.dir, '../../../.claude/settings.json');

                console.log('Checking project settings at (absolute):', projectSettingsPath);

                const projectFile = Bun.file(projectSettingsPath);
                const exists = await projectFile.exists();
                console.log('Project file exists:', exists);

                if (exists) {
                    const projectData = await projectFile.json();
                    if (projectData.enabledPlugins) {
                        Object.keys(projectData.enabledPlugins).forEach(key => {
                            // If already in user scope, project scope overrides? Or shows as both?
                            // Usually project overrides. Let's update if exists.
                            const id = key.split('@')[0];
                            const existingIndex = installedPlugins.findIndex(p => p.id === id);
                            if (existingIndex !== -1) {
                                installedPlugins[existingIndex].scope = 'project';
                            } else {
                                installedPlugins.push({ id, scope: 'project', isInstalled: true });
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('Error reading project settings:', e);
            }

            console.log('FINAL installed plugins list:', JSON.stringify(installedPlugins, null, 2));

            return { success: true, data: installedPlugins };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    })
    .get('/official', async () => {
        try {
            const response = await fetch('https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json');
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.statusText}`);
            }
            const data = await response.json();
            return { success: true, data: data.plugins || [] };
        } catch (error) {
            console.error('Error fetching official plugins:', error);
            return { success: false, data: [] };
        }
    })

    // Install Plugin
    .post('/install', async ({ body }) => {
        const { pluginId } = body as { pluginId: string };
        if (!pluginId) throw new Error('Plugin ID required');

        try {
            const output = await runCommand('claude', ['plugin', 'install', pluginId]);
            return { success: true, message: output };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, {
        body: t.Object({
            pluginId: t.String()
        })
    })

    // Uninstall Plugin
    .post('/uninstall', async ({ body }) => {
        const { pluginId } = body as { pluginId: string };
        if (!pluginId) throw new Error('Plugin ID required');

        try {
            const output = await runCommand('claude', ['plugin', 'uninstall', pluginId]);
            return { success: true, message: output };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, {
        body: t.Object({
            pluginId: t.String()
        })
    })

    // Execute plugin hook in sandbox
    .post('/hook/execute', async ({ body }) => {
        const { pluginRoot, command, permissions } = body as {
            pluginRoot: string;
            command: string;
            permissions?: PluginPermissions;
        };

        if (!pluginRoot || !command) {
            return { success: false, error: 'Plugin root and command are required' };
        }

        pluginLog.info({ pluginRoot, command }, 'Executing plugin hook in sandbox');

        try {
            // Validate permissions if provided
            if (permissions) {
                const validation = validatePluginPermissions(permissions);
                if (!validation.valid) {
                    pluginLog.warn({ issues: validation.issues }, 'Plugin permission validation failed');
                    return {
                        success: false,
                        error: 'Permission validation failed',
                        issues: validation.issues
                    };
                }
            }

            // Run hook in sandbox
            const result = await runPluginHook(pluginRoot, command, permissions || {});

            return {
                success: result.exitCode === 0,
                result: {
                    stdout: result.stdout,
                    stderr: result.stderr,
                    exitCode: result.exitCode,
                    timedOut: result.timedOut,
                    duration: result.duration
                }
            };
        } catch (error) {
            pluginLog.error({ error: String(error) }, 'Plugin hook execution failed');
            return { success: false, error: String(error) };
        }
    }, {
        body: t.Object({
            pluginRoot: t.String(),
            command: t.String(),
            permissions: t.Optional(t.Object({
                filesystem: t.Optional(t.Array(t.String())),
                network: t.Optional(t.Array(t.String())),
                env: t.Optional(t.Array(t.String())),
                maxTimeout: t.Optional(t.Number()),
                maxMemory: t.Optional(t.Number())
            }))
        })
    })

    // Validate plugin permissions
    .post('/permissions/validate', async ({ body }) => {
        const { permissions } = body as { permissions: PluginPermissions };

        const validation = validatePluginPermissions(permissions);

        return {
            valid: validation.valid,
            issues: validation.issues
        };
    }, {
        body: t.Object({
            permissions: t.Object({
                filesystem: t.Optional(t.Array(t.String())),
                network: t.Optional(t.Array(t.String())),
                env: t.Optional(t.Array(t.String())),
                maxTimeout: t.Optional(t.Number()),
                maxMemory: t.Optional(t.Number())
            })
        })
    })

    // Extract permissions from plugin.json
    .get('/permissions/:pluginPath', async ({ params }) => {
        const { pluginPath } = params;
        const decodedPath = decodeURIComponent(pluginPath);

        try {
            const permissions = await extractPluginPermissions(decodedPath);

            if (!permissions) {
                return { success: false, error: 'Could not extract permissions from plugin.json' };
            }

            // Also validate extracted permissions
            const validation = validatePluginPermissions(permissions);

            return {
                success: true,
                permissions,
                validation
            };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, {
        params: t.Object({
            pluginPath: t.String()
        })
    })

    // Get sandbox status
    .get('/sandbox/status', () => {
        const stats = getSandboxStats();

        return {
            success: true,
            stats
        };
    });
