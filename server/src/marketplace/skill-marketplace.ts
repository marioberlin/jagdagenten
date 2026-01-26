/**
 * Skill Marketplace Service
 * 
 * Backend service for the skill marketplace.
 * 
 * Features:
 * - Skill publishing with validation
 * - Semantic versioning with changelogs
 * - Discovery via Gemini File Search integration
 * - Community features (stars, comments, usage stats)
 */

import { randomUUID } from 'crypto';
import type { ResourceStore, AIResource, OwnerType, SkillMetadata } from '../resources/types.js';

// ============================================================================
// Types
// ============================================================================

export interface Skill {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    author: SkillAuthor;
    category: SkillCategory;
    tags: string[];
    triggers: string[];
    toolNames: string[];
    parameters: SkillParameter[];
    content: string;
    examples?: SkillExample[];
    dependencies?: string[];

    // Marketplace metadata
    publishedAt: Date;
    updatedAt: Date;
    isPublished: boolean;
    isVerified: boolean;

    // Stats
    stats: SkillStats;

    // Versioning
    versions: SkillVersion[];
}

export interface SkillAuthor {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface SkillParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
}

export interface SkillExample {
    title: string;
    input: string;
    output: string;
}

export interface SkillVersion {
    version: string;
    changelog: string;
    publishedAt: Date;
    downloadUrl?: string;
}

export interface SkillStats {
    stars: number;
    downloads: number;
    usages: number;
    comments: number;
    rating: number;
    ratingCount: number;
}

export interface SkillComment {
    id: string;
    skillId: string;
    authorId: string;
    authorUsername: string;
    content: string;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
}

export type SkillCategory =
    | 'automation'
    | 'coding'
    | 'data'
    | 'creative'
    | 'communication'
    | 'productivity'
    | 'integration'
    | 'analysis'
    | 'other';

export interface SkillSearchOptions {
    query?: string;
    category?: SkillCategory;
    tags?: string[];
    author?: string;
    verified?: boolean;
    sortBy?: 'stars' | 'downloads' | 'rating' | 'recent';
    limit?: number;
    offset?: number;
}

export interface PublishSkillInput {
    name: string;
    displayName: string;
    description: string;
    category: SkillCategory;
    tags: string[];
    triggers: string[];
    toolNames: string[];
    parameters: SkillParameter[];
    content: string;
    examples?: SkillExample[];
    dependencies?: string[];
}

// ============================================================================
// In-Memory Store (would be PostgreSQL in production)
// ============================================================================

class SkillStore {
    private skills = new Map<string, Skill>();
    private comments = new Map<string, SkillComment[]>();
    private stars = new Map<string, Set<string>>(); // skillId -> Set<userId>

    // Skills CRUD
    async create(skill: Skill): Promise<Skill> {
        this.skills.set(skill.id, skill);
        return skill;
    }

    async get(id: string): Promise<Skill | null> {
        return this.skills.get(id) ?? null;
    }

    async getByName(name: string): Promise<Skill | null> {
        for (const skill of this.skills.values()) {
            if (skill.name === name) return skill;
        }
        return null;
    }

    async update(id: string, updates: Partial<Skill>): Promise<Skill | null> {
        const skill = this.skills.get(id);
        if (!skill) return null;

        const updated = { ...skill, ...updates, updatedAt: new Date() };
        this.skills.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        return this.skills.delete(id);
    }

    async list(options: SkillSearchOptions = {}): Promise<Skill[]> {
        let skills = Array.from(this.skills.values()).filter(s => s.isPublished);

        // Filter by category
        if (options.category) {
            skills = skills.filter(s => s.category === options.category);
        }

        // Filter by tags
        if (options.tags?.length) {
            skills = skills.filter(s =>
                options.tags!.some(tag => s.tags.includes(tag))
            );
        }

        // Filter by author
        if (options.author) {
            skills = skills.filter(s => s.author.username === options.author);
        }

        // Filter by verified
        if (options.verified !== undefined) {
            skills = skills.filter(s => s.isVerified === options.verified);
        }

        // Text search
        if (options.query) {
            const query = options.query.toLowerCase();
            skills = skills.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.displayName.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        // Sort
        switch (options.sortBy) {
            case 'stars':
                skills.sort((a, b) => b.stats.stars - a.stats.stars);
                break;
            case 'downloads':
                skills.sort((a, b) => b.stats.downloads - a.stats.downloads);
                break;
            case 'rating':
                skills.sort((a, b) => b.stats.rating - a.stats.rating);
                break;
            case 'recent':
            default:
                skills.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }

        // Pagination
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 20;
        return skills.slice(offset, offset + limit);
    }

    // Stars
    async addStar(skillId: string, userId: string): Promise<void> {
        let stars = this.stars.get(skillId);
        if (!stars) {
            stars = new Set();
            this.stars.set(skillId, stars);
        }
        stars.add(userId);

        // Update skill stats
        const skill = this.skills.get(skillId);
        if (skill) {
            skill.stats.stars = stars.size;
        }
    }

    async removeStar(skillId: string, userId: string): Promise<void> {
        const stars = this.stars.get(skillId);
        if (stars) {
            stars.delete(userId);
            const skill = this.skills.get(skillId);
            if (skill) {
                skill.stats.stars = stars.size;
            }
        }
    }

    async hasStar(skillId: string, userId: string): Promise<boolean> {
        return this.stars.get(skillId)?.has(userId) ?? false;
    }

    // Comments
    async addComment(comment: SkillComment): Promise<SkillComment> {
        let comments = this.comments.get(comment.skillId);
        if (!comments) {
            comments = [];
            this.comments.set(comment.skillId, comments);
        }
        comments.push(comment);

        // Update skill stats
        const skill = this.skills.get(comment.skillId);
        if (skill) {
            skill.stats.comments = comments.length;

            // Update rating if provided
            if (comment.rating) {
                const ratings = comments.filter(c => c.rating).map(c => c.rating!);
                skill.stats.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                skill.stats.ratingCount = ratings.length;
            }
        }

        return comment;
    }

    async getComments(skillId: string): Promise<SkillComment[]> {
        return this.comments.get(skillId) ?? [];
    }

    async deleteComment(skillId: string, commentId: string): Promise<boolean> {
        const comments = this.comments.get(skillId);
        if (!comments) return false;

        const index = comments.findIndex(c => c.id === commentId);
        if (index === -1) return false;

        comments.splice(index, 1);
        return true;
    }
}

// ============================================================================
// Skill Marketplace Service
// ============================================================================

export class SkillMarketplaceService {
    private store: SkillStore;
    private resourceStore: ResourceStore | null;

    constructor(resourceStore?: ResourceStore) {
        this.store = new SkillStore();
        this.resourceStore = resourceStore ?? null;
    }

    // ============================================================================
    // Publishing
    // ============================================================================

    /**
     * Publish a new skill to the marketplace
     */
    async publish(input: PublishSkillInput, author: SkillAuthor): Promise<Skill> {
        // Validate skill name
        const existing = await this.store.getByName(input.name);
        if (existing) {
            throw new Error(`Skill with name "${input.name}" already exists`);
        }

        // Validate input
        this.validateSkillInput(input);

        const skill: Skill = {
            id: randomUUID(),
            ...input,
            version: '1.0.0',
            author,
            publishedAt: new Date(),
            updatedAt: new Date(),
            isPublished: true,
            isVerified: false,
            stats: {
                stars: 0,
                downloads: 0,
                usages: 0,
                comments: 0,
                rating: 0,
                ratingCount: 0,
            },
            versions: [{
                version: '1.0.0',
                changelog: 'Initial release',
                publishedAt: new Date(),
            }],
        };

        await this.store.create(skill);

        // Also store as a LiquidMind resource
        if (this.resourceStore) {
            await this.syncToResourceStore(skill);
        }

        return skill;
    }

    /**
     * Publish a new version of an existing skill
     */
    async publishVersion(
        skillId: string,
        version: string,
        changelog: string,
        content?: string,
        authorId?: string
    ): Promise<Skill> {
        const skill = await this.store.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        // Verify author
        if (authorId && skill.author.id !== authorId) {
            throw new Error('Only the skill author can publish new versions');
        }

        // Validate version (must be higher than current)
        if (!this.isVersionHigher(version, skill.version)) {
            throw new Error(`Version ${version} must be higher than current version ${skill.version}`);
        }

        // Add new version
        skill.versions.push({
            version,
            changelog,
            publishedAt: new Date(),
        });

        // Update skill
        const updated = await this.store.update(skillId, {
            version,
            content: content ?? skill.content,
            updatedAt: new Date(),
            versions: skill.versions,
        });

        if (this.resourceStore && updated) {
            await this.syncToResourceStore(updated);
        }

        return updated!;
    }

    /**
     * Unpublish a skill
     */
    async unpublish(skillId: string, authorId: string): Promise<void> {
        const skill = await this.store.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        if (skill.author.id !== authorId) {
            throw new Error('Only the skill author can unpublish');
        }

        await this.store.update(skillId, { isPublished: false });
    }

    // ============================================================================
    // Discovery
    // ============================================================================

    /**
     * Search for skills
     */
    async search(options: SkillSearchOptions = {}): Promise<{
        skills: Skill[];
        total: number;
    }> {
        const skills = await this.store.list(options);

        // Get total count (without pagination)
        const allSkills = await this.store.list({
            ...options,
            limit: undefined,
            offset: undefined,
        });

        return {
            skills,
            total: allSkills.length,
        };
    }

    /**
     * Get skill by ID
     */
    async getById(skillId: string): Promise<Skill | null> {
        return this.store.get(skillId);
    }

    /**
     * Get skill by name
     */
    async getByName(name: string): Promise<Skill | null> {
        return this.store.getByName(name);
    }

    /**
     * Get featured skills
     */
    async getFeatured(limit: number = 10): Promise<Skill[]> {
        // Return top-rated verified skills
        return this.store.list({
            verified: true,
            sortBy: 'rating',
            limit,
        });
    }

    /**
     * Get skills by category
     */
    async getByCategory(category: SkillCategory, limit: number = 20): Promise<Skill[]> {
        return this.store.list({ category, limit });
    }

    /**
     * Get skills by author
     */
    async getByAuthor(authorId: string): Promise<Skill[]> {
        return this.store.list({ author: authorId, limit: 100 });
    }

    // ============================================================================
    // Community Features
    // ============================================================================

    /**
     * Star a skill
     */
    async star(skillId: string, userId: string): Promise<{ stars: number }> {
        const skill = await this.store.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        await this.store.addStar(skillId, userId);

        const updated = await this.store.get(skillId);
        return { stars: updated!.stats.stars };
    }

    /**
     * Unstar a skill
     */
    async unstar(skillId: string, userId: string): Promise<{ stars: number }> {
        await this.store.removeStar(skillId, userId);
        const skill = await this.store.get(skillId);
        return { stars: skill?.stats.stars ?? 0 };
    }

    /**
     * Check if user has starred a skill
     */
    async hasStarred(skillId: string, userId: string): Promise<boolean> {
        return this.store.hasStar(skillId, userId);
    }

    /**
     * Add a comment
     */
    async addComment(
        skillId: string,
        authorId: string,
        authorUsername: string,
        content: string,
        rating?: number
    ): Promise<SkillComment> {
        const skill = await this.store.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        const comment: SkillComment = {
            id: randomUUID(),
            skillId,
            authorId,
            authorUsername,
            content,
            rating,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return this.store.addComment(comment);
    }

    /**
     * Get comments for a skill
     */
    async getComments(skillId: string): Promise<SkillComment[]> {
        return this.store.getComments(skillId);
    }

    /**
     * Delete a comment
     */
    async deleteComment(skillId: string, commentId: string, userId: string): Promise<void> {
        const comments = await this.store.getComments(skillId);
        const comment = comments.find(c => c.id === commentId);

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new Error('Only the comment author can delete');
        }

        await this.store.deleteComment(skillId, commentId);
    }

    /**
     * Record skill usage
     */
    async recordUsage(skillId: string): Promise<void> {
        const skill = await this.store.get(skillId);
        if (skill) {
            await this.store.update(skillId, {
                stats: {
                    ...skill.stats,
                    usages: skill.stats.usages + 1,
                },
            });
        }
    }

    /**
     * Record skill download
     */
    async recordDownload(skillId: string): Promise<void> {
        const skill = await this.store.get(skillId);
        if (skill) {
            await this.store.update(skillId, {
                stats: {
                    ...skill.stats,
                    downloads: skill.stats.downloads + 1,
                },
            });
        }
    }

    // ============================================================================
    // Installation
    // ============================================================================

    /**
     * Install a skill to a target (agent or app)
     */
    async install(
        skillId: string,
        ownerType: OwnerType,
        ownerId: string
    ): Promise<AIResource | null> {
        if (!this.resourceStore) {
            throw new Error('Resource store not configured');
        }

        const skill = await this.store.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        // Record download
        await this.recordDownload(skillId);

        // Create resource
        return this.resourceStore.create({
            resourceType: 'skill',
            ownerType,
            ownerId,
            name: skill.displayName,
            description: skill.description,
            content: skill.content,
            parts: [],
            typeMetadata: {
                type: 'skill',
                triggers: skill.triggers,
                toolNames: skill.toolNames,
                parameters: skill.parameters,
            } as SkillMetadata,
            version: 1,
            isActive: true,
            isPinned: false,
            tags: [...skill.tags, `marketplace:${skill.id}`, `v${skill.version}`],
            provenance: 'imported',
            usageFrequency: 0,
            syncToFile: true,
        });
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private validateSkillInput(input: PublishSkillInput): void {
        if (!input.name || input.name.length < 3) {
            throw new Error('Skill name must be at least 3 characters');
        }

        if (!/^[a-z0-9-]+$/.test(input.name)) {
            throw new Error('Skill name must be lowercase alphanumeric with hyphens');
        }

        if (!input.displayName || input.displayName.length < 3) {
            throw new Error('Display name must be at least 3 characters');
        }

        if (!input.description || input.description.length < 20) {
            throw new Error('Description must be at least 20 characters');
        }

        if (!input.content) {
            throw new Error('Skill content is required');
        }

        if (input.triggers.length === 0 && input.toolNames.length === 0) {
            throw new Error('Skill must have at least one trigger or tool');
        }
    }

    private isVersionHigher(newVersion: string, currentVersion: string): boolean {
        const parse = (v: string) => v.split('.').map(n => parseInt(n, 10));
        const [newMajor, newMinor = 0, newPatch = 0] = parse(newVersion);
        const [curMajor, curMinor = 0, curPatch = 0] = parse(currentVersion);

        if (newMajor > curMajor) return true;
        if (newMajor < curMajor) return false;
        if (newMinor > curMinor) return true;
        if (newMinor < curMinor) return false;
        return newPatch > curPatch;
    }

    private async syncToResourceStore(skill: Skill): Promise<void> {
        if (!this.resourceStore) return;

        await this.resourceStore.create({
            resourceType: 'skill',
            ownerType: 'system',
            ownerId: 'marketplace',
            name: skill.displayName,
            description: skill.description,
            content: skill.content,
            parts: [{
                type: 'data',
                data: {
                    marketplaceId: skill.id,
                    version: skill.version,
                    author: skill.author,
                    category: skill.category,
                    stats: skill.stats,
                },
            }],
            typeMetadata: {
                type: 'skill',
                triggers: skill.triggers,
                toolNames: skill.toolNames,
                parameters: skill.parameters,
            } as SkillMetadata,
            version: 1,
            isActive: true,
            isPinned: false,
            tags: [...skill.tags, 'marketplace', skill.category],
            provenance: 'imported',
            usageFrequency: 0,
            syncToFile: false,
        });
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createSkillMarketplaceService(
    resourceStore?: ResourceStore
): SkillMarketplaceService {
    return new SkillMarketplaceService(resourceStore);
}

export default SkillMarketplaceService;
