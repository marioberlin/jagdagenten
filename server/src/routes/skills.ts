import { Elysia, t } from 'elysia';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from '../db';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

interface Skill {
    id: string;
    name: string;
    type: 'skill';
    description: string;
    enabled: boolean;
    author: 'community' | 'vendor' | 'user';
    path: string;
}

export const skillsRoutes = new Elysia({ prefix: '/api/v1' })
    .get('/skills', async () => {
        try {
            const skills: Skill[] = [];
            const skillsRoot = join(process.cwd(), 'LiquidSkills');
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
            const scanDir = async (dir: string, author: 'community' | 'vendor') => {
                try {
                    // check if dir exists first
                    const dirFile = Bun.file(dir);
                    // readdir throws if format is wrong, but we can verify existence via readdir call wrapper
                    // actually readdir throws if ENOENT.

                    const entries = await readdir(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const skillPath = join(dir, entry.name);
                            const readmePath = join(skillPath, 'SKILL.md');
                            const readmeFile = Bun.file(readmePath);

                            if (await readmeFile.exists()) {
                                const content = await readmeFile.text();
                                // Basic parsing of SKILL.md for description
                                const titleMatch = content.match(/^#\s+(.+)$/m);
                                // Find first non-header, non-empty line for description
                                const lines = content.split('\n');
                                let desc = 'No description';
                                for (const line of lines) {
                                    if (line.trim() && !line.startsWith('#') && !line.startsWith('>')) {
                                        desc = line.trim();
                                        break;
                                    }
                                }

                                skills.push({
                                    id: entry.name,
                                    name: titleMatch ? titleMatch[1].trim() : entry.name,
                                    type: 'skill',
                                    description: desc.slice(0, 100) + (desc.length > 100 ? '...' : ''),
                                    enabled: !disabledSkills.includes(entry.name),
                                    author,
                                    path: skillPath
                                });
                            }
                        }
                    }
                } catch (e) {
                    // logger.warn({ dir, error: e }, 'Skills directory not found or scan failed');
                }
            };

            await scanDir(communityDir, 'community');
            await scanDir(vendorDir, 'vendor');

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
