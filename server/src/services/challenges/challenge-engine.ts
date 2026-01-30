/**
 * Challenge Engine
 *
 * Manages the Huntcraft gamification system:
 * - Challenge progress tracking
 * - XP and level calculation
 * - Achievement unlocking
 * - Privacy-first: all progress is personal
 */

import { db } from '../../db/index.js';

// ============================================================================
// Types
// ============================================================================

export interface ChallengeTemplate {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: 'silent_approach' | 'wind_perfect' | 'journal' | 'zero_check';
    targetValue: number;
    period: 'daily' | 'weekly' | 'monthly';
    xpReward: number;
    category: 'skill' | 'maintenance' | 'learning';
}

export interface UserChallenge {
    id: string;
    templateId: string;
    template: ChallengeTemplate;
    periodStart: Date;
    periodEnd: Date;
    progress: number;
    completedAt: Date | null;
}

export interface UserStats {
    totalXP: number;
    level: number;
    challengesCompleted: number;
    currentStreak: number;
    longestStreak: number;
    xpToNextLevel: number;
}

export interface Achievement {
    id: string;
    slug: string;
    title: string;
    description: string;
    tier: 'bronze' | 'silver' | 'gold';
    earnedAt?: Date;
}

// ============================================================================
// XP & Level Calculations
// ============================================================================

const XP_PER_LEVEL_BASE = 100;
const XP_PER_LEVEL_INCREMENT = 50;

export function calculateLevel(totalXP: number): number {
    let level = 1;
    let xpRequired = XP_PER_LEVEL_BASE;

    while (totalXP >= xpRequired) {
        totalXP -= xpRequired;
        level++;
        xpRequired = XP_PER_LEVEL_BASE + (level - 1) * XP_PER_LEVEL_INCREMENT;
    }

    return level;
}

export function xpToNextLevel(totalXP: number): number {
    const level = calculateLevel(totalXP);
    let xpConsumed = 0;

    for (let l = 1; l < level; l++) {
        xpConsumed += XP_PER_LEVEL_BASE + (l - 1) * XP_PER_LEVEL_INCREMENT;
    }

    const currentLevelXP = XP_PER_LEVEL_BASE + (level - 1) * XP_PER_LEVEL_INCREMENT;
    return currentLevelXP - (totalXP - xpConsumed);
}

// ============================================================================
// Period Calculations
// ============================================================================

function getWeekBounds(): { start: Date; end: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

// ============================================================================
// Challenge Engine Class
// ============================================================================

export class ChallengeEngine {
    /**
     * Get active challenges for a user for the current period
     */
    async getActiveChallenges(userId: string): Promise<UserChallenge[]> {
        const { start, end } = getWeekBounds();

        const result = await db.query(`
            SELECT
                uc.id,
                uc.template_id,
                uc.period_start,
                uc.period_end,
                uc.progress,
                uc.completed_at,
                ct.slug,
                ct.title,
                ct.description,
                ct.icon,
                ct.target_value,
                ct.period,
                ct.xp_reward,
                ct.category
            FROM user_challenges uc
            JOIN challenge_templates ct ON uc.template_id = ct.id
            WHERE uc.user_id = $1
              AND uc.period_start = $2
        `, [userId, start.toISOString().split('T')[0]]);

        return result.rows.map(row => ({
            id: row.id,
            templateId: row.template_id,
            template: {
                id: row.template_id,
                slug: row.slug,
                title: row.title,
                description: row.description,
                icon: row.icon,
                targetValue: row.target_value,
                period: row.period,
                xpReward: row.xp_reward,
                category: row.category,
            },
            periodStart: new Date(row.period_start),
            periodEnd: new Date(row.period_end),
            progress: row.progress,
            completedAt: row.completed_at ? new Date(row.completed_at) : null,
        }));
    }

    /**
     * Initialize weekly challenges for a user
     */
    async initializeWeeklyChallenges(userId: string): Promise<UserChallenge[]> {
        const { start, end } = getWeekBounds();

        // Check if already initialized
        const existing = await this.getActiveChallenges(userId);
        if (existing.length > 0) {
            return existing;
        }

        // Get active templates
        const templates = await db.query(`
            SELECT id FROM challenge_templates
            WHERE is_active = true AND period = 'weekly'
        `);

        // Create challenges for each template
        for (const template of templates.rows) {
            await db.query(`
                INSERT INTO user_challenges (user_id, template_id, period_start, period_end, progress)
                VALUES ($1, $2, $3, $4, 0)
                ON CONFLICT (user_id, template_id, period_start) DO NOTHING
            `, [userId, template.id, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
        }

        return this.getActiveChallenges(userId);
    }

    /**
     * Update progress for a specific challenge
     */
    async updateProgress(userId: string, challengeId: string, increment: number = 1): Promise<{
        challenge: UserChallenge;
        justCompleted: boolean;
        xpEarned: number;
    }> {
        // Get current challenge state
        const current = await db.query(`
            SELECT uc.*, ct.target_value, ct.xp_reward
            FROM user_challenges uc
            JOIN challenge_templates ct ON uc.template_id = ct.id
            WHERE uc.id = $1 AND uc.user_id = $2
        `, [challengeId, userId]);

        if (current.rows.length === 0) {
            throw new Error('Challenge not found');
        }

        const row = current.rows[0];
        const wasCompleted = row.completed_at !== null;
        const newProgress = Math.min(row.progress + increment, row.target_value);
        const isNowComplete = newProgress >= row.target_value;
        const justCompleted = !wasCompleted && isNowComplete;

        // Update progress
        await db.query(`
            UPDATE user_challenges
            SET progress = $1,
                completed_at = CASE WHEN $2 THEN NOW() ELSE completed_at END
            WHERE id = $3
        `, [newProgress, justCompleted, challengeId]);

        // Award XP if just completed
        let xpEarned = 0;
        if (justCompleted) {
            xpEarned = row.xp_reward;
            await this.awardXP(userId, xpEarned);
            await this.checkAchievements(userId);
        }

        const challenge = (await this.getActiveChallenges(userId)).find(c => c.id === challengeId)!;

        return { challenge, justCompleted, xpEarned };
    }

    /**
     * Award XP to a user
     */
    private async awardXP(userId: string, xp: number): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        await db.query(`
            INSERT INTO user_huntcraft_stats (user_id, total_xp, challenges_completed, last_challenge_date)
            VALUES ($1, $2, 1, $3)
            ON CONFLICT (user_id) DO UPDATE SET
                total_xp = user_huntcraft_stats.total_xp + $2,
                challenges_completed = user_huntcraft_stats.challenges_completed + 1,
                last_challenge_date = $3,
                updated_at = NOW()
        `, [userId, xp, today]);

        // Recalculate level
        const stats = await db.query(`SELECT total_xp FROM user_huntcraft_stats WHERE user_id = $1`, [userId]);
        const newLevel = calculateLevel(stats.rows[0].total_xp);

        await db.query(`UPDATE user_huntcraft_stats SET level = $1 WHERE user_id = $2`, [newLevel, userId]);
    }

    /**
     * Get user stats
     */
    async getUserStats(userId: string): Promise<UserStats> {
        // Ensure stats row exists
        await db.query(`
            INSERT INTO user_huntcraft_stats (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
        `, [userId]);

        const result = await db.query(`
            SELECT total_xp, level, challenges_completed, current_streak, longest_streak
            FROM user_huntcraft_stats
            WHERE user_id = $1
        `, [userId]);

        const row = result.rows[0];

        return {
            totalXP: row.total_xp,
            level: row.level,
            challengesCompleted: row.challenges_completed,
            currentStreak: row.current_streak,
            longestStreak: row.longest_streak,
            xpToNextLevel: xpToNextLevel(row.total_xp),
        };
    }

    /**
     * Get user achievements
     */
    async getUserAchievements(userId: string): Promise<Achievement[]> {
        const result = await db.query(`
            SELECT a.id, a.slug, a.title, a.description, a.tier, ua.earned_at
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            ORDER BY ua.earned_at IS NOT NULL DESC, a.tier DESC
        `, [userId]);

        return result.rows.map(row => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            description: row.description,
            tier: row.tier,
            earnedAt: row.earned_at ? new Date(row.earned_at) : undefined,
        }));
    }

    /**
     * Check and unlock achievements
     */
    private async checkAchievements(userId: string): Promise<Achievement[]> {
        const stats = await this.getUserStats(userId);
        const unlocked: Achievement[] = [];

        // Get all unearned achievements
        const unearned = await db.query(`
            SELECT a.*
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE ua.id IS NULL
        `, [userId]);

        for (const achievement of unearned.rows) {
            let earned = false;

            switch (achievement.requirement_type) {
                case 'challenges_completed':
                    earned = stats.challengesCompleted >= achievement.requirement_value;
                    break;
                case 'xp_earned':
                    earned = stats.totalXP >= achievement.requirement_value;
                    break;
                case 'streak':
                    earned = stats.longestStreak >= achievement.requirement_value;
                    break;
            }

            if (earned) {
                await db.query(`
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [userId, achievement.id]);

                unlocked.push({
                    id: achievement.id,
                    slug: achievement.slug,
                    title: achievement.title,
                    description: achievement.description,
                    tier: achievement.tier,
                    earnedAt: new Date(),
                });
            }
        }

        return unlocked;
    }
}

// Export singleton
export const challengeEngine = new ChallengeEngine();
