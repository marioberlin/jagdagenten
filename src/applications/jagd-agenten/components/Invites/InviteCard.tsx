/**
 * InviteCard Component
 *
 * Displays a Drückjagd or event invitation.
 */

import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Shield,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invite {
    id: string;
    inviteType: string;
    typeLabel: string;
    typeIcon: string;
    title: string;
    description?: string;
    bundesland?: string;
    region?: string;
    eventDate?: string;
    eventTimeStart?: string;
    requiredRoles?: string[];
    spotsLeft: number | null;
    rulesRequired: boolean;
}

interface InviteCardProps {
    invite: Invite;
    onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEventDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

const ROLE_LABELS: Record<string, string> = {
    schuetze: 'Schütze',
    treiber: 'Treiber',
    hundefuehrer: 'Hundeführer',
    standaufsicht: 'Standaufsicht',
    jagdleiter: 'Jagdleiter',
    helfer: 'Helfer',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InviteCard({ invite, onClick }: InviteCardProps) {
    const isFull = invite.spotsLeft !== null && invite.spotsLeft <= 0;
    const isUrgent = invite.spotsLeft !== null && invite.spotsLeft <= 3 && invite.spotsLeft > 0;

    return (
        <div className={`invite-card ${isFull ? 'full' : ''}`} onClick={onClick}>
            {/* Type badge */}
            <div className="type-badge">
                <span className="type-icon">{invite.typeIcon}</span>
                <span className="type-label">{invite.typeLabel}</span>
            </div>

            {/* Title */}
            <h4 className="title">{invite.title}</h4>

            {/* Description */}
            {invite.description && (
                <p className="description">{invite.description}</p>
            )}

            {/* Event details */}
            <div className="details">
                {invite.eventDate && (
                    <div className="detail-item">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(invite.eventDate)}</span>
                    </div>
                )}
                {invite.eventTimeStart && (
                    <div className="detail-item">
                        <Clock className="w-4 h-4" />
                        <span>{invite.eventTimeStart} Uhr</span>
                    </div>
                )}
                {(invite.bundesland || invite.region) && (
                    <div className="detail-item">
                        <MapPin className="w-4 h-4" />
                        <span>{invite.region || invite.bundesland}</span>
                    </div>
                )}
            </div>

            {/* Roles needed */}
            {invite.requiredRoles && invite.requiredRoles.length > 0 && (
                <div className="roles">
                    <span className="roles-label">Gesucht:</span>
                    <div className="role-tags">
                        {invite.requiredRoles.map((role) => (
                            <span key={role} className="role-tag">
                                {ROLE_LABELS[role] || role}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="card-footer">
                {/* Spots left */}
                {invite.spotsLeft !== null && (
                    <div className={`spots ${isUrgent ? 'urgent' : ''} ${isFull ? 'full' : ''}`}>
                        <Users className="w-4 h-4" />
                        {isFull ? (
                            <span>Ausgebucht</span>
                        ) : (
                            <span>
                                {invite.spotsLeft} {invite.spotsLeft === 1 ? 'Platz' : 'Plätze'} frei
                            </span>
                        )}
                    </div>
                )}

                {/* Safety indicator */}
                {invite.rulesRequired && (
                    <div className="safety-badge" title="Regelanerkennung erforderlich">
                        <Shield className="w-3 h-3" />
                    </div>
                )}
            </div>

            <style>{`
                .invite-card {
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 12px;
                    padding: 14px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    border-left: 4px solid var(--color-primary, #10b981);
                }

                .invite-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .invite-card.full {
                    opacity: 0.6;
                    border-left-color: var(--text-tertiary, #666);
                }

                .type-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    background: rgba(16, 185, 129, 0.15);
                    border-radius: 6px;
                    margin-bottom: 10px;
                }

                .type-icon {
                    font-size: 1rem;
                }

                .type-label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--color-primary, #10b981);
                }

                .title {
                    margin: 0 0 8px;
                    font-size: 1rem;
                    color: var(--text-primary, #fff);
                }

                .description {
                    margin: 0 0 10px;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
                    line-height: 1.4;
                }

                .details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 10px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
                }

                .roles {
                    margin-bottom: 10px;
                }

                .roles-label {
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                    margin-right: 8px;
                }

                .role-tags {
                    display: inline-flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .role-tag {
                    padding: 2px 8px;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: var(--text-secondary, #aaa);
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .spots {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                    color: var(--color-primary, #10b981);
                }

                .spots.urgent {
                    color: #f59e0b;
                }

                .spots.full {
                    color: var(--text-tertiary, #666);
                }

                .safety-badge {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    background: rgba(59, 130, 246, 0.2);
                    border-radius: 4px;
                    color: #3b82f6;
                }
            `}</style>
        </div>
    );
}
