/**
 * Wolf & Predator Watch Dashboard
 *
 * Two-lane display:
 * - Official DBBW/BfN verified wolf updates
 * - Community unconfirmed sightings (clearly separated)
 */

import { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    MapPin,
    Calendar,
    ExternalLink,
    Eye,
    Clock,
    ChevronRight,
    RefreshCw,
    Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfficialSighting {
    id: string;
    territory: string;
    bundesland: string;
    status: 'confirmed' | 'probable';
    date: string;
    evidenceType: 'photo' | 'dna' | 'track' | 'carcass';
    description: string;
    sourceUrl: string;
}

interface CommunitySighting {
    id: string;
    gridCell: string;
    confidence: 1 | 2 | 3 | 4 | 5;
    date: string;
    description?: string;
    hasPhoto: boolean;
    contributorCount: number;
}

interface WolfWatchData {
    officialSightings: OfficialSighting[];
    communitySightings: CommunitySighting[];
    activeTerritoriesCount: number;
    lastOfficialUpdate: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockData(): WolfWatchData {
    return {
        officialSightings: [
            {
                id: '1',
                territory: 'Schermbeck',
                bundesland: 'Nordrhein-Westfalen',
                status: 'confirmed',
                date: '2026-01-28',
                evidenceType: 'photo',
                description: 'Wolfspaar mit 5 Welpen bestätigt. Territorium aktiv.',
                sourceUrl: 'https://www.dbb-wolf.de/wolfsvorkommen/territorien/karte',
            },
            {
                id: '2',
                territory: 'Döberitzer Heide',
                bundesland: 'Brandenburg',
                status: 'confirmed',
                date: '2026-01-25',
                evidenceType: 'dna',
                description: 'DNA-Nachweis eines neuen Rüden im Territorium.',
                sourceUrl: 'https://www.dbb-wolf.de/wolfsvorkommen/territorien/karte',
            },
            {
                id: '3',
                territory: 'Lübtheen',
                bundesland: 'Mecklenburg-Vorpommern',
                status: 'probable',
                date: '2026-01-20',
                evidenceType: 'track',
                description: 'Spuren eines Einzelwolfs dokumentiert.',
                sourceUrl: 'https://www.dbb-wolf.de/wolfsvorkommen/territorien/karte',
            },
        ],
        communitySightings: [
            {
                id: 'c1',
                gridCell: 'DE-NW-5234',
                confidence: 3,
                date: '2026-01-29',
                description: 'Mögliche Wolfssichtung am Waldrand, Abenddämmerung',
                hasPhoto: true,
                contributorCount: 12,
            },
            {
                id: 'c2',
                gridCell: 'DE-NI-4122',
                confidence: 2,
                date: '2026-01-27',
                description: 'Geheul gehört, keine Sichtbestätigung',
                hasPhoto: false,
                contributorCount: 8,
            },
        ],
        activeTerritoriesCount: 184,
        lastOfficialUpdate: '2026-01-28T14:30:00Z',
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OfficialCard({ sighting }: { sighting: OfficialSighting }) {
    const evidenceLabels: Record<string, string> = {
        photo: 'Foto',
        dna: 'DNA',
        track: 'Spuren',
        carcass: 'Riss',
    };

    return (
        <div className="official-card">
            <div className="card-header">
                <div className="status-badge confirmed">
                    <Shield className="w-3 h-3" />
                    {sighting.status === 'confirmed' ? 'Bestätigt' : 'Wahrscheinlich'}
                </div>
                <span className="evidence-badge">{evidenceLabels[sighting.evidenceType]}</span>
            </div>

            <h4 className="territory-name">{sighting.territory}</h4>
            <p className="bundesland">{sighting.bundesland}</p>

            <p className="description">{sighting.description}</p>

            <div className="card-footer">
                <span className="date">
                    <Calendar className="w-3 h-3" />
                    {new Date(sighting.date).toLocaleDateString('de-DE')}
                </span>
                <a href={sighting.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                    DBBW <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            <style>{`
                .official-card {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-left: 3px solid #3b82f6;
                    border-radius: 10px;
                    padding: 14px;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }
                .status-badge.confirmed {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                }
                .evidence-badge {
                    padding: 2px 8px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 8px;
                    font-size: 0.65rem;
                    color: var(--text-secondary, #aaa);
                }
                .territory-name {
                    margin: 0 0 4px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary, #fff);
                }
                .bundesland {
                    margin: 0 0 10px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                }
                .description {
                    margin: 0 0 12px;
                    font-size: 0.85rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.4;
                }
                .card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }
                .source-link {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: #3b82f6;
                    text-decoration: none;
                }
                .source-link:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

function CommunityCard({ sighting }: { sighting: CommunitySighting }) {
    const confidenceLabels = ['', 'Sehr unsicher', 'Unsicher', 'Möglich', 'Wahrscheinlich', 'Sicher'];

    return (
        <div className="community-card">
            <div className="card-header">
                <div className="status-badge unconfirmed">
                    <AlertTriangle className="w-3 h-3" />
                    Unbestätigt
                </div>
                <span className="confidence">
                    {confidenceLabels[sighting.confidence]}
                </span>
            </div>

            <div className="grid-location">
                <MapPin className="w-4 h-4" />
                <span>{sighting.gridCell}</span>
            </div>

            {sighting.description && (
                <p className="description">{sighting.description}</p>
            )}

            <div className="card-footer">
                <span className="date">
                    <Clock className="w-3 h-3" />
                    {new Date(sighting.date).toLocaleDateString('de-DE')}
                </span>
                <span className="contributors">
                    <Eye className="w-3 h-3" />
                    {sighting.contributorCount} Beobachter
                </span>
            </div>

            <style>{`
                .community-card {
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-left: 3px solid #f59e0b;
                    border-radius: 10px;
                    padding: 14px;
                }
                .status-badge.unconfirmed {
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                }
                .confidence {
                    font-size: 0.7rem;
                    color: var(--text-secondary, #aaa);
                }
                .grid-location {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-primary, #fff);
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                .contributors {
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WolfWatch() {
    const [data, setData] = useState<WolfWatchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLane, setActiveLane] = useState<'official' | 'community'>('official');

    useEffect(() => {
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 500);
    }, []);

    if (loading || !data) {
        return (
            <div className="wolf-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Wolf-Monitoring...</span>
            </div>
        );
    }

    return (
        <div className="wolf-watch">
            {/* Header */}
            <div className="wolf-header">
                <div className="header-title">
                    <Shield className="w-5 h-5" />
                    <h2>Wolf & Predator Watch</h2>
                </div>
                <div className="territory-count">
                    {data.activeTerritoriesCount} aktive Territorien
                </div>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
                <Info className="w-4 h-4" />
                <span>
                    Offizielle Daten via DBBW (Dokumentations- und Beratungsstelle des Bundes zum Wolf).
                    Community-Sichtungen sind unbestätigt.
                </span>
            </div>

            {/* Lane Tabs */}
            <div className="lane-tabs">
                <button
                    className={`lane-tab ${activeLane === 'official' ? 'active official' : ''}`}
                    onClick={() => setActiveLane('official')}
                >
                    <Shield className="w-4 h-4" />
                    Offiziell ({data.officialSightings.length})
                </button>
                <button
                    className={`lane-tab ${activeLane === 'community' ? 'active community' : ''}`}
                    onClick={() => setActiveLane('community')}
                >
                    <Eye className="w-4 h-4" />
                    Community ({data.communitySightings.length})
                </button>
            </div>

            {/* Content */}
            <div className="sightings-list">
                {activeLane === 'official' ? (
                    data.officialSightings.map((s) => (
                        <OfficialCard key={s.id} sighting={s} />
                    ))
                ) : (
                    data.communitySightings.map((s) => (
                        <CommunityCard key={s.id} sighting={s} />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="wolf-footer">
                <span>Letzte Aktualisierung: {new Date(data.lastOfficialUpdate).toLocaleString('de-DE')}</span>
                <a href="https://www.dbb-wolf.de" target="_blank" rel="noopener noreferrer">
                    Zur DBBW <ChevronRight className="w-3 h-3" />
                </a>
            </div>

            <style>{`
                .wolf-watch {
                    padding: 16px;
                }
                .wolf-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary, #aaa);
                }
                .wolf-header {
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
                .territory-count {
                    font-size: 0.8rem;
                    color: #3b82f6;
                }
                .info-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 10px;
                    margin-bottom: 16px;
                    font-size: 0.8rem;
                    color: #3b82f6;
                }
                .lane-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .lane-tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 10px;
                    color: var(--text-secondary, #aaa);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .lane-tab:hover {
                    border-color: var(--text-tertiary, #666);
                }
                .lane-tab.active.official {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: #3b82f6;
                    color: #3b82f6;
                }
                .lane-tab.active.community {
                    background: rgba(245, 158, 11, 0.1);
                    border-color: #f59e0b;
                    color: #f59e0b;
                }
                .sightings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .wolf-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                }
                .wolf-footer a {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #3b82f6;
                    text-decoration: none;
                }
                .wolf-footer a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
