/**
 * Public Marketplace Routes
 *
 * Public API endpoints for the skill registry.
 * No authentication required - exposes public skills for discovery.
 *
 * Base path: /api/v1/public/skills
 */

import { Elysia, t } from 'elysia';
import { query } from '../db.js';

// ============================================================================
// Types
// ============================================================================

interface PublicSkill {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    author: string;
    version: string;
    stars: number;
    downloads: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Public Marketplace Plugin
// ============================================================================

export const publicMarketplacePlugin = new Elysia({ prefix: '/api/v1/public' })

    // ========================================================================
    // List Public Skills
    // ========================================================================
    .get('/skills', async ({ query: queryParams }) => {
        const limit = Math.min(queryParams.limit ?? 50, 100);
        const offset = queryParams.offset ?? 0;
        const category = queryParams.category;
        const search = queryParams.q;

        try {
            let skills;

            if (search) {
                skills = await query(`
                    SELECT
                        s.id, s.name, s.description, s.category, s.tags,
                        s.author_id AS author, s.current_version AS version,
                        s.stars_count AS stars, s.downloads_count AS downloads,
                        s.created_at, s.updated_at
                    FROM marketplace_skills s
                    WHERE s.visibility = 'public'
                    AND (
                        s.name ILIKE $1
                        OR s.description ILIKE $1
                        OR $2 = ANY(s.tags)
                    )
                    ORDER BY s.stars_count DESC, s.downloads_count DESC
                    LIMIT $3 OFFSET $4
                `, ['%' + search + '%', search, limit, offset]);
            } else if (category) {
                skills = await query(`
                    SELECT
                        s.id, s.name, s.description, s.category, s.tags,
                        s.author_id AS author, s.current_version AS version,
                        s.stars_count AS stars, s.downloads_count AS downloads,
                        s.created_at, s.updated_at
                    FROM marketplace_skills s
                    WHERE s.visibility = 'public'
                    AND s.category = $1
                    ORDER BY s.stars_count DESC, s.downloads_count DESC
                    LIMIT $2 OFFSET $3
                `, [category, limit, offset]);
            } else {
                skills = await query(`
                    SELECT
                        s.id, s.name, s.description, s.category, s.tags,
                        s.author_id AS author, s.current_version AS version,
                        s.stars_count AS stars, s.downloads_count AS downloads,
                        s.created_at, s.updated_at
                    FROM marketplace_skills s
                    WHERE s.visibility = 'public'
                    ORDER BY s.stars_count DESC, s.downloads_count DESC
                    LIMIT $1 OFFSET $2
                `, [limit, offset]);
            }

            // Get total count
            const countResult = await query(`
                SELECT COUNT(*) as total
                FROM marketplace_skills
                WHERE visibility = 'public'
            `);

            return {
                skills: skills.rows.map(formatSkill),
                total: Number(countResult.rows[0]?.total ?? 0),
                limit,
                offset,
                registry: 'liquid-os.app',
            };
        } catch (error) {
            console.error('[PublicMarketplace] List failed:', error);
            return { skills: [], total: 0, limit, offset, registry: 'liquid-os.app' };
        }
    }, {
        query: t.Object({
            limit: t.Optional(t.Number()),
            offset: t.Optional(t.Number()),
            category: t.Optional(t.String()),
            q: t.Optional(t.String()),
        }),
    })

    // ========================================================================
    // Get Single Public Skill
    // ========================================================================
    .get('/skills/:id', async ({ params, set }) => {
        try {
            const result = await query(`
                SELECT
                    s.id, s.name, s.description, s.category, s.tags,
                    s.author_id AS author, s.current_version AS version,
                    s.stars_count AS stars, s.downloads_count AS downloads,
                    s.created_at, s.updated_at, s.readme
                FROM marketplace_skills s
                WHERE s.id = $1
                AND s.visibility = 'public'
            `, [params.id]);

            if (result.rows.length === 0) {
                set.status = 404;
                return { error: 'Skill not found or not public' };
            }

            return {
                skill: formatSkill(result.rows[0]),
                readme: result.rows[0].readme,
                registry: 'liquid-os.app',
            };
        } catch (error) {
            console.error('[PublicMarketplace] Get skill failed:', error);
            set.status = 500;
            return { error: 'Failed to fetch skill' };
        }
    })

    // ========================================================================
    // Get Skill Versions
    // ========================================================================
    .get('/skills/:id/versions', async ({ params, set }) => {
        try {
            // First verify skill is public
            const skill = await query(`
                SELECT id FROM marketplace_skills
                WHERE id = $1 AND visibility = 'public'
            `, [params.id]);

            if (skill.rows.length === 0) {
                set.status = 404;
                return { error: 'Skill not found or not public' };
            }

            const versions = await query(`
                SELECT version, changelog, created_at
                FROM marketplace_skill_versions
                WHERE skill_id = $1
                ORDER BY created_at DESC
            `, [params.id]);

            return {
                skillId: params.id,
                versions: versions.rows.map((v: any) => ({
                    version: v.version,
                    changelog: v.changelog,
                    publishedAt: v.created_at,
                })),
            };
        } catch (error) {
            console.error('[PublicMarketplace] Get versions failed:', error);
            set.status = 500;
            return { error: 'Failed to fetch versions' };
        }
    })

    // ========================================================================
    // Registry Info
    // ========================================================================
    .get('/info', () => ({
        name: 'LiquidOS Skill Registry',
        url: 'https://liquid-os.app',
        apiVersion: '1.0',
        features: ['semantic-search', 'recommendations', 'versioning'],
    }));

// ============================================================================
// Helpers
// ============================================================================

function formatSkill(row: any): PublicSkill {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        tags: row.tags ?? [],
        author: row.author,
        version: row.version,
        stars: Number(row.stars ?? 0),
        downloads: Number(row.downloads ?? 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export default publicMarketplacePlugin;
