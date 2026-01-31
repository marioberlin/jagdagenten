/**
 * SightingCard Component
 *
 * Displays a single community sighting with privacy-safe information.
 */

import { MapPin, Clock, Shield } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

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

interface SightingCardProps {
    sighting: Sighting;
    onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    if (diffHours > 0) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    return 'gerade eben';
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
    if (confidence >= 4) return { label: 'Sicher', color: '#10b981' };
    if (confidence >= 3) return { label: 'Wahrscheinlich', color: '#f59e0b' };
    if (confidence >= 2) return { label: 'Unsicher', color: '#f97316' };
    return { label: 'Sehr unsicher', color: '#ef4444' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SightingCard({ sighting, onClick }: SightingCardProps) {
    const confidenceInfo = getConfidenceLabel(sighting.confidence);
    const isProtected = ['wolf', 'luchs', 'wildkatze'].includes(sighting.species);

    return (
        <div className="sighting-card" onClick={onClick}>
            {/* Header */}
            <div className="card-header">
                <div className="species-info">
                    <span className="species-icon">{sighting.speciesIcon}</span>
                    <span className="species-name">{sighting.speciesLabel}</span>
                    {isProtected && (
                        <span className="protected-badge" title="Geschützte Art">
                            <Shield className="w-3 h-3" />
                        </span>
                    )}
                </div>
                <VerificationBadge type={sighting.badge} />
            </div>

            {/* Confidence */}
            <div className="confidence-row">
                <div className="confidence-bar">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`bar-segment ${level <= sighting.confidence ? 'filled' : ''}`}
                            style={{
                                backgroundColor: level <= sighting.confidence ? confidenceInfo.color : undefined,
                            }}
                        />
                    ))}
                </div>
                <span className="confidence-label" style={{ color: confidenceInfo.color }}>
                    {confidenceInfo.label}
                </span>
            </div>

            {/* Description */}
            {sighting.description && (
                <p className="card-description">{sighting.description}</p>
            )}

            {/* Photo preview */}
            {sighting.photoUrls && sighting.photoUrls.length > 0 && (
                <div className="photo-preview">
                    <img src={sighting.photoUrls[0]} alt="Sichtung" />
                    {sighting.photoUrls.length > 1 && (
                        <span className="photo-count">+{sighting.photoUrls.length - 1}</span>
                    )}
                </div>
            )}

            {/* Location & Time */}
            <div className="card-footer">
                <div className="footer-item">
                    <MapPin className="w-3 h-3" />
                    <span>{sighting.gridCellDisplay}</span>
                </div>
                <div className="footer-item">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(sighting.publishedAt)}</span>
                </div>
            </div>

            <style>{`
                .sighting-card {
                    background: var(--glass-surface);
                    border-radius: 12px;
                    padding: 14px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .sighting-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .species-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .species-icon {
                    font-size: 1.5rem;
                }

                .species-name {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .protected-badge {
                    display: flex;
                    align-items: center;
                    padding: 2px 6px;
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 4px;
                    color: #f59e0b;
                }

                .confidence-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .confidence-bar {
                    display: flex;
                    gap: 3px;
                    flex: 1;
                }

                .bar-segment {
                    height: 6px;
                    flex: 1;
                    border-radius: 3px;
                    background: var(--glass-bg-regular);
                }

                .bar-segment.filled {
                    background: var(--glass-accent, #10b981);
                }

                .confidence-label {
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .card-description {
                    margin: 0 0 10px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }

                .photo-preview {
                    position: relative;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .photo-preview img {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                }

                .photo-count {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    padding: 2px 8px;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: white;
                }

                .card-footer {
                    display: flex;
                    gap: 16px;
                }

                .footer-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}
