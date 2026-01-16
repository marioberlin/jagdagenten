#!/usr/bin/env bun
/**
 * Skills Audit Script
 * 
 * Audits all ClaudeSkills and ClaudePlugins directories to:
 * 1. Inventory all skills and plugins
 * 2. Check for required manifest files (plugin.json, SKILL.md)
 * 3. Generate a comprehensive inventory JSON
 * 4. Identify missing manifests for integration
 * 
 * Usage: bun run scripts/audit_skills.ts
 */

import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

interface SkillInfo {
    name: string;
    path: string;
    type: 'skill' | 'plugin';
    source: string;
    hasManifest: boolean;
    manifestType: 'plugin.json' | 'SKILL.md' | 'manifest.json' | 'none';
    description?: string;
    language?: string;
    tools?: string[];
    hasPythonScripts: boolean;
    hasTypeScriptScripts: boolean;
    missingFiles: string[];
}

interface AuditResult {
    timestamp: string;
    totalSkills: number;
    withManifest: number;
    missingManifest: number;
    bySource: Record<string, number>;
    skills: SkillInfo[];
    recommendations: string[];
}

const SKILLS_DIRS = [
    { path: 'ClaudeSkills/skills', type: 'skill' as const, source: 'ClaudeSkills' },
    { path: 'ClaudePlugins/external', type: 'plugin' as const, source: 'ClaudePlugins' },
    { path: 'ClaudePlugins/internal', type: 'plugin' as const, source: 'ClaudePlugins-Internal' },
    { path: 'LiquidSkills', type: 'skill' as const, source: 'LiquidSkills' },
];

const PROJECT_ROOT = join(import.meta.dir, '..');

async function directoryExists(path: string): Promise<boolean> {
    try {
        const s = await stat(path);
        return s.isDirectory();
    } catch {
        return false;
    }
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function findManifestType(skillPath: string): Promise<'plugin.json' | 'SKILL.md' | 'manifest.json' | 'none'> {
    if (await fileExists(join(skillPath, 'plugin.json'))) return 'plugin.json';
    if (await fileExists(join(skillPath, 'SKILL.md'))) return 'SKILL.md';
    if (await fileExists(join(skillPath, 'manifest.json'))) return 'manifest.json';
    return 'none';
}

async function extractDescription(skillPath: string, manifestType: string): Promise<string | undefined> {
    try {
        if (manifestType === 'plugin.json') {
            const content = await readFile(join(skillPath, 'plugin.json'), 'utf-8');
            const manifest = JSON.parse(content);
            return manifest.description || manifest.name;
        }
        if (manifestType === 'SKILL.md') {
            const content = await readFile(join(skillPath, 'SKILL.md'), 'utf-8');
            // Extract description from YAML frontmatter
            const frontmatterMatch = content.match(/---\s*\n([\s\S]*?)\n---/);
            if (frontmatterMatch) {
                const descMatch = frontmatterMatch[1].match(/description:\s*(.+)/);
                if (descMatch) return descMatch[1].trim();
            }
        }
        if (manifestType === 'manifest.json') {
            const content = await readFile(join(skillPath, 'manifest.json'), 'utf-8');
            const manifest = JSON.parse(content);
            return manifest.description || manifest.name;
        }
        // Try README.md as fallback
        if (await fileExists(join(skillPath, 'README.md'))) {
            const content = await readFile(join(skillPath, 'README.md'), 'utf-8');
            const firstLine = content.split('\n').find(line => line.startsWith('#'));
            if (firstLine) return firstLine.replace(/^#+\s*/, '');
        }
    } catch {
        return undefined;
    }
    return undefined;
}

async function hasFilesWithExtension(dir: string, ext: string): Promise<boolean> {
    try {
        const files = await readdir(dir, { recursive: true });
        return files.some(f => typeof f === 'string' && f.endsWith(ext));
    } catch {
        return false;
    }
}

async function auditSkill(skillPath: string, type: 'skill' | 'plugin', source: string): Promise<SkillInfo> {
    const name = basename(skillPath);
    const manifestType = await findManifestType(skillPath);
    const hasManifest = manifestType !== 'none';

    const missingFiles: string[] = [];
    if (!hasManifest) {
        missingFiles.push('plugin.json or SKILL.md');
    }
    if (source !== 'LiquidSkills' && !(await fileExists(join(skillPath, 'README.md')))) {
        missingFiles.push('README.md');
    }

    return {
        name,
        path: skillPath.replace(PROJECT_ROOT + '/', ''),
        type,
        source,
        hasManifest,
        manifestType,
        description: await extractDescription(skillPath, manifestType),
        hasPythonScripts: await hasFilesWithExtension(skillPath, '.py'),
        hasTypeScriptScripts: await hasFilesWithExtension(skillPath, '.ts'),
        missingFiles,
    };
}

async function auditDirectory(dirConfig: typeof SKILLS_DIRS[0]): Promise<SkillInfo[]> {
    const fullPath = join(PROJECT_ROOT, dirConfig.path);

    if (!(await directoryExists(fullPath))) {
        console.log(`⚠️  Directory not found: ${dirConfig.path}`);
        return [];
    }

    const entries = await readdir(fullPath, { withFileTypes: true });
    const skillDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'));

    const skills: SkillInfo[] = [];
    for (const entry of skillDirs) {
        const skillPath = join(fullPath, entry.name);
        const skillInfo = await auditSkill(skillPath, dirConfig.type, dirConfig.source);
        skills.push(skillInfo);
    }

    return skills;
}

async function generateRecommendations(skills: SkillInfo[]): Promise<string[]> {
    const recommendations: string[] = [];

    const missingManifests = skills.filter(s => !s.hasManifest);
    if (missingManifests.length > 0) {
        recommendations.push(
            `Create manifests for ${missingManifests.length} skills: ${missingManifests.slice(0, 5).map(s => s.name).join(', ')}${missingManifests.length > 5 ? '...' : ''}`
        );
    }

    const claudeSkills = skills.filter(s => s.source === 'ClaudeSkills' && s.hasManifest);
    if (claudeSkills.length > 0) {
        recommendations.push(
            `Integrate ${claudeSkills.length} ClaudeSkills into LiquidSkills registry`
        );
    }

    const claudePlugins = skills.filter(s => s.source === 'ClaudePlugins' && s.hasManifest);
    if (claudePlugins.length > 0) {
        recommendations.push(
            `Evaluate ${claudePlugins.length} ClaudePlugins for registry integration`
        );
    }

    return recommendations;
}

async function main() {
    console.log('🔍 Starting skills audit...\n');

    const allSkills: SkillInfo[] = [];

    for (const dir of SKILLS_DIRS) {
        console.log(`📂 Scanning ${dir.path}...`);
        const skills = await auditDirectory(dir);
        console.log(`   Found ${skills.length} skills/plugins`);
        allSkills.push(...skills);
    }

    const result: AuditResult = {
        timestamp: new Date().toISOString(),
        totalSkills: allSkills.length,
        withManifest: allSkills.filter(s => s.hasManifest).length,
        missingManifest: allSkills.filter(s => !s.hasManifest).length,
        bySource: {},
        skills: allSkills,
        recommendations: [],
    };

    // Count by source
    for (const skill of allSkills) {
        result.bySource[skill.source] = (result.bySource[skill.source] || 0) + 1;
    }

    result.recommendations = await generateRecommendations(allSkills);

    // Write results
    const outputPath = join(PROJECT_ROOT, 'skills_inventory.json');
    await writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log('\n📊 Audit Summary:');
    console.log('─'.repeat(40));
    console.log(`Total Skills/Plugins: ${result.totalSkills}`);
    console.log(`With Manifest: ${result.withManifest}`);
    console.log(`Missing Manifest: ${result.missingManifest}`);
    console.log('\nBy Source:');
    for (const [source, count] of Object.entries(result.bySource)) {
        console.log(`  ${source}: ${count}`);
    }
    console.log('\n📋 Recommendations:');
    for (const rec of result.recommendations) {
        console.log(`  • ${rec}`);
    }
    console.log(`\n✅ Inventory saved to: ${outputPath}`);
}

main().catch(console.error);
