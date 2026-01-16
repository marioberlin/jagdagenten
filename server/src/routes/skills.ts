import { Elysia, t } from 'elysia';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from '../db';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

interface Skill {
    id: string;
    name: string;
    type: 'skill' | 'plugin';
    description: string;
    enabled: boolean;
    author: 'community' | 'vendor' | 'core' | 'user';
    path: string;
    config?: any;
}

export const skillsRoutes = new Elysia({ prefix: '/api/v1' })
    .get('/skills', async () => {
        try {
            const skills: Skill[] = [];
            let skillsRoot = join(process.cwd(), 'LiquidSkills');

            // Fix path resolution if running from server directory
            const serverDirCheck = Bun.file(join(process.cwd(), 'package.json'));
            if (await serverDirCheck.exists()) {
                const pkg = await serverDirCheck.json();
                if (pkg.name === 'liquid-glass-server') {
                    skillsRoot = join(process.cwd(), '..', 'LiquidSkills');
                }
            }

            const communityDir = join(skillsRoot, 'community');
            const vendorDir = join(skillsRoot, 'vendor');

            // Load disabled skills config
            let disabledSkills: string[] = [];
            try {
                const configPath = join(process.cwd(), 'server', 'data', 'disabled_skills.json');
                const configFile = Bun.file(configPath);
                if (await configFile.exists()) {
                    disabledSkills = await configFile.json();
                }
            } catch (e) {
                logger.warn({ error: e }, 'Failed to load disabled skills config');
            }

            // Helper to scan directory
            const scanDir = async (dir: string, author: 'community' | 'vendor' | 'core', ignoreDirs: string[] = []) => {
                try {
                    // check if dir exists first
                    const dirFile = Bun.file(dir);
                    if (!(await dirFile.exists()) && !(await readdir(dir).then(() => true).catch(() => false))) return;

                    const entries = await readdir(dir, { withFileTypes: true });

                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            if (ignoreDirs.includes(entry.name) || entry.name.startsWith('.')) continue;

                            const skillPath = join(dir, entry.name);
                            const readmePath = join(skillPath, 'SKILL.md');
                            const pluginPath = join(skillPath, 'plugin.json');

                            const readmeFile = Bun.file(readmePath);
                            const pluginFile = Bun.file(pluginPath);

                            const hasReadme = await readmeFile.exists();
                            const hasPlugin = await pluginFile.exists();

                            if (hasReadme || hasPlugin) {
                                let name = entry.name;
                                let description = '---';
                                let version = '1.0.0';
                                let type: 'skill' | 'plugin' = hasPlugin ? 'plugin' : 'skill';
                                let config = undefined;

                                if (hasPlugin) {
                                    try {
                                        const pluginData = await pluginFile.json();
                                        name = pluginData.name || name;
                                        description = pluginData.description || description;
                                        version = pluginData.version || version;
                                        config = pluginData;
                                    } catch (e) {
                                        console.error(`Failed to parse plugin.json for ${entry.name}`, e);
                                    }
                                }

                                if (hasReadme) {
                                    const content = await readmeFile.text();
                                    // Basic parsing of SKILL.md for description and name if not provided by plugin.json
                                    const titleMatch = content.match(/^#\s+(.+)$/m);
                                    if (titleMatch && (!hasPlugin || !config?.name)) {
                                        name = titleMatch[1].trim();
                                    }

                                    // Try to extract description from frontmatter or first paragraph if not in plugin.json
                                    if (!hasPlugin || !config?.description) {
                                        // simple frontmatter check
                                        if (content.startsWith('---')) {
                                            const endFrontmatter = content.indexOf('---', 3);
                                            if (endFrontmatter !== -1) {
                                                const frontmatter = content.substring(3, endFrontmatter);
                                                const descMatch = frontmatter.match(/description:\s*(.+)$/m);
                                                if (descMatch) description = descMatch[1].trim();
                                            }
                                        }

                                        if (description === '---') {
                                            // Find first non-header, non-empty line
                                            const lines = content.split('\n');
                                            for (const line of lines) {
                                                if (line.trim() && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('---')) {
                                                    description = line.trim();
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                skills.push({
                                    id: entry.name, // Use dir name as stable ID
                                    name,
                                    type,
                                    description: description.slice(0, 150) + (description.length > 150 ? '...' : ''),
                                    enabled: !disabledSkills.includes(entry.name),
                                    author,
                                    path: skillPath,
                                    config
                                });
                            }
                        }
                    }
                } catch (error) {
                    // console.warn(`Failed to scan directory ${dir}:`, error);
                }
            };

            await Promise.all([
                scanDir(skillsRoot, 'core', ['community', 'vendor', 'node_modules', '.venv', '.git', 'bin', 'obj', 'lib', '.DS_Store']),
                scanDir(communityDir, 'community'),
                scanDir(vendorDir, 'vendor')
            ]);

            return { success: true, data: skills };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    })
    .get('/plugins', async () => {
        try {
            const result = await pool.query('SELECT * FROM installed_plugins ORDER BY plugin_name ASC');
            return { success: true, data: result.rows };
        } catch (error) {
            // Return empty list on DB error to avoid crashing UI if DB is down
            logger.error({ error }, 'Failed to fetch plugins');
            return { success: false, error: String(error) };
        }
    })
    .post('/skills/toggle', async ({ body }) => {
        const { id, enabled } = body as { id: string; enabled: boolean };
        try {
            const configPath = join(process.cwd(), 'server', 'data', 'disabled_skills.json');
            const configFile = Bun.file(configPath);
            let disabledSkills: string[] = [];

            if (await configFile.exists()) {
                disabledSkills = await configFile.json();
            }

            if (enabled) {
                disabledSkills = disabledSkills.filter(s => s !== id);
            } else {
                if (!disabledSkills.includes(id)) {
                    disabledSkills.push(id);
                }
            }

            await Bun.write(configPath, JSON.stringify(disabledSkills, null, 2));

            return { success: true, enabled };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, {
        body: t.Object({
            id: t.String(),
            enabled: t.Boolean()
        })
    })
    .patch('/plugins/:id', async ({ params, body }) => {
        const { id } = params;
        const { enabled } = body as { enabled: boolean };
        try {
            await pool.query('UPDATE installed_plugins SET enabled = $1, updated_at = NOW() WHERE id = $2', [enabled, id]);
            return { success: true, enabled };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ enabled: t.Boolean() })
    });
