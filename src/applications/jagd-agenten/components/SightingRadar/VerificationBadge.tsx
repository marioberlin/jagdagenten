/**
 * VerificationBadge Component
 *
 * Displays verification status for sightings:
 * - community: User-submitted sighting
 * - dbbw: Official DBBW wolf monitoring data
 * - bfn: Bundesamt für Naturschutz
 * - agent: AI-inferred pattern
 */

import React from 'react';
import { User, Shield, Bot, Building2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeType = 'community' | 'dbbw' | 'bfn' | 'agent';

interface VerificationBadgeProps {
    type: BadgeType;
    size?: 'sm' | 'md';
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BADGE_CONFIG: Record<BadgeType, {
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    tooltip: string;
}> = {
    community: {
        label: 'Community',
        icon: <User className="w-3 h-3" />,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        tooltip: 'Von einem Jäger der Community gemeldet',
    },
    dbbw: {
        label: 'DBBW',
        icon: <Shield className="w-3 h-3" />,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        tooltip: 'Verifiziert durch DBBW (Dokumentations- und Beratungsstelle des Bundes zum Thema Wolf)',
    },
    bfn: {
        label: 'BfN',
        icon: <Building2 className="w-3 h-3" />,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        tooltip: 'Verifiziert durch Bundesamt für Naturschutz',
    },
    agent: {
        label: 'KI-Analyse',
        icon: <Bot className="w-3 h-3" />,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        tooltip: 'Muster erkannt durch KI-Analyse (kein verifizierter Nachweis)',
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VerificationBadge({ type, size = 'sm' }: VerificationBadgeProps) {
    const config = BADGE_CONFIG[type];

    if (!config) return null;

    return (
        <div
            className={`verification-badge size-${size}`}
            title={config.tooltip}
            style={{
                color: config.color,
                backgroundColor: config.bgColor,
            }}
        >
            {config.icon}
            <span>{config.label}</span>

            <style>{`
                .verification-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: help;
                }

                .verification-badge.size-sm {
                    font-size: 0.7rem;
                }

                .verification-badge.size-md {
                    font-size: 0.8rem;
                    padding: 4px 10px;
                }
            `}</style>
        </div>
    );
}
