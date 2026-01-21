#!/usr/bin/env bun
/**
 * Migration Script: skills → .agent/skills
 *
 * Flattens the nested skills structure into an Antigravity-compatible
 * flat .agent/skills/ directory using symlinks.
 *
 * Usage:
 *   bun scripts/migrate-skills-to-agent-folder.ts [--dry-run] [--force]
 *
 * Options:
 *   --dry-run  Show what would be done without making changes
 *   --force    Overwrite existing symlinks
 */

import { existsSync, mkdirSync, readdirSync, symlinkSync, unlinkSync, readFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { parseArgs } from 'util';

const ROOT = dirname(dirname(import.meta.path));
const SKILLS_DIR = join(ROOT, 'skills');
const AGENT_SKILLS_DIR = join(ROOT, '.agent', 'skills');

interface SkillInfo {
  name: string;
  sourcePath: string;
  category: string;
  description?: string;
}

function parseSkillMd(skillMdPath: string): { name?: string; description?: string } {
  try {
    const content = readFileSync(skillMdPath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    return {
      name: nameMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim(),
    };
  } catch {
    return {};
  }
}

function findSkillFolders(dir: string, category: string = 'root'): SkillInfo[] {
  const skills: SkillInfo[] = [];

  if (!existsSync(dir)) return skills;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.venv') continue;

    const fullPath = join(dir, entry.name);
    const skillMdPath = join(fullPath, 'SKILL.md');

    if (existsSync(skillMdPath)) {
      const parsed = parseSkillMd(skillMdPath);
      skills.push({
        name: parsed.name || entry.name,
        sourcePath: fullPath,
        category,
        description: parsed.description,
      });
    }

    // Recursively search subdirectories
    const subCategory = category === 'root' ? entry.name : `${category}/${entry.name}`;
    skills.push(...findSkillFolders(fullPath, subCategory));
  }

  return skills;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')      // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special chars
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

function resolveNameConflicts(skills: SkillInfo[]): Map<string, SkillInfo> {
  const bySlug = new Map<string, SkillInfo[]>();

  for (const skill of skills) {
    const slug = slugify(skill.name);
    const existing = bySlug.get(slug) || [];
    existing.push(skill);
    bySlug.set(slug, existing);
  }

  const resolved = new Map<string, SkillInfo>();
  const usedSlugs = new Set<string>();

  for (const [slug, duplicates] of bySlug) {
    if (duplicates.length === 1) {
      resolved.set(slug, duplicates[0]);
      usedSlugs.add(slug);
    } else {
      // Prefix with category to resolve conflicts, using full path if needed
      for (const skill of duplicates) {
        const categoryParts = skill.category.split('/').map(slugify).filter(Boolean);
        let newSlug = slug;

        // Try progressively longer prefixes until unique
        for (let i = 0; i < categoryParts.length && usedSlugs.has(newSlug); i++) {
          const prefix = categoryParts.slice(0, i + 1).join('-');
          newSlug = `${prefix}-${slug}`;
        }

        // If still not unique, add numeric suffix
        let finalSlug = newSlug;
        let counter = 2;
        while (usedSlugs.has(finalSlug)) {
          finalSlug = `${newSlug}-${counter}`;
          counter++;
        }

        console.log(`  ⚠️  Conflict: "${skill.name}" → "${finalSlug}" (from ${skill.category})`);
        resolved.set(finalSlug, skill);
        usedSlugs.add(finalSlug);
      }
    }
  }

  return resolved;
}

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'dry-run': { type: 'boolean', default: false },
      'force': { type: 'boolean', default: false },
      'help': { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help) {
    console.log(`
Migration Script: skills → .agent/skills

Flattens the nested skills structure into an Antigravity-compatible
flat .agent/skills/ directory using symlinks.

Usage:
  bun scripts/migrate-skills-to-agent-folder.ts [--dry-run] [--force]

Options:
  --dry-run  Show what would be done without making changes
  --force    Overwrite existing symlinks
  --help     Show this help message
`);
    process.exit(0);
  }

  const dryRun = values['dry-run'];
  const force = values['force'];

  console.log('🔍 Scanning skills for SKILL.md files...\n');

  const skills = findSkillFolders(SKILLS_DIR);
  console.log(`Found ${skills.length} skills:\n`);

  for (const skill of skills) {
    console.log(`  📦 ${skill.name} (${skill.category})`);
  }

  console.log('\n🔧 Resolving name conflicts...\n');
  const resolved = resolveNameConflicts(skills);

  console.log(`\n📁 Target: ${AGENT_SKILLS_DIR}\n`);

  if (dryRun) {
    console.log('🧪 DRY RUN - No changes will be made\n');
  }

  // Create .agent/skills directory
  if (!dryRun && !existsSync(AGENT_SKILLS_DIR)) {
    mkdirSync(AGENT_SKILLS_DIR, { recursive: true });
    console.log(`✅ Created ${AGENT_SKILLS_DIR}\n`);
  }

  // Create symlinks
  let created = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const [name, skill] of resolved) {
    const linkPath = join(AGENT_SKILLS_DIR, name);
    const relativePath = relative(AGENT_SKILLS_DIR, skill.sourcePath);

    if (existsSync(linkPath)) {
      if (force) {
        if (!dryRun) {
          unlinkSync(linkPath);
          symlinkSync(relativePath, linkPath);
        }
        console.log(`🔄 ${name} → ${relativePath} (overwritten)`);
        overwritten++;
      } else {
        console.log(`⏭️  ${name} (already exists, use --force to overwrite)`);
        skipped++;
      }
    } else {
      if (!dryRun) {
        symlinkSync(relativePath, linkPath);
      }
      console.log(`🔗 ${name} → ${relativePath}`);
      created++;
    }
  }

  // Copy _registry.md if it exists
  const registrySource = join(SKILLS_DIR, '_registry.md');
  const registryDest = join(AGENT_SKILLS_DIR, '_registry.md');

  if (existsSync(registrySource)) {
    const registryRelative = relative(AGENT_SKILLS_DIR, registrySource);
    if (!existsSync(registryDest) || force) {
      if (!dryRun) {
        if (existsSync(registryDest)) unlinkSync(registryDest);
        symlinkSync(registryRelative, registryDest);
      }
      console.log(`🔗 _registry.md → ${registryRelative}`);
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary:
   Created:     ${created}
   Skipped:     ${skipped}
   Overwritten: ${overwritten}
   Total:       ${resolved.size}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dryRun ? '\n🧪 This was a dry run. Run without --dry-run to apply changes.' : '\n✅ Migration complete!'}
`);
}

main();
