/**
 * Soul.me Loader Service
 * 
 * Loads and parses soul.me files for apps and agents.
 * Caches parsed souls for performance.
 */

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { SoulDefinition } from './soul-generator';

// ============================================================================
// Types
// ============================================================================

export interface ParsedSoul {
    id: string;
    name: string;
    version: string;
    type: 'app' | 'agent' | 'a2a-server';
    capabilities: string[];
    triggers: string[];
    tags: string[];

    // Parsed markdown sections
    sections: {
        personality?: string;
        goals?: string[];
        voiceTone?: string[];
        constraints?: string[];
        [key: string]: string | string[] | undefined;
    };

    // Raw content for context injection
    rawContent: string;

    // Compiled system prompt
    systemPrompt: string;
}

export interface SoulLoaderConfig {
    appsDir: string;
    a2aDir: string;
    cacheEnabled: boolean;
}

// ============================================================================
// Soul Loader Service
// ============================================================================

export class SoulLoaderService {
    private config: SoulLoaderConfig;
    private cache = new Map<string, ParsedSoul>();

    constructor(config?: Partial<SoulLoaderConfig>) {
        this.config = {
            appsDir: config?.appsDir ?? 'src/applications',
            a2aDir: config?.a2aDir ?? 'server/src/a2a',
            cacheEnabled: config?.cacheEnabled ?? true,
        };
    }

    /**
     * Load soul.me for an app
     */
    async loadAppSoul(appId: string): Promise<ParsedSoul | null> {
        const cacheKey = `app:${appId}`;

        if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const soulPath = join(this.config.appsDir, appId, 'soul.md');
        const soul = await this.loadSoulFile(soulPath, appId);

        if (soul && this.config.cacheEnabled) {
            this.cache.set(cacheKey, soul);
        }

        return soul;
    }

    /**
     * Load soul.me for an A2A server
     */
    async loadA2ASoul(serverId: string): Promise<ParsedSoul | null> {
        const cacheKey = `a2a:${serverId}`;

        if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const soulPath = join(this.config.a2aDir, serverId, 'soul.md');
        const soul = await this.loadSoulFile(soulPath, serverId);

        if (soul && this.config.cacheEnabled) {
            this.cache.set(cacheKey, soul);
        }

        return soul;
    }

    /**
     * Load soul.me from any path
     */
    async loadSoulFile(path: string, id?: string): Promise<ParsedSoul | null> {
        try {
            await access(path);
            const content = await readFile(path, 'utf-8');
            return this.parseSoulFile(content, id);
        } catch (error) {
            // File doesn't exist or can't be read
            return null;
        }
    }

    /**
     * Parse soul.me file content
     */
    parseSoulFile(content: string, defaultId?: string): ParsedSoul {
        // Split frontmatter and body
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (!frontmatterMatch) {
            throw new Error('Invalid soul.me format: missing frontmatter');
        }

        const [, frontmatterText, body] = frontmatterMatch;
        const frontmatter = parseYaml(frontmatterText) as Record<string, any>;

        // Parse markdown sections
        const sections = this.parseMarkdownSections(body);

        // Build system prompt
        const systemPrompt = this.buildSystemPrompt(frontmatter, sections);

        return {
            id: frontmatter.id ?? defaultId ?? 'unknown',
            name: frontmatter.name ?? 'Unknown',
            version: frontmatter.version ?? '1.0.0',
            type: frontmatter.type ?? 'app',
            capabilities: frontmatter.capabilities ?? [],
            triggers: frontmatter.triggers ?? [],
            tags: frontmatter.tags ?? [],
            sections,
            rawContent: content,
            systemPrompt,
        };
    }

    /**
     * Parse markdown body into sections
     */
    private parseMarkdownSections(body: string): ParsedSoul['sections'] {
        const sections: ParsedSoul['sections'] = {};

        // Split by headers
        const headerRegex = /^#\s+(.+)$/gm;
        const parts = body.split(headerRegex);

        // parts[0] is content before first header (usually empty)
        // parts[1] is first header name, parts[2] is its content, etc.
        for (let i = 1; i < parts.length; i += 2) {
            const headerName = parts[i]?.trim().toLowerCase().replace(/\s+&\s+/g, '').replace(/\s+/g, '');
            const content = parts[i + 1]?.trim() ?? '';

            // Parse list items or keep as string
            if (content.includes('\n-')) {
                sections[headerName] = content
                    .split('\n')
                    .filter(line => line.startsWith('-'))
                    .map(line => line.replace(/^-\s*/, '').trim());
            } else {
                sections[headerName] = content;
            }
        }

        // Normalize keys
        if (sections['voicetone']) {
            sections.voiceTone = sections['voicetone'] as string[];
            delete sections['voicetone'];
        }

        return sections;
    }

    /**
     * Build system prompt from soul definition
     */
    private buildSystemPrompt(
        frontmatter: Record<string, any>,
        sections: ParsedSoul['sections']
    ): string {
        const lines: string[] = [];

        // Identity
        lines.push(`# ${frontmatter.name ?? 'Agent'}`);
        lines.push('');

        // Personality
        if (sections.personality) {
            lines.push(typeof sections.personality === 'string'
                ? sections.personality
                : sections.personality.join(' '));
            lines.push('');
        }

        // Capabilities
        if (frontmatter.capabilities?.length) {
            lines.push('## Capabilities');
            for (const cap of frontmatter.capabilities) {
                lines.push(`- ${cap}`);
            }
            lines.push('');
        }

        // Goals
        if (sections.goals?.length) {
            lines.push('## Goals');
            for (const goal of sections.goals) {
                lines.push(`- ${goal}`);
            }
            lines.push('');
        }

        // Voice & Tone
        if (sections.voiceTone?.length) {
            lines.push('## Communication Style');
            for (const tone of sections.voiceTone) {
                lines.push(`- ${tone}`);
            }
            lines.push('');
        }

        // Constraints
        if (sections.constraints?.length) {
            lines.push('## Constraints');
            for (const constraint of sections.constraints) {
                lines.push(`- ${constraint}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(type: 'app' | 'a2a', id: string): void {
        this.cache.delete(`${type}:${id}`);
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createSoulLoader(config?: Partial<SoulLoaderConfig>): SoulLoaderService {
    return new SoulLoaderService(config);
}

export default SoulLoaderService;
