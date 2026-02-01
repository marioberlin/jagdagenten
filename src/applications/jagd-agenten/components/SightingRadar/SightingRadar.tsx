/**
 * SightingRadar Component
 *
 * Main container for the community sighting feed.
 * Features:
 * - View published sightings with privacy blur
 * - Create new sightings
 * - View k-anonymized aggregates/trends
 * - Filter by species, region
 */

import { useEffect, useState } from 'react';
import {
    Eye,
    Plus,
    Filter,
    Shield,
    AlertTriangle,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import SightingCard from './SightingCard';
import SightingForm from './SightingForm';
import AggregateInsightCard from './AggregateInsightCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Sighting {
    id: string;
    species: string;
    speciesLabel: string;
    speciesIcon: string;
    confidence: number;
    description?: string;
    photoUrls?: string[];
    gridCell: string;
    gridCellDisplay: string;
    gridCellCenter: [number, number];
    bundesland?: string;
    publishedAt: string;
    badge: 'community' | 'dbbw' | 'bfn' | 'agent';
}

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

interface SightingRadarProps {
    userId?: string;
    bundesland?: string;
    showCreateButton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SightingRadar({
    userId,
    bundesland,
    showCreateButton = true,
}: SightingRadarProps) {
    // State
    const [sightings, setSightings] = useState<Sighting[]>([]);
    const [aggregates, setAggregates] = useState<Aggregate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'sightings' | 'trends'>('sightings');
    const [filter, setFilter] = useState({
        species: '',
        bundesland: bundesland || '',
    });

    // Fetch sightings
    const fetchSightings = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filter.species) params.set('species', filter.species);
            if (filter.bundesland) params.set('bundesland', filter.bundesland);

            const res = await fetch(`/api/v1/jagd/sightings?${params}`);
            const data = await res.json();

            if (data.success) {
                setSightings(data.sightings);
            } else {
                setError(data.error || 'Fehler beim Laden');
            }
        } catch (_err) {
            setError('Verbindungsfehler');
        } finally {
            setLoading(false);
        }
    };

    // Fetch aggregates
    const fetchAggregates = async () => {
        try {
            const res = await fetch('/api/v1/jagd/sightings/aggregates');
            const data = await res.json();

            if (data.success) {
                setAggregates(data.aggregates);
            }
        } catch (_err) {
            console.error('Failed to fetch aggregates');
        }
    };

    // Initial load
    useEffect(() => {
        fetchSightings();
        fetchAggregates();
    }, [filter.species, filter.bundesland]);

    // Handle new sighting created
    const handleSightingCreated = () => {
        setShowForm(false);
        fetchSightings();
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="sighting-radar">
            {/* Header */}
            <div className="radar-header">
                <div className="header-title">
                    <Eye className="w-5 h-5 text-green-500" />
                    <h2>Sichtungsradar</h2>
                </div>

                <div className="header-actions">
                    <button
                        onClick={() => {
                            fetchSightings();
                            fetchAggregates();
                        }}
                        className="refresh-btn"
                        title="Aktualisieren"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {showCreateButton && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="create-btn"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Sichtung melden</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Privacy Notice */}
            <div className="privacy-notice">
                <Shield className="w-4 h-4" />
                <span>
                    Standorte werden auf 5km-Raster unscharf gemacht. Veröffentlichung nach 24-72h Verzögerung.
                </span>
            </div>

            {/* Tabs */}
            <div className="radar-tabs">
                <button
                    className={`tab ${activeTab === 'sightings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sightings')}
                >
                    <Eye className="w-4 h-4" />
                    Sichtungen
                </button>
                <button
                    className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trends')}
                >
                    <TrendingUp className="w-4 h-4" />
                    Trends
                </button>
            </div>

            {/* Filters */}
            <div className="radar-filters">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={filter.species}
                    onChange={(e) => setFilter({ ...filter, species: e.target.value })}
                >
                    <option value="">Alle Arten</option>
                    <option value="wolf">🐺 Wolf</option>
                    <option value="schwarzwild">🐗 Schwarzwild</option>
                    <option value="rotwild">🦌 Rotwild</option>
                    <option value="rehwild">🦌 Rehwild</option>
                    <option value="luchs">🐱 Luchs</option>
                    <option value="krankes_wild">⚠️ Krankes Wild</option>
                </select>

                <select
                    value={filter.bundesland}
                    onChange={(e) => setFilter({ ...filter, bundesland: e.target.value })}
                >
                    <option value="">Alle Bundesländer</option>
                    <option value="Bayern">Bayern</option>
                    <option value="Baden-Württemberg">Baden-Württemberg</option>
                    <option value="Nordrhein-Westfalen">NRW</option>
                    <option value="Niedersachsen">Niedersachsen</option>
                    <option value="Brandenburg">Brandenburg</option>
                    <option value="Hessen">Hessen</option>
                </select>
            </div>

            {/* Content */}
            <div className="radar-content">
                {loading ? (
                    <div className="loading-state">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span>Lade Sichtungen...</span>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <span>{error}</span>
                    </div>
                ) : activeTab === 'sightings' ? (
                    <div className="sightings-list">
                        {sightings.length === 0 ? (
                            <div className="empty-state">
                                <Eye className="w-8 h-8 text-gray-400" />
                                <p>Keine Sichtungen in dieser Region</p>
                                <button onClick={() => setShowForm(true)} className="cta-btn">
                                    Erste Sichtung melden
                                </button>
                            </div>
                        ) : (
                            sightings.map((sighting) => (
                                <SightingCard key={sighting.id} sighting={sighting} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="trends-list">
                        {aggregates.length === 0 ? (
                            <div className="empty-state">
                                <TrendingUp className="w-8 h-8 text-gray-400" />
                                <p>Noch nicht genug Daten für Trends</p>
                                <span className="text-sm text-gray-500">
                                    Mindestens 10 Melder pro Region nötig
                                </span>
                            </div>
                        ) : (
                            aggregates.map((agg, i) => (
                                <AggregateInsightCard key={i} aggregate={agg} />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create sighting modal */}
            {showForm && (
                <SightingForm
                    userId={userId}
                    onClose={() => setShowForm(false)}
                    onCreated={handleSightingCreated}
                />
            )}

            <style>{`
                .sighting-radar {
                    background: var(--glass-bg-regular);
                    border-radius: 12px;
                    padding: 16px;
                }

                .radar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .header-title h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--text-primary);
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .refresh-btn,
                .create-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .refresh-btn {
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                }

                .create-btn {
                    background: var(--glass-accent, #10b981);
                    color: white;
                }

                .privacy-notice {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: var(--glass-accent, #10b981);
                    margin-bottom: 12px;
                }

                .radar-tabs {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 12px;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border: none;
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }

                .tab.active {
                    background: var(--glass-accent, #10b981);
                    color: white;
                }

                .radar-filters {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .radar-filters select {
                    padding: 6px 10px;
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-size: 0.875rem;
                }

                .radar-content {
                    min-height: 200px;
                }

                .sightings-list,
                .trends-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .loading-state,
                .error-state,
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 32px;
                    color: var(--text-secondary);
                }

                .cta-btn {
                    margin-top: 8px;
                    padding: 8px 16px;
                    background: var(--glass-accent, #10b981);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
