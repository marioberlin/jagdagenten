/**
 * Huntcraft Challenges API Routes
 *
 * Endpoints for gamified challenge system:
 * - Challenge templates (weekly/monthly)
 * - User progress tracking
 * - XP & level management
 * - Achievement system
 *
 * DB tables: challenge_templates, user_challenges, user_huntcraft_stats,
 *            achievements, user_achievements
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeTemplate {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    targetValue: number;
    period: 'daily' | 'weekly' | 'monthly';
    xpReward: number;
    category: 'skill' | 'maintenance' | 'learning';
    isActive: boolean;
}

interface UserChallenge {
    id: string;
    userId: string;
    templateId: string;
    periodStart: string;
    periodEnd: string;
    progress: number;
    completedAt?: string;
}

interface HuntcraftStats {
    userId: string;
    totalXp: number;
    level: number;
    challengesCompleted: number;
    currentStreak: number;
    longestStreak: number;
    lastChallengeDate?: string;
}

interface Achievement {
    id: string;
    slug: string;
    title: string;
    description: string;
    tier: 'bronze' | 'silver' | 'gold';
    requirementType: string;
    requirementValue: number;
}

interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    earnedAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (seed from 026_challenges.sql)
// ---------------------------------------------------------------------------

const templateStore = new Map<string, ChallengeTemplate>();
const userChallengeStore = new Map<string, UserChallenge>();
const statsStore = new Map<string, HuntcraftStats>();
const achievementStore = new Map<string, Achievement>();
const userAchievementStore = new Map<string, UserAchievement>();

// Seed default templates
function seedTemplates() {
    const defaults: Omit<ChallengeTemplate, 'id'>[] = [
        { slug: 'silent_approach_3', title: '3 Stille Ansitze', description: 'Absolviere 3 Ansitze ohne deine Position zu verraten', icon: 'silent_approach', targetValue: 3, period: 'weekly', xpReward: 50, category: 'skill', isActive: true },
        { slug: 'wind_perfect_2', title: '2 Wind-Perfekte Sitze', description: 'Positioniere dich 2x perfekt zum Wind', icon: 'wind_perfect', targetValue: 2, period: 'weekly', xpReward: 40, category: 'skill', isActive: true },
        { slug: 'journal_week', title: 'Saubere Journal-Woche', description: 'Führe 7 Tage am Stück dein Jagdtagebuch', icon: 'journal', targetValue: 7, period: 'weekly', xpReward: 75, category: 'learning', isActive: true },
        { slug: 'zero_check_1', title: 'Nullpunkt-Check', description: 'Überprüfe den Nullpunkt einer Waffe', icon: 'zero_check', targetValue: 1, period: 'weekly', xpReward: 30, category: 'maintenance', isActive: true },
        { slug: 'sighting_report_5', title: '5 Sichtungen melden', description: 'Melde 5 Wildsichtungen an die Community', icon: 'silent_approach', targetValue: 5, period: 'weekly', xpReward: 60, category: 'skill', isActive: true },
        { slug: 'gear_maintenance', title: 'Ausrüstungs-Wartung', description: 'Führe eine Wartungsaufgabe durch', icon: 'zero_check', targetValue: 1, period: 'weekly', xpReward: 25, category: 'maintenance', isActive: true },
    ];

    for (const d of defaults) {
        const id = randomUUID();
        templateStore.set(id, { id, ...d });
    }
}

function seedAchievements() {
    const defaults: Omit<Achievement, 'id'>[] = [
        { slug: 'first_challenge', title: 'Erste Schritte', description: 'Erste Herausforderung abgeschlossen', tier: 'bronze', requirementType: 'challenges_completed', requirementValue: 1 },
        { slug: 'ten_challenges', title: 'Fleißiger Waidmann', description: '10 Herausforderungen abgeschlossen', tier: 'bronze', requirementType: 'challenges_completed', requirementValue: 10 },
        { slug: 'fifty_challenges', title: 'Erfahrener Jäger', description: '50 Herausforderungen abgeschlossen', tier: 'silver', requirementType: 'challenges_completed', requirementValue: 50 },
        { slug: 'week_streak_4', title: 'Monatliche Konstanz', description: '4 Wochen in Folge aktiv', tier: 'bronze', requirementType: 'streak', requirementValue: 4 },
        { slug: 'xp_500', title: 'XP-Sammler', description: '500 XP gesammelt', tier: 'bronze', requirementType: 'xp_earned', requirementValue: 500 },
        { slug: 'xp_2500', title: 'XP-Meister', description: '2500 XP gesammelt', tier: 'silver', requirementType: 'xp_earned', requirementValue: 2500 },
    ];

    for (const d of defaults) {
        const id = randomUUID();
        achievementStore.set(id, { id, ...d });
    }
}

// Initialize seed data
seedTemplates();
seedAchievements();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekBounds(): { start: string; end: string } {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function getOrCreateStats(userId: string): HuntcraftStats {
    let stats = statsStore.get(userId);
    if (!stats) {
        stats = {
            userId,
            totalXp: 0,
            level: 1,
            challengesCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
        };
        statsStore.set(userId, stats);
    }
    return stats;
}

function calculateLevel(xp: number): number {
    // 100 XP per level, increasing by 50 each level
    let level = 1;
    let needed = 100;
    let total = 0;
    while (total + needed <= xp) {
        total += needed;
        level++;
        needed += 50;
    }
    return level;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdChallengesRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/challenges' })

        // ── Templates ──

        .get('/templates', async () => {
            const templates = Array.from(templateStore.values())
                .filter(t => t.isActive);

            return { success: true, templates, count: templates.length };
        })

        // ── Active Challenges (current period) ──

        .get('/active', async ({ query }) => {
            const userId = query.userId ?? 'demo-user';
            const { start, end } = getWeekBounds();

            let challenges = Array.from(userChallengeStore.values())
                .filter(c => c.userId === userId && c.periodStart === start);

            // Auto-create challenges for current week if none exist
            if (challenges.length === 0) {
                const templates = Array.from(templateStore.values()).filter(t => t.isActive);
                for (const tmpl of templates) {
                    const id = randomUUID();
                    const challenge: UserChallenge = {
                        id,
                        userId,
                        templateId: tmpl.id,
                        periodStart: start,
                        periodEnd: end,
                        progress: 0,
                    };
                    userChallengeStore.set(id, challenge);
                    challenges.push(challenge);
                }
            }

            // Enrich with template data
            const enriched = challenges.map(c => {
                const tmpl = templateStore.get(c.templateId);
                return { ...c, template: tmpl ?? null };
            });

            return { success: true, challenges: enriched, count: enriched.length };
        })

        // ── Increment Progress ──

        .post(
            '/progress',
            async ({ body }) => {
                const userId = body.userId ?? 'demo-user';
                const { start } = getWeekBounds();

                // Find the active challenge for this template
                const challenge = Array.from(userChallengeStore.values())
                    .find(c => c.userId === userId && c.templateId === body.templateId && c.periodStart === start);

                if (!challenge) {
                    return { error: 'Keine aktive Herausforderung gefunden', success: false };
                }

                const template = templateStore.get(challenge.templateId);
                if (!template) {
                    return { error: 'Template nicht gefunden', success: false };
                }

                challenge.progress = Math.min(challenge.progress + (body.increment ?? 1), template.targetValue);

                // Check completion
                let justCompleted = false;
                if (challenge.progress >= template.targetValue && !challenge.completedAt) {
                    challenge.completedAt = new Date().toISOString();
                    justCompleted = true;

                    // Award XP
                    const stats = getOrCreateStats(userId);
                    stats.totalXp += template.xpReward;
                    stats.level = calculateLevel(stats.totalXp);
                    stats.challengesCompleted += 1;
                    stats.lastChallengeDate = new Date().toISOString().split('T')[0];
                    statsStore.set(userId, stats);
                }

                userChallengeStore.set(challenge.id, challenge);
                log.info({ challengeId: challenge.id, progress: challenge.progress, justCompleted }, 'Updated challenge progress');

                return {
                    success: true,
                    challenge,
                    justCompleted,
                    xpAwarded: justCompleted ? template.xpReward : 0,
                };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    templateId: t.String(),
                    increment: t.Optional(t.Number()),
                }),
            }
        )

        // ── Stats ──

        .get('/stats', async ({ query }) => {
            const userId = query.userId ?? 'demo-user';
            const stats = getOrCreateStats(userId);

            return { success: true, stats };
        })

        // ── Achievements ──

        .get('/achievements', async ({ query }) => {
            const userId = query.userId ?? 'demo-user';

            const all = Array.from(achievementStore.values());
            const earned = Array.from(userAchievementStore.values())
                .filter(ua => ua.userId === userId);

            const earnedIds = new Set(earned.map(e => e.achievementId));

            const enriched = all.map(a => ({
                ...a,
                earned: earnedIds.has(a.id),
                earnedAt: earned.find(e => e.achievementId === a.id)?.earnedAt ?? null,
            }));

            return { success: true, achievements: enriched, count: enriched.length };
        })

        // ── Check & Award Achievements ──

        .post(
            '/check-achievements',
            async ({ body }) => {
            const userId = body.userId ?? 'demo-user';
            const stats = getOrCreateStats(userId);

            const earned = Array.from(userAchievementStore.values())
                .filter(ua => ua.userId === userId);
            const earnedIds = new Set(earned.map(e => e.achievementId));

            const newlyAwarded: Achievement[] = [];

            for (const achievement of achievementStore.values()) {
                if (earnedIds.has(achievement.id)) continue;

                let qualifies = false;
                switch (achievement.requirementType) {
                    case 'challenges_completed':
                        qualifies = stats.challengesCompleted >= achievement.requirementValue;
                        break;
                    case 'xp_earned':
                        qualifies = stats.totalXp >= achievement.requirementValue;
                        break;
                    case 'streak':
                        qualifies = stats.longestStreak >= achievement.requirementValue;
                        break;
                }

                if (qualifies) {
                    const id = randomUUID();
                    userAchievementStore.set(id, {
                        id,
                        userId,
                        achievementId: achievement.id,
                        earnedAt: new Date().toISOString(),
                    });
                    newlyAwarded.push(achievement);
                }
            }

            if (newlyAwarded.length > 0) {
                log.info({ userId, count: newlyAwarded.length }, 'Awarded new achievements');
            }

            return { success: true, newlyAwarded, count: newlyAwarded.length };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                }),
            }
        );
}

export default createJagdChallengesRoutes;
