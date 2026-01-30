/**
 * ContentWarningBanner Component
 *
 * Banner displayed when content has been reported or is under review.
 */

import { AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WarningType = 'under_review' | 'hidden' | 'location_sensitive' | 'protected_species';

interface ContentWarningBannerProps {
    type: WarningType;
    reportCount?: number;
    onShowContent?: () => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WARNING_CONFIG: Record<WarningType, {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    canReveal: boolean;
}> = {
    under_review: {
        icon: <Shield className="w-5 h-5" />,
        title: 'Inhalt wird geprüft',
        description: 'Dieser Inhalt wurde gemeldet und wird derzeit überprüft.',
        color: '#f59e0b',
        canReveal: true,
    },
    hidden: {
        icon: <EyeOff className="w-5 h-5" />,
        title: 'Inhalt ausgeblendet',
        description: 'Dieser Inhalt verstößt gegen unsere Richtlinien.',
        color: '#ef4444',
        canReveal: false,
    },
    location_sensitive: {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Standort-Warnung',
        description: 'Dieser Inhalt enthält möglicherweise zu genaue Standortangaben.',
        color: '#f59e0b',
        canReveal: true,
    },
    protected_species: {
        icon: <Shield className="w-5 h-5" />,
        title: 'Geschützte Art',
        description: 'Informationen über geschützte Arten werden verzögert veröffentlicht.',
        color: '#3b82f6',
        canReveal: false,
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentWarningBanner({
    type,
    reportCount,
    onShowContent,
    className = '',
}: ContentWarningBannerProps) {
    const [revealed, setRevealed] = useState(false);
    const config = WARNING_CONFIG[type];

    if (revealed) {
        return null;
    }

    const handleReveal = () => {
        if (config.canReveal && onShowContent) {
            setRevealed(true);
            onShowContent();
        }
    };

    return (
        <div
            className={`content-warning-banner ${className}`}
            style={{ borderLeftColor: config.color }}
        >
            <div className="warning-header">
                <div className="warning-icon" style={{ color: config.color }}>
                    {config.icon}
                </div>
                <div className="warning-text">
                    <h4>{config.title}</h4>
                    <p>{config.description}</p>
                </div>
            </div>

            {reportCount && reportCount > 0 && (
                <div className="report-count">
                    {reportCount} Meldung{reportCount > 1 ? 'en' : ''}
                </div>
            )}

            {config.canReveal && onShowContent && (
                <button onClick={handleReveal} className="reveal-btn">
                    <Eye className="w-4 h-4" />
                    <span>Trotzdem anzeigen</span>
                </button>
            )}

            <style>{`
                .content-warning-banner {
                    background: var(--bg-tertiary, #2a2a4a);
                    border-left: 3px solid;
                    border-radius: 8px;
                    padding: 14px;
                }

                .warning-header {
                    display: flex;
                    gap: 12px;
                }

                .warning-icon {
                    flex-shrink: 0;
                }

                .warning-text h4 {
                    margin: 0 0 4px;
                    font-size: 0.9rem;
                    color: var(--text-primary, #fff);
                }

                .warning-text p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
                }

                .report-count {
                    margin-top: 10px;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                    display: inline-block;
                }

                .reveal-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 12px;
                    padding: 8px 14px;
                    background: rgba(255, 255, 255, 0.08);
                    border: none;
                    border-radius: 6px;
                    color: var(--text-secondary, #aaa);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .reveal-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                }
            `}</style>
        </div>
    );
}

export type { WarningType };
