/**
 * Marketplace API Routes
 * 
 * REST API for skill marketplace operations.
 */

import { Elysia, t } from 'elysia';
import { SkillMarketplaceService } from '../marketplace/skill-marketplace';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

// Create service instance
const marketplace = new SkillMarketplaceService();

// ============================================================================
// Routes
// ============================================================================

export const marketplaceRoutes = new Elysia({ prefix: '/api/v1/marketplace' })
    // Search skills
    .get('/skills', async ({ query }) => {
        const {
            q,
            category,
            tags,
            sortBy = 'recent',
            limit = 20,
            offset = 0,
        } = query as any;

        const result = await marketplace.search({
            query: q,
            category,
            tags: tags?.split(','),
            sortBy,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        return {
            skills: result.skills,
            total: result.total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        };
    })

    // Get featured skills
    .get('/skills/featured', async ({ query }) => {
        const limit = parseInt((query as any).limit || '10');
        const skills = await marketplace.getFeatured(limit);
        return { skills };
    })

    // Get skills by category
    .get('/skills/category/:category', async ({ params, query }) => {
        const limit = parseInt((query as any).limit || '20');
        const skills = await marketplace.getByCategory(params.category as any, limit);
        return { skills };
    }, {
        params: t.Object({
            category: t.String(),
        }),
    })

    // Get a specific skill
    .get('/skills/:id', async ({ params }) => {
        const skill = await marketplace.getById(params.id);
        if (!skill) {
            return { error: 'Skill not found' };
        }
        return { skill };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Publish a new skill
    .post('/skills', async ({ body, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';
        const username = headers['x-user-name'] || 'anonymous';

        try {
            const skill = await marketplace.publish(body as any, {
                id: userId,
                username,
            });

            logger.info({ skillId: skill.id, author: username }, 'Skill published');
            return { success: true, skill };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    })

    // Publish a new version
    .post('/skills/:id/versions', async ({ params, body, headers }) => {
        const userId = headers['x-user-id'];
        const { version, changelog, content } = body as any;

        try {
            const skill = await marketplace.publishVersion(
                params.id,
                version,
                changelog,
                content,
                userId
            );

            logger.info({ skillId: params.id, version }, 'Skill version published');
            return { success: true, skill };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Star a skill
    .post('/skills/:id/star', async ({ params, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';

        try {
            const result = await marketplace.star(params.id, userId);
            return { success: true, stars: result.stars };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Unstar a skill
    .delete('/skills/:id/star', async ({ params, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';

        try {
            const result = await marketplace.unstar(params.id, userId);
            return { success: true, stars: result.stars };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Check if user has starred
    .get('/skills/:id/starred', async ({ params, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';
        const starred = await marketplace.hasStarred(params.id, userId);
        return { starred };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Get skill comments
    .get('/skills/:id/comments', async ({ params }) => {
        const comments = await marketplace.getComments(params.id);
        return { comments };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Add a comment
    .post('/skills/:id/comments', async ({ params, body, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';
        const username = headers['x-user-name'] || 'anonymous';
        const { content, rating } = body as any;

        try {
            const comment = await marketplace.addComment(
                params.id,
                userId,
                username,
                content,
                rating
            );
            return { success: true, comment };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Delete a comment
    .delete('/skills/:id/comments/:commentId', async ({ params, headers }) => {
        const userId = headers['x-user-id'] || 'anonymous';

        try {
            await marketplace.deleteComment(params.id, params.commentId, userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
            commentId: t.String(),
        }),
    })

    // Install a skill
    .post('/skills/:id/install', async ({ params, body }) => {
        const { ownerType, ownerId } = body as any;

        try {
            const resource = await marketplace.install(params.id, ownerType, ownerId);

            if (!resource) {
                return { success: false, error: 'Installation failed' };
            }

            logger.info({ skillId: params.id, ownerType, ownerId }, 'Skill installed');
            return { success: true, resourceId: resource.id };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // Record skill usage
    .post('/skills/:id/usage', async ({ params }) => {
        await marketplace.recordUsage(params.id);
        return { success: true };
    }, {
        params: t.Object({
            id: t.String(),
        }),
    });

export default marketplaceRoutes;
