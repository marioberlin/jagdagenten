/**
 * AggregateInsightCard Component
 *
 * Displays k-anonymized aggregate statistics.
 * Example: "+38% Schwarzwild-Sichtungen in Region NRW"
 */

import { TrendingUp, TrendingDown, Users, MapPin, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Aggregate {
    gridCell: string;
    gridCellDisplay: string;
    species: string;
    speciesLabel: string;
    timeWindow: string;
    count: number;
    trendPercentage?: number;
    contributorCount: number;
}

interface AggregateInsightCardProps {
    aggregate: Aggregate;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatTimeWindow(timeWindow: string): string {
    // Convert "2026-W05" to "KW 05, 2026"
    const match = timeWindow.match(/(\d{4})-W(\d{2})/);
    if (match) {
        return `KW ${match[2]}, ${match[1]}`;
    }
    return timeWindow;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AggregateInsightCard({ aggregate }: AggregateInsightCardProps) {
    const hasTrend = aggregate.trendPercentage !== undefined;
    const isPositive = (aggregate.trendPercentage || 0) >= 0;

    return (
        <div className="aggregate-card">
            {/* Trend indicator */}
            {hasTrend && (
                <div className={`trend-badge ${isPositive ? 'up' : 'down'}`}>
                    {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                        {isPositive ? '+' : ''}
                        {Math.round(aggregate.trendPercentage || 0)}%
                    </span>
                </div>
            )}

            {/* Content */}
            <div className="card-content">
                <h4 className="insight-title">
                    {aggregate.speciesLabel} in {aggregate.gridCellDisplay}
                </h4>

                <p className="insight-text">
                    {aggregate.count} Sichtungen in {formatTimeWindow(aggregate.timeWindow)}
                    {hasTrend && (
                        <span className={isPositive ? 'trend-up' : 'trend-down'}>
                            {' '}
                            ({isPositive ? '+' : ''}
                            {Math.round(aggregate.trendPercentage || 0)}% vs. Vorwoche)
                        </span>
                    )}
                </p>

                <div className="card-meta">
                    <div className="meta-item">
                        <MapPin className="w-3 h-3" />
                        <span>{aggregate.gridCellDisplay}</span>
                    </div>
                    <div className="meta-item">
                        <Users className="w-3 h-3" />
                        <span>{aggregate.contributorCount} Melder</span>
                    </div>
                </div>
            </div>

            {/* Privacy tooltip */}
            <div className="privacy-tooltip" title="Nur Aggregate mit ≥10 Meldern werden angezeigt (k-Anonymität)">
                <Info className="w-3 h-3" />
            </div>

            <style>{`
                .aggregate-card {
                    position: relative;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 12px;
                    padding: 14px;
                }

                .trend-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .trend-badge.up {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }

                .trend-badge.down {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .card-content {
                    padding-right: 60px;
                }

                .insight-title {
                    margin: 0 0 6px;
                    font-size: 1rem;
                    color: var(--text-primary);
                }

                .insight-text {
                    margin: 0 0 10px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .trend-up {
                    color: #10b981;
                }

                .trend-down {
                    color: #ef4444;
                }

                .card-meta {
                    display: flex;
                    gap: 16px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .privacy-tooltip {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    color: var(--text-tertiary);
                    cursor: help;
                }
            `}</style>
        </div>
    );
}
