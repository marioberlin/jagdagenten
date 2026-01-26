/**
 * Skill Recommendations Service
 * 
 * Provides "users who installed X also installed Y" recommendations
 * based on co-installation patterns stored in a materialized view.
 */

import { query } from '../db.js';

// ============================================================================
// Types
// ============================================================================

export interface SkillRecommendation {
    skillId: string;
    name: string;
    description: string;
    coinstallCount: number;
}

// ============================================================================
// Recommendations Service
// ============================================================================

/**
 * Get skill recommendations based on co-installation patterns
 */
export async function getRecommendations(
    skillId: string,
    limit = 5
): Promise<SkillRecommendation[]> {
    try {
        const result = await query(`
            SELECT
                s.id AS skill_id,
                s.name,
                s.description,
                c.coinstall_count
            FROM skill_coinstallations c
            JOIN marketplace_skills s ON s.id = c.related_skill
            WHERE c.base_skill = $1
            ORDER BY c.coinstall_count DESC
            LIMIT $2
        `, [skillId, limit]);

        return result.rows.map((row: any) => ({
            skillId: row.skill_id,
            name: row.name,
            description: row.description,
            coinstallCount: row.coinstall_count,
        }));
    } catch (error) {
        // View might not exist yet
        console.warn('[Recommendations] Query failed:', error);
        return [];
    }
}

/**
 * Refresh the recommendations materialized view
 * Should be called daily via cron
 */
export async function refreshRecommendations(): Promise<void> {
    try {
        console.info('[Recommendations] Refreshing materialized view...');
        await query('REFRESH MATERIALIZED VIEW CONCURRENTLY skill_coinstallations');
        console.info('[Recommendations] Refresh complete');
    } catch (error) {
        console.error('[Recommendations] Refresh failed:', error);
    }
}

/**
 * Get popular skills (most installed)
 */
export async function getPopularSkills(limit = 10): Promise<SkillRecommendation[]> {
    try {
        const result = await query(`
            SELECT
                s.id AS skill_id,
                s.name,
                s.description,
                COUNT(i.id) AS install_count
            FROM marketplace_skills s
            LEFT JOIN marketplace_skill_installations i ON i.skill_id = s.id
            WHERE s.visibility = 'public' OR s.visibility IS NULL
            GROUP BY s.id, s.name, s.description
            ORDER BY install_count DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map((row: any) => ({
            skillId: row.skill_id,
            name: row.name,
            description: row.description,
            coinstallCount: row.install_count,
        }));
    } catch (error) {
        console.warn('[Recommendations] Popular skills query failed:', error);
        return [];
    }
}

/**
 * Get trending skills (most installed in last 7 days)
 */
export async function getTrendingSkills(limit = 10): Promise<SkillRecommendation[]> {
    try {
        const result = await query(`
            SELECT
                s.id AS skill_id,
                s.name,
                s.description,
                COUNT(i.id) AS install_count
            FROM marketplace_skills s
            LEFT JOIN marketplace_skill_installations i ON i.skill_id = s.id
                AND i.installed_at > NOW() - INTERVAL '7 days'
            WHERE s.visibility = 'public' OR s.visibility IS NULL
            GROUP BY s.id, s.name, s.description
            HAVING COUNT(i.id) > 0
            ORDER BY install_count DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map((row: any) => ({
            skillId: row.skill_id,
            name: row.name,
            description: row.description,
            coinstallCount: row.install_count,
        }));
    } catch (error) {
        console.warn('[Recommendations] Trending skills query failed:', error);
        return [];
    }
}

export default {
    getRecommendations,
    refreshRecommendations,
    getPopularSkills,
    getTrendingSkills,
};
