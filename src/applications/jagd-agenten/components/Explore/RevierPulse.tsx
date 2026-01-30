/**
 * Revier Pulse Dashboard
 *
 * 7-day territory activity overview:
 * - Most active species signals
 * - Wind stability score trend
 * - Top 3 stand recommendations from history
 */

import { useState, useEffect } from 'react';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Target,
    Wind,
    Crosshair,
    MapPin,
    BarChart2,
    RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeciesActivity {
    species: string;
    icon: string;
    count: number;
    trend: number; // percentage change from last week
    lastSeen: string;
}

interface WindStability {
    date: string;
    score: number;
}

interface TopStand {
    name: string;
    successRate: number;
    sessions: number;
    lastSuccess: string;
}

interface RevierPulseData {
    speciesActivity: SpeciesActivity[];
    windStability: WindStability[];
    topStands: TopStand[];
    weekComparison: {
        thisWeek: number;
        lastWeek: number;
    };
}

// ---------------------------------------------------------------------------
// Mock Data (replace with API call)
// ---------------------------------------------------------------------------

function getMockData(): RevierPulseData {
    return {
        speciesActivity: [
            { species: 'Schwarzwild', icon: '🐗', count: 12, trend: 38, lastSeen: 'Gestern 19:45' },
            { species: 'Rehwild', icon: '🦌', count: 8, trend: -5, lastSeen: 'Heute 06:30' },
            { species: 'Rotwild', icon: '🦌', count: 3, trend: 15, lastSeen: 'Vor 2 Tagen' },
            { species: 'Fuchs', icon: '🦊', count: 5, trend: 0, lastSeen: 'Gestern 22:10' },
        ],
        windStability: [
            { date: 'Mo', score: 72 },
            { date: 'Di', score: 85 },
            { date: 'Mi', score: 65 },
            { date: 'Do', score: 78 },
            { date: 'Fr', score: 82 },
            { date: 'Sa', score: 90 },
            { date: 'So', score: 75 },
        ],
        topStands: [
            { name: 'Hochsitz Eiche', successRate: 75, sessions: 8, lastSuccess: 'Vor 3 Tagen' },
            { name: 'Kanzel Waldrand', successRate: 60, sessions: 5, lastSuccess: 'Vor 1 Woche' },
            { name: 'Drückjagdstand Süd', successRate: 50, sessions: 4, lastSuccess: 'Vor 2 Wochen' },
        ],
        weekComparison: {
            thisWeek: 28,
            lastWeek: 22,
        },
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SpeciesCard({ data }: { data: SpeciesActivity }) {
    const isUp = data.trend > 0;
    const isDown = data.trend < 0;

    return (
        <div className="species-card">
            <div className="species-header">
                <span className="species-icon">{data.icon}</span>
                <span className="species-name">{data.species}</span>
            </div>
            <div className="species-stats">
                <span className="species-count">{data.count}</span>
                <span className={`species-trend ${isUp ? 'up' : isDown ? 'down' : ''}`}>
                    {isUp && <TrendingUp className="w-3 h-3" />}
                    {isDown && <TrendingDown className="w-3 h-3" />}
                    {isUp ? '+' : ''}{data.trend}%
                </span>
            </div>
            <div className="species-last">{data.lastSeen}</div>

            <style>{`
                .species-card {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 12px;
                    padding: 14px;
                    border: 1px solid var(--border-color, #333);
                }
                .species-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .species-icon {
                    font-size: 1.5rem;
                }
                .species-name {
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }
                .species-stats {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .species-count {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                }
                .species-trend {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
                }
                .species-trend.up { color: #10b981; }
                .species-trend.down { color: #ef4444; }
                .species-last {
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}

function WindChart({ data }: { data: WindStability[] }) {
    const maxScore = Math.max(...data.map(d => d.score));

    return (
        <div className="wind-chart">
            <div className="chart-header">
                <Wind className="w-4 h-4" />
                <span>Wind-Stabilität (7 Tage)</span>
            </div>
            <div className="chart-bars">
                {data.map((d, i) => (
                    <div key={i} className="bar-container">
                        <div
                            className="bar"
                            style={{
                                height: `${(d.score / maxScore) * 100}%`,
                                background: d.score >= 80 ? '#10b981' : d.score >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                        />
                        <span className="bar-label">{d.date}</span>
                    </div>
                ))}
            </div>

            <style>{`
                .wind-chart {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 12px;
                    padding: 14px;
                    border: 1px solid var(--border-color, #333);
                }
                .chart-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }
                .chart-bars {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    height: 80px;
                    gap: 8px;
                }
                .bar-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }
                .bar {
                    width: 100%;
                    border-radius: 4px 4px 0 0;
                    transition: height 0.3s ease;
                }
                .bar-label {
                    font-size: 0.65rem;
                    color: var(--text-tertiary, #666);
                    margin-top: 6px;
                }
            `}</style>
        </div>
    );
}

function StandCard({ data, rank }: { data: TopStand; rank: number }) {
    return (
        <div className="stand-card">
            <div className="stand-rank">#{rank}</div>
            <div className="stand-info">
                <div className="stand-name">
                    <MapPin className="w-4 h-4" />
                    {data.name}
                </div>
                <div className="stand-meta">
                    {data.sessions} Ansitze · {data.lastSuccess}
                </div>
            </div>
            <div className="stand-rate">
                <span className="rate-value">{data.successRate}%</span>
                <span className="rate-label">Erfolg</span>
            </div>

            <style>{`
                .stand-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 10px;
                    border: 1px solid var(--border-color, #333);
                }
                .stand-rank {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-primary, #10b981);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border-radius: 6px;
                }
                .stand-info {
                    flex: 1;
                }
                .stand-name {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 500;
                    color: var(--text-primary, #fff);
                }
                .stand-meta {
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                    margin-top: 2px;
                }
                .stand-rate {
                    text-align: right;
                }
                .rate-value {
                    display: block;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #10b981;
                }
                .rate-label {
                    font-size: 0.65rem;
                    color: var(--text-tertiary, #666);
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RevierPulse() {
    const [data, setData] = useState<RevierPulseData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 500);
    }, []);

    if (loading || !data) {
        return (
            <div className="pulse-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Revier-Daten...</span>
            </div>
        );
    }

    const weekChange = data.weekComparison.thisWeek - data.weekComparison.lastWeek;
    const weekChangePercent = Math.round((weekChange / data.weekComparison.lastWeek) * 100);

    return (
        <div className="revier-pulse">
            {/* Header */}
            <div className="pulse-header">
                <div className="header-title">
                    <Activity className="w-5 h-5" />
                    <h2>Revier Pulse</h2>
                </div>
                <div className="header-badge">
                    Letzte 7 Tage
                </div>
            </div>

            {/* Week Summary */}
            <div className="week-summary">
                <div className="summary-stat">
                    <BarChart2 className="w-5 h-5" />
                    <span className="stat-value">{data.weekComparison.thisWeek}</span>
                    <span className="stat-label">Sichtungen</span>
                </div>
                <div className={`summary-change ${weekChange >= 0 ? 'up' : 'down'}`}>
                    {weekChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {weekChange >= 0 ? '+' : ''}{weekChangePercent}% vs. letzte Woche
                </div>
            </div>

            {/* Species Activity Grid */}
            <section className="section">
                <h3 className="section-title">
                    <Crosshair className="w-4 h-4" />
                    Wildaktivität
                </h3>
                <div className="species-grid">
                    {data.speciesActivity.map((s, i) => (
                        <SpeciesCard key={i} data={s} />
                    ))}
                </div>
            </section>

            {/* Wind Stability */}
            <section className="section">
                <WindChart data={data.windStability} />
            </section>

            {/* Top Stands */}
            <section className="section">
                <h3 className="section-title">
                    <Target className="w-4 h-4" />
                    Deine Top-Ansitze
                </h3>
                <div className="stands-list">
                    {data.topStands.map((s, i) => (
                        <StandCard key={i} data={s} rank={i + 1} />
                    ))}
                </div>
            </section>

            <style>{`
                .revier-pulse {
                    padding: 16px;
                }
                .pulse-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary, #aaa);
                }
                .pulse-header {
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
                .header-badge {
                    padding: 4px 10px;
                    background: var(--color-primary, #10b981);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 500;
                    border-radius: 12px;
                }
                .week-summary {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    margin-bottom: 20px;
                }
                .summary-stat {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #10b981;
                }
                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-secondary, #aaa);
                }
                .summary-change {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                }
                .summary-change.up { color: #10b981; }
                .summary-change.down { color: #ef4444; }
                .section {
                    margin-bottom: 20px;
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
                .species-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 12px;
                }
                .stands-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            `}</style>
        </div>
    );
}
