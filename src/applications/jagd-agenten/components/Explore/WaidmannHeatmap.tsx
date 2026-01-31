/**
 * Waidmann Heatmap Dashboard
 *
 * Standalone fullscreen heatmap showing:
 * - Anonymous movement & sighting intensity by grid
 * - Always delayed + k-anonymized
 * - Species and time range filters
 */

import { useState, useEffect } from 'react';
import {
    Map,
    Filter,
    Calendar,
    Eye,
    ChevronDown,
    RefreshCw,
    Shield,
    Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeatmapCell {
    gridCell: string;
    lat: number;
    lng: number;
    intensity: number; // 0-100
    species: string[];
    contributorCount: number;
    lastActivity: string;
}

interface HeatmapData {
    cells: HeatmapCell[];
    totalContributors: number;
    lastUpdated: string;
    timeRange: string;
}

type TimeRange = '7d' | '30d' | '90d';
type SpeciesFilter = 'all' | 'schwarzwild' | 'rehwild' | 'rotwild' | 'wolf';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockHeatmapData(): HeatmapData {
    const cells: HeatmapCell[] = [
        { gridCell: 'DE-NW-5234', lat: 51.9, lng: 7.6, intensity: 85, species: ['Schwarzwild', 'Rehwild'], contributorCount: 15, lastActivity: '2h ago' },
        { gridCell: 'DE-NW-5235', lat: 51.85, lng: 7.65, intensity: 60, species: ['Rehwild'], contributorCount: 12, lastActivity: '6h ago' },
        { gridCell: 'DE-NW-5233', lat: 51.95, lng: 7.55, intensity: 40, species: ['Schwarzwild'], contributorCount: 10, lastActivity: '1d ago' },
        { gridCell: 'DE-NI-4122', lat: 52.1, lng: 7.8, intensity: 75, species: ['Rotwild', 'Schwarzwild'], contributorCount: 18, lastActivity: '4h ago' },
        { gridCell: 'DE-NI-4123', lat: 52.05, lng: 7.85, intensity: 30, species: ['Rehwild'], contributorCount: 11, lastActivity: '2d ago' },
    ];

    return {
        cells,
        totalContributors: 45,
        lastUpdated: new Date().toISOString(),
        timeRange: '7d',
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterBar({
    timeRange,
    species,
    onTimeChange,
    onSpeciesChange,
}: {
    timeRange: TimeRange;
    species: SpeciesFilter;
    onTimeChange: (t: TimeRange) => void;
    onSpeciesChange: (s: SpeciesFilter) => void;
}) {
    return (
        <div className="filter-bar">
            <div className="filter-group">
                <Calendar className="w-4 h-4" />
                <select
                    value={timeRange}
                    onChange={(e) => onTimeChange(e.target.value as TimeRange)}
                >
                    <option value="7d">Letzte 7 Tage</option>
                    <option value="30d">Letzte 30 Tage</option>
                    <option value="90d">Letzte 90 Tage</option>
                </select>
                <ChevronDown className="w-3 h-3 chevron" />
            </div>

            <div className="filter-group">
                <Filter className="w-4 h-4" />
                <select
                    value={species}
                    onChange={(e) => onSpeciesChange(e.target.value as SpeciesFilter)}
                >
                    <option value="all">Alle Wildarten</option>
                    <option value="schwarzwild">Schwarzwild</option>
                    <option value="rehwild">Rehwild</option>
                    <option value="rotwild">Rotwild</option>
                    <option value="wolf">Wolf</option>
                </select>
                <ChevronDown className="w-3 h-3 chevron" />
            </div>

            <style>{`
                .filter-bar {
                    display: flex;
                    gap: 12px;
                    padding: 12px 16px;
                    background: var(--glass-bg-regular);
                    border-bottom: 1px solid var(--glass-border);
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--glass-surface);
                    border-radius: 8px;
                    color: var(--text-primary);
                    position: relative;
                }
                .filter-group select {
                    background: transparent;
                    border: none;
                    color: inherit;
                    font-size: 0.85rem;
                    cursor: pointer;
                    appearance: none;
                    padding-right: 16px;
                }
                .filter-group .chevron {
                    position: absolute;
                    right: 10px;
                    pointer-events: none;
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}

function HeatmapLegend() {
    return (
        <div className="heatmap-legend">
            <span className="legend-label">Aktivität:</span>
            <div className="legend-gradient" />
            <span className="legend-low">Niedrig</span>
            <span className="legend-high">Hoch</span>

            <style>{`
                .heatmap-legend {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(0,0,0,0.6);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: white;
                }
                .legend-gradient {
                    width: 80px;
                    height: 8px;
                    background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);
                    border-radius: 4px;
                }
                .legend-low { color: #10b981; }
                .legend-high { color: #ef4444; }
            `}</style>
        </div>
    );
}

function GridCellPopup({ cell }: { cell: HeatmapCell }) {
    return (
        <div className="cell-popup">
            <div className="popup-header">
                <Map className="w-4 h-4" />
                <span>{cell.gridCell}</span>
            </div>
            <div className="popup-intensity">
                <div
                    className="intensity-bar"
                    style={{ width: `${cell.intensity}%` }}
                />
                <span>{cell.intensity}% Aktivität</span>
            </div>
            <div className="popup-species">
                {cell.species.map((s, i) => (
                    <span key={i} className="species-tag">{s}</span>
                ))}
            </div>
            <div className="popup-meta">
                <Eye className="w-3 h-3" />
                {cell.contributorCount} Beobachter · {cell.lastActivity}
            </div>

            <style>{`
                .cell-popup {
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    padding: 12px;
                    min-width: 200px;
                }
                .popup-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 10px;
                }
                .popup-intensity {
                    position: relative;
                    height: 6px;
                    background: var(--glass-surface);
                    border-radius: 3px;
                    margin-bottom: 10px;
                    overflow: hidden;
                }
                .intensity-bar {
                    height: 100%;
                    background: linear-gradient(to right, #10b981, #f59e0b);
                    border-radius: 3px;
                }
                .popup-intensity span {
                    position: absolute;
                    right: 0;
                    top: 10px;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }
                .popup-species {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 10px;
                }
                .species-tag {
                    padding: 2px 8px;
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border-radius: 10px;
                    font-size: 0.7rem;
                }
                .popup-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}

function PrivacyBadge() {
    return (
        <div className="privacy-badge">
            <Shield className="w-4 h-4" />
            <span>k-anonymisiert (≥10 Beobachter)</span>
            <button className="info-btn">
                <Info className="w-3 h-3" />
            </button>

            <style>{`
                .privacy-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    color: #3b82f6;
                    font-size: 0.75rem;
                }
                .info-btn {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 2px;
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WaidmannHeatmap() {
    const [data, setData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [species, setSpecies] = useState<SpeciesFilter>('all');
    const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setData(getMockHeatmapData());
            setLoading(false);
        }, 500);
    }, [timeRange, species]);

    if (loading || !data) {
        return (
            <div className="heatmap-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Heatmap-Daten...</span>
            </div>
        );
    }

    return (
        <div className="waidmann-heatmap">
            <FilterBar
                timeRange={timeRange}
                species={species}
                onTimeChange={setTimeRange}
                onSpeciesChange={setSpecies}
            />

            {/* Map Placeholder */}
            <div className="heatmap-container">
                <div className="map-placeholder">
                    <Map className="w-12 h-12" />
                    <p>Interaktive Karte mit Heatmap-Layer</p>
                    <p className="hint">Integration mit bestehendem HeatmapLayer.tsx</p>
                </div>

                {/* Grid cells as list for now */}
                <div className="cells-list">
                    {data.cells.map((cell) => (
                        <button
                            key={cell.gridCell}
                            className={`cell-btn ${selectedCell?.gridCell === cell.gridCell ? 'active' : ''}`}
                            onClick={() => setSelectedCell(cell)}
                        >
                            <span className="cell-id">{cell.gridCell}</span>
                            <span
                                className="cell-intensity"
                                style={{
                                    background: cell.intensity > 70 ? '#ef4444' : cell.intensity > 40 ? '#f59e0b' : '#10b981',
                                }}
                            >
                                {cell.intensity}%
                            </span>
                        </button>
                    ))}
                </div>

                {selectedCell && (
                    <div className="popup-container">
                        <GridCellPopup cell={selectedCell} />
                    </div>
                )}

                {/* Overlays */}
                <div className="map-overlays">
                    <HeatmapLegend />
                    <PrivacyBadge />
                </div>
            </div>

            {/* Stats Footer */}
            <div className="heatmap-footer">
                <span>{data.totalContributors} Beobachter insgesamt</span>
                <span>·</span>
                <span>Aktualisiert: {new Date(data.lastUpdated).toLocaleTimeString('de-DE')}</span>
            </div>

            <style>{`
                .waidmann-heatmap {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .heatmap-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    height: 300px;
                    color: var(--text-secondary);
                }
                .heatmap-container {
                    flex: 1;
                    position: relative;
                    min-height: 400px;
                    background: var(--glass-surface);
                }
                .map-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary);
                    gap: 12px;
                }
                .map-placeholder .hint {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .cells-list {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .cell-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 8px 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .cell-btn:hover, .cell-btn.active {
                    border-color: #10b981;
                }
                .cell-intensity {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: white;
                }
                .popup-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                .map-overlays {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    right: 16px;
                    display: flex;
                    justify-content: space-between;
                }
                .heatmap-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    background: var(--glass-bg-regular);
                    border-top: 1px solid var(--glass-border);
                }
            `}</style>
        </div>
    );
}
