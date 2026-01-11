import { Elysia, t } from 'elysia';
import { spawn } from 'child_process';

// Helper to run shell commands
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
    });
