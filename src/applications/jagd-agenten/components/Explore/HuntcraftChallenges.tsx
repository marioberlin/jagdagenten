/**
 * Huntcraft Mini-Challenges Dashboard
 *
 * - Weekly challenge cards
 * - Progress tracking
 * - Respectful gamification (no social pressure)
 * - Achievement badges
 */

import { useState, useEffect } from 'react';
import {
    Trophy,
    Target,
    Wind,
    BookOpen,
    Crosshair,
    CheckCircle,
    Award,
    Star,
    RefreshCw,
    Clock,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: 'silent_approach' | 'wind_perfect' | 'journal' | 'zero_check';
    target: number;
    progress: number;
    period: 'weekly' | 'monthly';
    expiresAt: string;
    completed: boolean;
    xpReward: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    tier: 'bronze' | 'silver' | 'gold';
}

interface HuntcraftData {
    activeChallenges: Challenge[];
    completedThisWeek: number;
    totalXP: number;
    level: number;
    xpToNextLevel: number;
    recentAchievements: Achievement[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockData(): HuntcraftData {
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));

    return {
        activeChallenges: [
            {
                id: '1',
                title: '3 Stille Ansitze',
                description: 'Absolviere 3 Ansitze ohne deine Position zu verraten',
                icon: 'silent_approach',
                target: 3,
                progress: 2,
                period: 'weekly',
                expiresAt: nextSunday.toISOString(),
                completed: false,
                xpReward: 50,
            },
            {
                id: '2',
                title: '2 Wind-Perfekte Sitze',
                description: 'Positioniere dich 2x perfekt zum Wind',
                icon: 'wind_perfect',
                target: 2,
                progress: 2,
                period: 'weekly',
                expiresAt: nextSunday.toISOString(),
                completed: true,
                xpReward: 40,
            },
            {
                id: '3',
                title: 'Saubere Journal-Woche',
                description: 'Führe 7 Tage am Stück dein Jagdtagebuch',
                icon: 'journal',
                target: 7,
                progress: 4,
                period: 'weekly',
                expiresAt: nextSunday.toISOString(),
                completed: false,
                xpReward: 75,
            },
            {
                id: '4',
                title: 'Nullpunkt-Check',
                description: 'Überprüfe den Nullpunkt einer Waffe',
                icon: 'zero_check',
                target: 1,
                progress: 0,
                period: 'weekly',
                expiresAt: nextSunday.toISOString(),
                completed: false,
                xpReward: 30,
            },
        ],
        completedThisWeek: 1,
        totalXP: 420,
        level: 3,
        xpToNextLevel: 80,
        recentAchievements: [
            {
                id: '1',
                title: 'Wind-Meister',
                description: '10 wind-perfekte Ansitze absolviert',
                earnedAt: '2026-01-25',
                tier: 'silver',
            },
            {
                id: '2',
                title: 'Tagebuch-Schreiber',
                description: 'Erste vollständige Journal-Woche',
                earnedAt: '2026-01-20',
                tier: 'bronze',
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChallengeCard({ challenge }: { challenge: Challenge }) {
    const iconMap = {
        silent_approach: Target,
        wind_perfect: Wind,
        journal: BookOpen,
        zero_check: Crosshair,
    };

    const Icon = iconMap[challenge.icon];
    const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);

    const daysLeft = Math.ceil(
        (new Date(challenge.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className={`challenge-card ${challenge.completed ? 'completed' : ''}`}>
            <div className="challenge-icon">
                {challenge.completed ? (
                    <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
                ) : (
                    <Icon className="w-6 h-6" />
                )}
            </div>

            <div className="challenge-content">
                <div className="challenge-header">
                    <h4 className="challenge-title">{challenge.title}</h4>
                    <span className="xp-reward">+{challenge.xpReward} XP</span>
                </div>

                <p className="challenge-desc">{challenge.description}</p>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${progressPercent}%`,
                            background: challenge.completed ? '#10b981' : '#3b82f6',
                        }}
                    />
                </div>

                <div className="challenge-footer">
                    <span className="progress-text">
                        {challenge.progress} / {challenge.target}
                    </span>
                    {!challenge.completed && (
                        <span className="expires">
                            <Clock className="w-3 h-3" />
                            {daysLeft} Tage
                        </span>
                    )}
                </div>
            </div>

            <style>{`
                .challenge-card {
                    display: flex;
                    gap: 14px;
                    padding: 14px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 12px;
                }
                .challenge-card.completed {
                    background: rgba(16, 185, 129, 0.05);
                    border-color: rgba(16, 185, 129, 0.3);
                }
                .challenge-icon {
                    color: var(--text-secondary, #aaa);
                }
                .challenge-content {
                    flex: 1;
                }
                .challenge-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .challenge-title {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                .xp-reward {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #f59e0b;
                }
                .challenge-desc {
                    font-size: 0.8rem;
                    color: var(--text-tertiary, #666);
                    margin: 0 0 10px;
                }
                .progress-bar {
                    height: 6px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
                .challenge-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .progress-text {
                    font-size: 0.75rem;
                    color: var(--text-secondary, #aaa);
                }
                .expires {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
    const tierColors = {
        bronze: '#cd7f32',
        silver: '#c0c0c0',
        gold: '#ffd700',
    };

    return (
        <div className="achievement-badge" style={{ borderColor: tierColors[achievement.tier] }}>
            <Award className="w-5 h-5" style={{ color: tierColors[achievement.tier] }} />
            <div className="badge-info">
                <span className="badge-title">{achievement.title}</span>
                <span className="badge-desc">{achievement.description}</span>
            </div>

            <style>{`
                .achievement-badge {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid;
                    border-radius: 10px;
                }
                .badge-info {
                    flex: 1;
                }
                .badge-title {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }
                .badge-desc {
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}

function LevelProgress({ level, xp, xpToNext }: { level: number; xp: number; xpToNext: number }) {
    const xpForLevel = 100 + (level - 1) * 50;
    const currentLevelXP = xpForLevel - xpToNext;
    const percent = (currentLevelXP / xpForLevel) * 100;

    return (
        <div className="level-progress">
            <div className="level-badge">
                <Star className="w-5 h-5" />
                <span>Level {level}</span>
            </div>
            <div className="xp-info">
                <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="xp-text">{xp} XP · {xpToNext} bis Level {level + 1}</span>
            </div>

            <style>{`
                .level-progress {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 14px;
                    background: linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0.02));
                    border: 1px solid rgba(250, 204, 21, 0.3);
                    border-radius: 12px;
                }
                .level-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #facc15;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                .xp-info {
                    flex: 1;
                }
                .xp-bar {
                    height: 8px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 6px;
                }
                .xp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #facc15, #f59e0b);
                    border-radius: 4px;
                }
                .xp-text {
                    font-size: 0.75rem;
                    color: var(--text-secondary, #aaa);
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HuntcraftChallenges() {
    const [data, setData] = useState<HuntcraftData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 400);
    }, []);

    if (loading || !data) {
        return (
            <div className="challenges-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Waidwerk...</span>
            </div>
        );
    }

    const activeChallenges = data.activeChallenges.filter(c => !c.completed);
    const completedChallenges = data.activeChallenges.filter(c => c.completed);

    return (
        <div className="huntcraft-challenges">
            {/* Header */}
            <div className="challenges-header">
                <div className="header-title">
                    <Trophy className="w-5 h-5" />
                    <h2>Waidwerk</h2>
                </div>
                <span className="week-progress">
                    {data.completedThisWeek}/{data.activeChallenges.length} diese Woche
                </span>
            </div>

            {/* Level Progress */}
            <LevelProgress level={data.level} xp={data.totalXP} xpToNext={data.xpToNextLevel} />

            {/* Active Challenges */}
            <section className="section">
                <h3 className="section-title">
                    <Target className="w-4 h-4" />
                    Aktive Herausforderungen ({activeChallenges.length})
                </h3>
                <div className="challenges-list">
                    {activeChallenges.map(c => (
                        <ChallengeCard key={c.id} challenge={c} />
                    ))}
                </div>
            </section>

            {/* Completed This Week */}
            {completedChallenges.length > 0 && (
                <section className="section">
                    <h3 className="section-title">
                        <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                        Abgeschlossen ({completedChallenges.length})
                    </h3>
                    <div className="challenges-list">
                        {completedChallenges.map(c => (
                            <ChallengeCard key={c.id} challenge={c} />
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Achievements */}
            {data.recentAchievements.length > 0 && (
                <section className="section">
                    <h3 className="section-title">
                        <Award className="w-4 h-4" />
                        Letzte Auszeichnungen
                    </h3>
                    <div className="achievements-list">
                        {data.recentAchievements.map(a => (
                            <AchievementBadge key={a.id} achievement={a} />
                        ))}
                    </div>
                </section>
            )}

            {/* Respectful Note */}
            <div className="philosophy-note">
                <p>
                    Waidwerk-Herausforderungen sind persönlich. Deine Fortschritte sind nur für dich sichtbar –
                    kein Wettbewerb, kein sozialer Druck.
                </p>
            </div>

            <style>{`
                .huntcraft-challenges {
                    padding: 16px;
                }
                .challenges-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary, #aaa);
                }
                .challenges-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-title h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                .week-progress {
                    font-size: 0.8rem;
                    color: #10b981;
                }
                .section {
                    margin-top: 20px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                    margin: 0 0 12px;
                }
                .challenges-list, .achievements-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .philosophy-note {
                    margin-top: 24px;
                    padding: 12px;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 10px;
                    text-align: center;
                }
                .philosophy-note p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: var(--text-tertiary, #666);
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
