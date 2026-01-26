/**
 * Skill Marketplace Integration Tests
 * 
 * Tests for the skill marketplace including:
 * - Skill publishing and versioning
 * - Search and discovery
 * - Community features (stars, comments)
 * - Installation
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { SkillMarketplaceService, type Skill, type PublishSkillInput } from '../../server/src/marketplace/skill-marketplace';

// ============================================================================
// Test Setup
// ============================================================================

describe('Skill Marketplace', () => {
    let marketplace: SkillMarketplaceService;

    const testAuthor = {
        id: 'author-1',
        username: 'testauthor',
        displayName: 'Test Author',
    };

    const createTestSkill = (override: Partial<PublishSkillInput> = {}): PublishSkillInput => ({
        name: `test-skill-${Date.now()}`,
        displayName: 'Test Skill',
        description: 'A test skill for integration testing purposes',
        category: 'automation',
        tags: ['test', 'integration'],
        triggers: ['test'],
        toolNames: ['test_tool'],
        parameters: [
            { name: 'input', type: 'string', description: 'Test input', required: true },
        ],
        content: 'This is the skill content',
        examples: [
            { title: 'Basic usage', input: 'test input', output: 'test output' },
        ],
        ...override,
    });

    beforeEach(() => {
        // Fresh marketplace for each test
        marketplace = new SkillMarketplaceService();
    });

    // ============================================================================
    // Publishing Tests
    // ============================================================================

    describe('Publishing', () => {
        it('should publish a new skill', async () => {
            const input = createTestSkill();
            const skill = await marketplace.publish(input, testAuthor);

            expect(skill.id).toBeDefined();
            expect(skill.name).toBe(input.name);
            expect(skill.version).toBe('1.0.0');
            expect(skill.author.id).toBe(testAuthor.id);
            expect(skill.isPublished).toBe(true);
        });

        it('should reject duplicate skill names', async () => {
            const input = createTestSkill({ name: 'unique-skill-name' });
            await marketplace.publish(input, testAuthor);

            await expect(
                marketplace.publish(input, testAuthor)
            ).rejects.toThrow('already exists');
        });

        it('should validate skill name format', async () => {
            const input = createTestSkill({ name: 'Invalid Name With Spaces' });

            await expect(
                marketplace.publish(input, testAuthor)
            ).rejects.toThrow('lowercase alphanumeric');
        });

        it('should require minimum description length', async () => {
            const input = createTestSkill({ description: 'Too short' });

            await expect(
                marketplace.publish(input, testAuthor)
            ).rejects.toThrow('at least 20 characters');
        });
    });

    // ============================================================================
    // Versioning Tests
    // ============================================================================

    describe('Versioning', () => {
        it('should publish a new version', async () => {
            const input = createTestSkill();
            const skill = await marketplace.publish(input, testAuthor);

            const updated = await marketplace.publishVersion(
                skill.id,
                '1.1.0',
                'Added new feature',
                'Updated content'
            );

            expect(updated.version).toBe('1.1.0');
            expect(updated.versions.length).toBe(2);
            expect(updated.versions[1].changelog).toBe('Added new feature');
        });

        it('should reject lower version numbers', async () => {
            const input = createTestSkill();
            const skill = await marketplace.publish(input, testAuthor);

            await expect(
                marketplace.publishVersion(skill.id, '0.9.0', 'Invalid version')
            ).rejects.toThrow('must be higher');
        });

        it('should reject same version number', async () => {
            const input = createTestSkill();
            const skill = await marketplace.publish(input, testAuthor);

            await expect(
                marketplace.publishVersion(skill.id, '1.0.0', 'Duplicate version')
            ).rejects.toThrow('must be higher');
        });
    });

    // ============================================================================
    // Search Tests
    // ============================================================================

    describe('Search', () => {
        beforeEach(async () => {
            // Seed some skills
            await marketplace.publish(createTestSkill({
                name: 'search-skill-1',
                displayName: 'Data Analyzer',
                category: 'data',
                tags: ['analytics', 'data'],
            }), testAuthor);

            await marketplace.publish(createTestSkill({
                name: 'search-skill-2',
                displayName: 'Code Generator',
                category: 'coding',
                tags: ['code', 'automation'],
            }), testAuthor);

            await marketplace.publish(createTestSkill({
                name: 'search-skill-3',
                displayName: 'Email Automator',
                category: 'automation',
                tags: ['email', 'automation'],
            }), testAuthor);
        });

        it('should search by query', async () => {
            const result = await marketplace.search({ query: 'analyzer' });

            expect(result.skills.length).toBe(1);
            expect(result.skills[0].displayName).toBe('Data Analyzer');
        });

        it('should filter by category', async () => {
            const result = await marketplace.search({ category: 'automation' });

            expect(result.skills.length).toBe(1);
            expect(result.skills[0].displayName).toBe('Email Automator');
        });

        it('should filter by tags', async () => {
            const result = await marketplace.search({ tags: ['automation'] });

            expect(result.skills.length).toBe(2);
        });

        it('should paginate results', async () => {
            const page1 = await marketplace.search({ limit: 2, offset: 0 });
            const page2 = await marketplace.search({ limit: 2, offset: 2 });

            expect(page1.skills.length).toBe(2);
            expect(page2.skills.length).toBe(1);
            expect(page1.total).toBe(3);
        });
    });

    // ============================================================================
    // Community Features Tests
    // ============================================================================

    describe('Stars', () => {
        it('should star a skill', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            const result = await marketplace.star(skill.id, 'user-1');

            expect(result.stars).toBe(1);
        });

        it('should not duplicate stars from same user', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.star(skill.id, 'user-1');
            await marketplace.star(skill.id, 'user-1');

            const updated = await marketplace.getById(skill.id);
            expect(updated?.stats.stars).toBe(1);
        });

        it('should unstar a skill', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.star(skill.id, 'user-1');
            const result = await marketplace.unstar(skill.id, 'user-1');

            expect(result.stars).toBe(0);
        });

        it('should check if user has starred', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.star(skill.id, 'user-1');

            const starred = await marketplace.hasStarred(skill.id, 'user-1');
            const notStarred = await marketplace.hasStarred(skill.id, 'user-2');

            expect(starred).toBe(true);
            expect(notStarred).toBe(false);
        });
    });

    describe('Comments', () => {
        it('should add a comment', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            const comment = await marketplace.addComment(
                skill.id,
                'user-1',
                'commenter',
                'Great skill!',
                5
            );

            expect(comment.id).toBeDefined();
            expect(comment.content).toBe('Great skill!');
            expect(comment.rating).toBe(5);
        });

        it('should update skill rating from comments', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.addComment(skill.id, 'user-1', 'user1', 'Good', 4);
            await marketplace.addComment(skill.id, 'user-2', 'user2', 'Great', 5);

            const updated = await marketplace.getById(skill.id);

            expect(updated?.stats.rating).toBe(4.5);
            expect(updated?.stats.ratingCount).toBe(2);
            expect(updated?.stats.comments).toBe(2);
        });

        it('should get comments for a skill', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.addComment(skill.id, 'user-1', 'user1', 'Comment 1');
            await marketplace.addComment(skill.id, 'user-2', 'user2', 'Comment 2');

            const comments = await marketplace.getComments(skill.id);

            expect(comments.length).toBe(2);
        });

        it('should delete a comment', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);
            const comment = await marketplace.addComment(
                skill.id,
                'user-1',
                'user1',
                'To be deleted'
            );

            await marketplace.deleteComment(skill.id, comment.id, 'user-1');

            const comments = await marketplace.getComments(skill.id);
            expect(comments.length).toBe(0);
        });

        it('should not allow deleting others comments', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);
            const comment = await marketplace.addComment(
                skill.id,
                'user-1',
                'user1',
                'Not yours'
            );

            await expect(
                marketplace.deleteComment(skill.id, comment.id, 'user-2')
            ).rejects.toThrow('Only the comment author');
        });
    });

    // ============================================================================
    // Usage Tracking Tests
    // ============================================================================

    describe('Usage Tracking', () => {
        it('should record usage', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.recordUsage(skill.id);
            await marketplace.recordUsage(skill.id);
            await marketplace.recordUsage(skill.id);

            const updated = await marketplace.getById(skill.id);
            expect(updated?.stats.usages).toBe(3);
        });

        it('should record downloads', async () => {
            const skill = await marketplace.publish(createTestSkill(), testAuthor);

            await marketplace.recordDownload(skill.id);
            await marketplace.recordDownload(skill.id);

            const updated = await marketplace.getById(skill.id);
            expect(updated?.stats.downloads).toBe(2);
        });
    });
});
