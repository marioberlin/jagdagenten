/**
 * Local Plugin Sync Service
 * 
 * Synchronizes local ClaudeSkills and ClaudePlugins into the registry.
 * Scans directories for valid plugin manifests and updates the store.
 * 
 * @see docs/IMPLEMENTATION_PLAN.md - Week 2: Skills Integration
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import type { Plugin, PluginManifest, PluginVersion, SkillDefinition } from './types.js';
import { pluginStore } from './store.js';
import { validateManifest } from './validator.js';
import crypto from 'crypto';

// Local skill directories to scan
const LOCAL_SKILL_DIRS = [
    { path: 'ClaudeSkills/skills', source: 'ClaudeSkills' },
    { path: 'ClaudePlugins/external', source: 'ClaudePlugins' },
    { path: 'LiquidSkills', source: 'LiquidSkills' },
];

interface LocalSkillInfo {
    name: string;
    path: string;
    source: string;
    manifest: PluginManifest | null;
    manifestPath: string | null;
    skills: SkillDefinition[];
}

interface SyncResult {
    synced: string[];
    failed: { name: string; error: string }[];
    skipped: string[];
    total: number;
}

/**
 * Checks if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks if a directory exists
 */
async function dirExists(path: string): Promise<boolean> {
    try {
        const s = await stat(path);
        return s.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Parses a SKILL.md file to extract skill metadata
 */
async function parseSkillMd(skillMdPath: string): Promise<Partial<PluginManifest> | null> {
    try {
        const content = await readFile(skillMdPath, 'utf-8');

        // Extract YAML frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return null;

        const frontmatter = frontmatterMatch[1];
        const lines = frontmatter.split('\n');

        const result: Partial<PluginManifest> = {};

        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();

            switch (key?.trim()) {
                case 'name':
                    result.name = value;
                    break;
                case 'description':
                    result.description = value;
                    break;
                case 'version':
                    result.version = value;
                    break;
                case 'author':
                    result.author = value;
                    break;
            }
        }

        return result;
    } catch {
        return null;
    }
}

/**
 * Loads manifest from a skill directory
 * Supports plugin.json, manifest.json, and SKILL.md
 */
async function loadManifest(skillPath: string, skillName: string): Promise<{ manifest: PluginManifest | null; manifestPath: string | null }> {
    // Try plugin.json first
    const pluginJsonPath = join(skillPath, 'plugin.json');
    if (await fileExists(pluginJsonPath)) {
        try {
            const content = await readFile(pluginJsonPath, 'utf-8');
            const manifest = JSON.parse(content) as PluginManifest;
            return { manifest, manifestPath: pluginJsonPath };
        } catch (e) {
            console.warn(`Failed to parse plugin.json for ${skillName}:`, e);
        }
    }

    // Try manifest.json
    const manifestJsonPath = join(skillPath, 'manifest.json');
    if (await fileExists(manifestJsonPath)) {
        try {
            const content = await readFile(manifestJsonPath, 'utf-8');
            const manifest = JSON.parse(content) as PluginManifest;
            return { manifest, manifestPath: manifestJsonPath };
        } catch (e) {
            console.warn(`Failed to parse manifest.json for ${skillName}:`, e);
        }
    }

    // Try SKILL.md
    const skillMdPath = join(skillPath, 'SKILL.md');
    if (await fileExists(skillMdPath)) {
        const parsed = await parseSkillMd(skillMdPath);
        if (parsed) {
            // Build minimal manifest from SKILL.md
            const manifest: PluginManifest = {
                name: parsed.name || skillName,
                version: parsed.version || '1.0.0',
                description: parsed.description || `${skillName} skill`,
                author: parsed.author || 'Unknown',
                license: 'MIT',
                skills: [{
                    name: skillName,
                    description: parsed.description || `${skillName} skill`,
                    file: 'SKILL.md',
                }],
            };
            return { manifest, manifestPath: skillMdPath };
        }
    }

    return { manifest: null, manifestPath: null };
}

/**
 * Scans a skill directory for skill definitions
 */
async function scanSkillFiles(skillPath: string): Promise<SkillDefinition[]> {
    const skills: SkillDefinition[] = [];

    try {
        const files = await readdir(skillPath, { withFileTypes: true });

        for (const file of files) {
            if (file.isFile()) {
                // TypeScript/JavaScript skill files
                if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
                    skills.push({
                        name: file.name.replace(/\.(ts|js)$/, ''),
                        description: `Skill from ${file.name}`,
                        file: file.name,
                    });
                }
                // Python skill files
                if (file.name.endsWith('.py') && file.name !== '__init__.py') {
                    skills.push({
                        name: file.name.replace('.py', ''),
                        description: `Python skill from ${file.name}`,
                        file: file.name,
                    });
                }
            }
        }
    } catch (e) {
        console.warn(`Failed to scan skill files in ${skillPath}:`, e);
    }

    return skills;
}

/**
 * Converts a local skill into a Plugin object for the registry
 */
function localSkillToPlugin(info: LocalSkillInfo): Plugin {
    const now = new Date();
    const id = crypto.randomUUID();

    return {
        id,
        name: info.manifest?.name || info.name,
        description: info.manifest?.description || `Local skill: ${info.name}`,
        author: info.manifest?.author || 'Local',
        authorId: 'local',
        createdAt: now,
        updatedAt: now,
        latestVersion: info.manifest?.version || '1.0.0',
        versions: [info.manifest?.version || '1.0.0'],
        keywords: [
            info.source.toLowerCase(),
            'local',
            ...(info.manifest?.keywords || []),
        ],
        homepage: info.manifest?.homepage,
        repository: info.manifest?.repository,
        license: info.manifest?.license || 'MIT',
        downloads: 0,
        stars: 0,
        verified: false, // Local plugins are not verified
        deprecated: false,
    };
}

/**
 * Creates a PluginVersion for a local skill
 */
function createLocalVersion(info: LocalSkillInfo): PluginVersion {
    const now = new Date();

    const manifest: PluginManifest = info.manifest || {
        name: info.name,
        version: '1.0.0',
        description: `Local skill: ${info.name}`,
        author: 'Local',
        license: 'MIT',
        skills: info.skills,
    };

    return {
        id: crypto.randomUUID(),
        pluginId: info.name,
        version: manifest.version,
        status: 'published',
        manifest,
        tarballUrl: `file://${info.path}`,
        tarballSha256: '',
        size: 0,
        publishedAt: now,
        publishedBy: 'local-sync',
        downloads: 0,
    };
}

/**
 * Scans all local skill directories and returns skill info
 */
export async function scanLocalSkills(projectRoot: string): Promise<LocalSkillInfo[]> {
    const skills: LocalSkillInfo[] = [];

    for (const dir of LOCAL_SKILL_DIRS) {
        const fullPath = join(projectRoot, dir.path);

        if (!(await dirExists(fullPath))) {
            continue;
        }

        try {
            const entries = await readdir(fullPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) {
                    continue;
                }

                const skillPath = join(fullPath, entry.name);
                const { manifest, manifestPath } = await loadManifest(skillPath, entry.name);
                const scannedSkills = await scanSkillFiles(skillPath);

                skills.push({
                    name: entry.name,
                    path: skillPath,
                    source: dir.source,
                    manifest,
                    manifestPath,
                    skills: manifest?.skills || scannedSkills,
                });
            }
        } catch (e) {
            console.error(`Failed to scan ${dir.path}:`, e);
        }
    }

    return skills;
}

/**
 * Synchronizes local skills into the plugin registry
 */
export async function syncLocalPlugins(projectRoot: string): Promise<SyncResult> {
    const result: SyncResult = {
        synced: [],
        failed: [],
        skipped: [],
        total: 0,
    };

    const localSkills = await scanLocalSkills(projectRoot);
    result.total = localSkills.length;

    for (const skillInfo of localSkills) {
        try {
            // Skip if no manifest and no skills found
            if (!skillInfo.manifest && skillInfo.skills.length === 0) {
                result.skipped.push(skillInfo.name);
                continue;
            }

            // Validate manifest if present
            if (skillInfo.manifest) {
                const validation = validateManifest(skillInfo.manifest);
                if (!validation.valid) {
                    result.failed.push({
                        name: skillInfo.name,
                        error: validation.errors?.join(', ') || 'Invalid manifest',
                    });
                    continue;
                }
            }

            // Check if already exists in store
            const existingPlugin = pluginStore.getPlugin(skillInfo.name);

            if (existingPlugin) {
                // Update existing plugin
                const version = createLocalVersion(skillInfo);
                pluginStore.updatePlugin(skillInfo.name, {
                    updatedAt: new Date(),
                    latestVersion: version.version,
                });
                result.synced.push(skillInfo.name);
            } else {
                // Add new plugin
                const plugin = localSkillToPlugin(skillInfo);
                const version = createLocalVersion(skillInfo);

                pluginStore.addPlugin(plugin);
                pluginStore.addVersion(version);
                result.synced.push(skillInfo.name);
            }
        } catch (e) {
            result.failed.push({
                name: skillInfo.name,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    return result;
}

/**
 * Gets a summary of synced local plugins
 */
export async function getLocalPluginSummary(projectRoot: string): Promise<{
    total: number;
    bySource: Record<string, number>;
    withManifest: number;
    skillCount: number;
}> {
    const skills = await scanLocalSkills(projectRoot);

    const bySource: Record<string, number> = {};
    let withManifest = 0;
    let skillCount = 0;

    for (const skill of skills) {
        bySource[skill.source] = (bySource[skill.source] || 0) + 1;
        if (skill.manifest) withManifest++;
        skillCount += skill.skills.length;
    }

    return {
        total: skills.length,
        bySource,
        withManifest,
        skillCount,
    };
}
