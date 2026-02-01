/**
 * Season & Rules Dashboard
 *
 * - What opens/closes soon (by Bundesland)
 * - Season timeline visual
 * - Admin deadlines (Streckenliste due dates)
 */

import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle,
    ChevronDown,
    RefreshCw,
    FileText,
    MapPin,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeasonEntry {
    species: string;
    icon: string;
    startDate: string; // MM-DD
    endDate: string;
    status: 'open' | 'closed' | 'opening_soon' | 'closing_soon';
    daysUntilChange: number;
}

interface AdminDeadline {
    id: string;
    title: string;
    dueDate: string;
    type: 'streckenliste' | 'report' | 'renewal';
    completed: boolean;
}

interface SeasonRulesData {
    bundesland: string;
    seasons: SeasonEntry[];
    deadlines: AdminDeadline[];
    lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Season Data (Sample for Bayern)
// ---------------------------------------------------------------------------

const BUNDESLAENDER = [
    'Bayern', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Niedersachsen',
    'Hessen', 'Brandenburg', 'Sachsen', 'Thüringen', 'Rheinland-Pfalz',
    'Schleswig-Holstein', 'Mecklenburg-Vorpommern', 'Sachsen-Anhalt',
    'Saarland', 'Berlin', 'Hamburg', 'Bremen',
];

function getMockData(bundesland: string): SeasonRulesData {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;

    const seasons: SeasonEntry[] = [
        {
            species: 'Rehbock',
            icon: '🦌',
            startDate: '05-01',
            endDate: '10-15',
            status: currentMonth >= 5 && currentMonth <= 10 ? 'open' : 'closed',
            daysUntilChange: 45,
        },
        {
            species: 'Rothirsch',
            icon: '🦌',
            startDate: '08-01',
            endDate: '01-31',
            status: 'closing_soon',
            daysUntilChange: 2,
        },
        {
            species: 'Schwarzwild',
            icon: '🐗',
            startDate: '01-01',
            endDate: '12-31',
            status: 'open',
            daysUntilChange: 335,
        },
        {
            species: 'Fuchs',
            icon: '🦊',
            startDate: '07-15',
            endDate: '02-28',
            status: 'closing_soon',
            daysUntilChange: 28,
        },
        {
            species: 'Dachs',
            icon: '🦡',
            startDate: '08-01',
            endDate: '10-31',
            status: 'closed',
            daysUntilChange: 180,
        },
        {
            species: 'Feldhase',
            icon: '🐰',
            startDate: '10-01',
            endDate: '01-15',
            status: 'closed',
            daysUntilChange: 14,
        },
    ];

    const deadlines: AdminDeadline[] = [
        {
            id: '1',
            title: 'Monatliche Strecke melden',
            dueDate: '2026-02-05',
            type: 'streckenliste',
            completed: false,
        },
        {
            id: '2',
            title: 'Jahresstrecke 2025 einreichen',
            dueDate: '2026-02-15',
            type: 'streckenliste',
            completed: false,
        },
        {
            id: '3',
            title: 'Jagdpachtvertrag verlängern',
            dueDate: '2026-03-31',
            type: 'renewal',
            completed: false,
        },
    ];

    return {
        bundesland,
        seasons,
        deadlines,
        lastUpdated: new Date().toISOString(),
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeasonCard({ entry }: { entry: SeasonEntry }) {
    const statusConfig = {
        open: { label: 'Offen', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        closed: { label: 'Geschlossen', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        opening_soon: { label: 'Öffnet bald', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        closing_soon: { label: 'Schließt bald', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    };

    const config = statusConfig[entry.status];

    return (
        <div className="season-card" style={{ borderLeftColor: config.color }}>
            <div className="season-icon">{entry.icon}</div>
            <div className="season-info">
                <div className="species-name">{entry.species}</div>
                <div className="season-dates">
                    {entry.startDate.replace('-', '.')} – {entry.endDate.replace('-', '.')}
                </div>
            </div>
            <div className="season-status">
                <span
                    className="status-badge"
                    style={{ background: config.bg, color: config.color }}
                >
                    {config.label}
                </span>
                {entry.status !== 'closed' && entry.status !== 'open' && (
                    <span className="days-until">
                        {entry.daysUntilChange} Tage
                    </span>
                )}
            </div>

            <style>{`
                .season-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-left: 3px solid;
                    border-radius: 10px;
                }
                .season-icon {
                    font-size: 1.5rem;
                }
                .season-info {
                    flex: 1;
                }
                .species-name {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .season-dates {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .season-status {
                    text-align: right;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }
                .days-until {
                    display: block;
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }
            `}</style>
        </div>
    );
}

function DeadlineCard({ deadline }: { deadline: AdminDeadline }) {
    const dueDate = new Date(deadline.dueDate);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysLeft <= 7;

    return (
        <div className={`deadline-card ${isUrgent ? 'urgent' : ''} ${deadline.completed ? 'completed' : ''}`}>
            <div className="deadline-icon">
                {deadline.completed ? (
                    <CheckCircle className="w-5 h-5" />
                ) : (
                    <FileText className="w-5 h-5" />
                )}
            </div>
            <div className="deadline-info">
                <div className="deadline-title">{deadline.title}</div>
                <div className="deadline-due">
                    <Calendar className="w-3 h-3" />
                    Fällig: {dueDate.toLocaleDateString('de-DE')}
                </div>
            </div>
            {!deadline.completed && (
                <div className="days-left">
                    {daysLeft} Tage
                </div>
            )}

            <style>{`
                .deadline-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                }
                .deadline-card.urgent {
                    border-color: rgba(239, 68, 68, 0.5);
                    background: rgba(239, 68, 68, 0.05);
                }
                .deadline-card.completed {
                    opacity: 0.6;
                }
                .deadline-icon {
                    color: var(--text-secondary);
                }
                .deadline-card.urgent .deadline-icon {
                    color: #ef4444;
                }
                .deadline-card.completed .deadline-icon {
                    color: #10b981;
                }
                .deadline-info {
                    flex: 1;
                }
                .deadline-title {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .deadline-due {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .days-left {
                    padding: 4px 10px;
                    background: var(--glass-surface);
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                .deadline-card.urgent .days-left {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SeasonRules() {
    const [data, setData] = useState<SeasonRulesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [bundesland, setBundesland] = useState('Bayern');

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setData(getMockData(bundesland));
            setLoading(false);
        }, 300);
    }, [bundesland]);

    if (loading || !data) {
        return (
            <div className="season-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Jagdzeiten...</span>
            </div>
        );
    }

    const openSeasons = data.seasons.filter(s => s.status === 'open' || s.status === 'closing_soon');
    const closedSeasons = data.seasons.filter(s => s.status === 'closed' || s.status === 'opening_soon');
    const pendingDeadlines = data.deadlines.filter(d => !d.completed);

    return (
        <div className="season-rules">
            {/* Header */}
            <div className="season-header">
                <div className="header-title">
                    <Calendar className="w-5 h-5" />
                    <h2>Saison & Regeln</h2>
                </div>
                <div className="region-select">
                    <MapPin className="w-4 h-4" />
                    <select value={bundesland} onChange={(e) => setBundesland(e.target.value)}>
                        {BUNDESLAENDER.map(land => (
                            <option key={land} value={land}>{land}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3" />
                </div>
            </div>

            {/* Open Seasons */}
            <section className="section">
                <h3 className="section-title">
                    <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                    Aktuell offen ({openSeasons.length})
                </h3>
                <div className="seasons-list">
                    {openSeasons.map((s, i) => (
                        <SeasonCard key={i} entry={s} />
                    ))}
                </div>
            </section>

            {/* Closed Seasons */}
            <section className="section">
                <h3 className="section-title">
                    <Clock className="w-4 h-4" style={{ color: '#ef4444' }} />
                    Geschlossen ({closedSeasons.length})
                </h3>
                <div className="seasons-list">
                    {closedSeasons.map((s, i) => (
                        <SeasonCard key={i} entry={s} />
                    ))}
                </div>
            </section>

            {/* Admin Deadlines */}
            {pendingDeadlines.length > 0 && (
                <section className="section">
                    <h3 className="section-title">
                        <AlertCircle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        Anstehende Fristen ({pendingDeadlines.length})
                    </h3>
                    <div className="deadlines-list">
                        {pendingDeadlines.map((d) => (
                            <DeadlineCard key={d.id} deadline={d} />
                        ))}
                    </div>
                </section>
            )}

            <style>{`
                .season-rules {
                    padding: 16px;
                }
                .season-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary);
                }
                .season-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-title h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .region-select {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    position: relative;
                }
                .region-select select {
                    background: transparent;
                    border: none;
                    color: inherit;
                    font-size: 0.85rem;
                    cursor: pointer;
                    appearance: none;
                    padding-right: 16px;
                }
                .section {
                    margin-bottom: 24px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin: 0 0 12px;
                }
                .seasons-list, .deadlines-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            `}</style>
        </div>
    );
}
