/**
 * TrendCard Component
 *
 * Displays regional wildlife trends and hotspots.
 */

import { TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendData {
    id: string;
    type: 'species' | 'region' | 'topic';
    label: string;
    currentCount: number;
    changePercent: number;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    timeWindow: string;
    gridCell?: string;
    bundesland?: string;
    isUnusual?: boolean;
}

interface TrendCardProps {
    trend: TrendData;
    onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPECIES_ICONS: Record<string, string> = {
    schwarzwild: '🐗',
    rotwild: '🦌',
    rehwild: '🦌',
    wolf: '🐺',
    luchs: '🐱',
};

function getTrendIcon(direction: 'up' | 'down' | 'stable') {
    switch (direction) {
        case 'up': return <TrendingUp className="w-4 h-4" />;
        case 'down': return <TrendingDown className="w-4 h-4" />;
        default: return <Minus className="w-4 h-4" />;
    }
}

function getTrendColor(direction: 'up' | 'down' | 'stable', isUnusual?: boolean): string {
    if (isUnusual) return '#f59e0b';
    switch (direction) {
        case 'up': return '#10b981';
        case 'down': return '#ef4444';
        default: return '#6b7280';
    }
}

function getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'Hoch';
    if (confidence >= 0.6) return 'Mittel';
    return 'Gering';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrendCard({ trend, onClick }: TrendCardProps) {
    const trendColor = getTrendColor(trend.direction, trend.isUnusual);
    const speciesIcon = trend.type === 'species' ? SPECIES_ICONS[trend.label.toLowerCase()] : undefined;

    return (
        <div
            className="trend-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {/* Header */}
            <div className="trend-header">
                <div className="trend-label">
                    {speciesIcon && <span className="species-emoji">{speciesIcon}</span>}
                    <span>{trend.label}</span>
                </div>

                <div
                    className="trend-indicator"
                    style={{ color: trendColor, background: `${trendColor}15` }}
                >
                    {getTrendIcon(trend.direction)}
                    <span>
                        {trend.direction !== 'stable' && (trend.changePercent > 0 ? '+' : '')}
                        {trend.changePercent}%
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="trend-stats">
                <div className="stat">
                    <span className="stat-value">{trend.currentCount}</span>
                    <span className="stat-label">Meldungen</span>
                </div>

                <div className="stat">
                    <span className="stat-value">{trend.timeWindow}</span>
                    <span className="stat-label">Zeitraum</span>
                </div>

                <div className="stat">
                    <span className="stat-value">{getConfidenceLabel(trend.confidence)}</span>
                    <span className="stat-label">Konfidenz</span>
                </div>
            </div>

            {/* Location */}
            {(trend.bundesland || trend.gridCell) && (
                <div className="trend-location">
                    <MapPin className="w-3 h-3" />
                    <span>{trend.bundesland || trend.gridCell}</span>
                </div>
            )}

            {/* Unusual alert */}
            {trend.isUnusual && (
                <div className="unusual-alert">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Ungewöhnliche Aktivität</span>
                </div>
            )}

            {/* Info footer */}
            <div className="trend-footer">
                <Info className="w-3 h-3" />
                <span>Basierend auf k-anonymisierten Daten</span>
            </div>

            <style>{`
                .trend-card {
                    background: var(--glass-surface);
                    border-radius: 12px;
                    padding: 14px;
                    transition: transform 0.2s;
                }

                .trend-card:hover {
                    transform: translateY(-2px);
                }

                .trend-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .trend-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .species-emoji {
                    font-size: 1.2rem;
                }

                .trend-indicator {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .trend-stats {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 10px;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .stat-value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .stat-label {
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }

                .trend-location {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }

                .unusual-alert {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 6px;
                    color: #f59e0b;
                    font-size: 0.75rem;
                    margin-bottom: 8px;
                }

                .trend-footer {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}

export type { TrendData };
