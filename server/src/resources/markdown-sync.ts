/**
 * Markdown Sync Service
 *
 * Bidirectional sync between PostgreSQL resources and .ai/ markdown files.
 * Agents can read and amend these files at runtime; changes sync back to DB.
 *
 * Follows the AGENTS.md / CLAUDE.md pattern adopted by 40,000+ projects.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { watch, type FSWatcher } from 'fs';
import type { AIResource, OwnerType, ResourceType, ResourceStore } from './types.js';

// ============================================================================
// Markdown File Format
// ============================================================================

interface MarkdownFrontmatter {
  owner: string;
  ownerType: string;
  type: string;
  lastSynced: string;
  resourceIds?: string[];
}

function serializeFrontmatter(fm: MarkdownFrontmatter): string {
  const lines = ['---'];
  lines.push(`owner: ${fm.owner}`);
  lines.push(`ownerType: ${fm.ownerType}`);
  lines.push(`type: ${fm.type}`);
  lines.push(`lastSynced: ${fm.lastSynced}`);
  if (fm.resourceIds?.length) {
    lines.push(`resourceIds:`);
    for (const id of fm.resourceIds) {
      lines.push(`  - ${id}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function parseFrontmatter(content: string): { frontmatter: MarkdownFrontmatter | null; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: null, body: content };

  const fmBlock = fmMatch[1];
  const body = fmMatch[2];

  const fm: MarkdownFrontmatter = {
    owner: '',
    ownerType: 'agent',
    type: 'knowledge',
    lastSynced: new Date().toISOString(),
  };

  for (const line of fmBlock.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    switch (key.trim()) {
      case 'owner': fm.owner = value; break;
      case 'ownerType': fm.ownerType = value; break;
      case 'type': fm.type = value; break;
      case 'lastSynced': fm.lastSynced = value; break;
    }
  }

  // Parse resourceIds array
  const idsMatch = fmBlock.match(/resourceIds:\n((?:\s+-\s+.+\n?)*)/);
  if (idsMatch) {
    fm.resourceIds = idsMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }

  return { frontmatter: fm, body };
}

// ============================================================================
// Markdown Sync Service
// ============================================================================

export class MarkdownSyncService {
  private store: ResourceStore;
  private basePath: string;
  private watcher: FSWatcher | null = null;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(store: ResourceStore, basePath: string) {
    this.store = store;
    this.basePath = basePath;
  }

  // --------------------------------------------------------------------------
  // Sync: Resource → File
  // --------------------------------------------------------------------------

  /** Write a resource to its corresponding .ai/ markdown file */
  async syncToFile(resource: AIResource): Promise<void> {
    if (!resource.ownerId) return;

    const filePath = this.getFilePath(resource.ownerType, resource.ownerId, resource.resourceType);
    const dir = dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Read existing file content (if any) to merge
    let existingBody = '';
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      const { body } = parseFrontmatter(existing);
      existingBody = body;
    } catch {
      // File doesn't exist yet
    }

    // Build new content
    const frontmatter: MarkdownFrontmatter = {
      owner: resource.ownerId,
      ownerType: resource.ownerType,
      type: resource.resourceType,
      lastSynced: new Date().toISOString(),
      resourceIds: [resource.id],
    };

    // For appending: add resource content as a new section
    const newSection = `\n## ${resource.name}\n${resource.content || ''}\n`;
    const body = existingBody
      ? existingBody + newSection
      : `# ${this.getTypeLabel(resource.resourceType)} for ${resource.ownerId}\n${newSection}`;

    const fileContent = `${serializeFrontmatter(frontmatter)}\n\n${body}`;
    await fs.writeFile(filePath, fileContent, 'utf-8');
  }

  /** Sync all syncable resources for a target to their .ai/ files */
  async syncAllForTarget(ownerType: OwnerType, ownerId: string): Promise<number> {
    const resources = await this.store.getByTarget(ownerType, ownerId);
    const syncable = resources.filter(r => r.syncToFile);

    // Group by type
    const byType = new Map<ResourceType, AIResource[]>();
    for (const r of syncable) {
      const existing = byType.get(r.resourceType) || [];
      existing.push(r);
      byType.set(r.resourceType, existing);
    }

    // Write one file per type
    let synced = 0;
    for (const [type, items] of byType) {
      const filePath = this.getFilePath(ownerType, ownerId, type);
      const dir = dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      const frontmatter: MarkdownFrontmatter = {
        owner: ownerId,
        ownerType,
        type,
        lastSynced: new Date().toISOString(),
        resourceIds: items.map(r => r.id),
      };

      const sections = items.map(r => `## ${r.name}\n${r.content || ''}`);
      const body = `# ${this.getTypeLabel(type)} for ${ownerId}\n\n${sections.join('\n\n---\n\n')}`;
      const fileContent = `${serializeFrontmatter(frontmatter)}\n\n${body}\n\n---\n<!-- Agent: Add new entries below this line -->\n`;

      await fs.writeFile(filePath, fileContent, 'utf-8');
      synced += items.length;
    }

    return synced;
  }

  // --------------------------------------------------------------------------
  // Sync: File → Resource
  // --------------------------------------------------------------------------

  /** Read a .ai/ markdown file back and sync to database */
  async syncFromFile(filePath: string): Promise<AIResource | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      if (!frontmatter || !frontmatter.owner) return null;

      // Create or update resource
      const name = `${this.getTypeLabel(frontmatter.type as ResourceType)} (from file)`;
      const resource = await this.store.create({
        resourceType: frontmatter.type as ResourceType,
        ownerType: frontmatter.ownerType as OwnerType,
        ownerId: frontmatter.owner,
        name,
        content: body.trim(),
        parts: [],
        typeMetadata: this.defaultMetadata(frontmatter.type as ResourceType),
        version: 1,
        isActive: true,
        isPinned: false,
        tags: ['from_file'],
        provenance: 'imported',
        usageFrequency: 0,
        syncToFile: true,
      });

      return resource;
    } catch (err) {
      console.error(`[MarkdownSync] Error syncing file ${filePath}:`, err);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // File Watcher
  // --------------------------------------------------------------------------

  /** Start watching .ai/ for agent modifications */
  startFileWatcher(): void {
    if (this.watcher) return;

    try {
      this.watcher = watch(this.basePath, { recursive: true }, (_eventType: string, filename: string | null) => {
        if (!filename || !filename.endsWith('.md')) return;

        // Debounce: wait 500ms after last change before syncing
        const key = filename;
        const existing = this.debounceTimers.get(key);
        if (existing) clearTimeout(existing);

        this.debounceTimers.set(key, setTimeout(() => {
          this.debounceTimers.delete(key);
          const fullPath = join(this.basePath, filename);
          this.syncFromFile(fullPath).catch(err => {
            console.error(`[MarkdownSync] Watcher sync error for ${filename}:`, err);
          });
        }, 500));
      });

      console.log(`[MarkdownSync] Watching ${this.basePath} for changes`);
    } catch (err) {
      console.error('[MarkdownSync] Failed to start watcher:', err);
    }
  }

  /** Stop watching */
  stopFileWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  // --------------------------------------------------------------------------
  // Compile markdown context for a target
  // --------------------------------------------------------------------------

  /** Read all .ai/{target}/ files and compile into a single context string */
  async compileMarkdownContext(ownerType: OwnerType, ownerId: string): Promise<string> {
    const targetDir = join(this.basePath, ownerId);
    const sharedDir = join(this.basePath, 'shared');
    const sections: string[] = [];

    // Read target-specific files
    for (const filename of ['prompts.md', 'knowledge.md', 'learnings.md']) {
      const filePath = join(targetDir, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { body } = parseFrontmatter(content);
        if (body.trim()) {
          sections.push(body.trim());
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    // Read shared files
    for (const filename of ['conventions.md', 'preferences.md']) {
      const filePath = join(sharedDir, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { body } = parseFrontmatter(content);
        if (body.trim()) {
          sections.push(body.trim());
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    return sections.join('\n\n---\n\n');
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private getFilePath(ownerType: OwnerType, ownerId: string, resourceType: ResourceType): string {
    const typeFile = `${resourceType === 'prompt' ? 'prompts' : resourceType}.md`;
    return join(this.basePath, ownerId, typeFile);
  }

  private getTypeLabel(type: ResourceType): string {
    const labels: Record<ResourceType, string> = {
      prompt: 'Prompts',
      memory: 'Memory',
      context: 'Context',
      knowledge: 'Knowledge',
      artifact: 'Artifacts',
      skill: 'Skills',
      mcp: 'MCP Tools',
    };
    return labels[type] || type;
  }

  private defaultMetadata(type: ResourceType): any {
    switch (type) {
      case 'prompt': return { type: 'prompt', template: '', variables: [] };
      case 'memory': return { type: 'memory', layer: 'long_term', importance: 0.7 };
      case 'knowledge': return { type: 'knowledge', sourceType: 'file' };
      default: return { type };
    }
  }
}
