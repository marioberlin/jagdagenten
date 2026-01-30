/**
 * LiveTrackingView
 *
 * Real-time position sharing for driven hunts (Gesellschaftsjagden).
 * Shows pack members on map during active hunt events with:
 * - Role-based markers (Schütze, Treiber, Hundeführer)
 * - Last-seen timestamps
 * - Battery level indicators
 * - Privacy-first opt-in tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Marker } from 'pigeon-maps';
import {
    Users,
    MapPin,
    Shield,
    Battery,
    BatteryLow,
    BatteryMedium,
    Clock,
    Radio,
    CircleOff,
    Dog,
    Target,
    PersonStanding,
    Wrench,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackedParticipant {
    memberId: string;
    memberName: string;
    role?: 'schuetze' | 'treiber' | 'hundefuehrer' | 'helfer';
    position?: { lat: number; lng: number };
    lastPositionUpdate?: string;
    batteryLevel?: number; // 0-100
    checkedIn: boolean;
}

interface LiveTrackingViewProps {
    eventId: string;
    currentUserId: string;
    eventTitle?: string;
    onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<
    NonNullable<TrackedParticipant['role']>,
    { icon: typeof Target; color: string; label: string }
> = {
    schuetze: { icon: Target, color: '#22c55e', label: 'Schütze' },
    treiber: { icon: PersonStanding, color: '#3b82f6', label: 'Treiber' },
    hundefuehrer: { icon: Dog, color: '#f59e0b', label: 'Hundeführer' },
    helfer: { icon: Wrench, color: '#6b7280', label: 'Helfer' },
};

const POLL_INTERVAL_MS = 5000; // 5 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastSeen(isoString?: string): string {
    if (!isoString) return 'Nie';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Gerade eben';
    if (mins < 60) return `vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    return `vor ${hours} Std.`;
}

function BatteryIcon({ level }: { level?: number }) {
    if (level === undefined) return null;
    if (level < 20) return <BatteryLow size={14} className="text-red-400" />;
    if (level < 50) return <BatteryMedium size={14} className="text-orange-400" />;
    return <Battery size={14} className="text-green-400" />;
}

// ---------------------------------------------------------------------------
// Participant Marker
// ---------------------------------------------------------------------------

function ParticipantMarker({
    participant,
    isCurrentUser,
    onClick,
}: {
    participant: TrackedParticipant;
    isCurrentUser: boolean;
    onClick: () => void;
}) {
    const roleConfig = participant.role ? ROLE_CONFIG[participant.role] : null;
    const Icon = roleConfig?.icon ?? MapPin;
    const color = roleConfig?.color ?? '#9ca3af';

    return (
        <div
            onClick={onClick}
            className={`
                cursor-pointer transition-transform hover:scale-110
                ${isCurrentUser ? 'scale-125' : ''}
            `}
            title={`${participant.memberName} (${roleConfig?.label ?? 'Teilnehmer'})`}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: isCurrentUser ? '3px solid white' : '2px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon size={20} color="white" />
            </div>
            {/* Name label */}
            <div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-black/60 text-white px-1.5 py-0.5 rounded"
                style={{ pointerEvents: 'none' }}
            >
                {participant.memberName.split(' ')[0]}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tracking Toggle
// ---------------------------------------------------------------------------

function TrackingToggle({
    isTracking,
    onToggle,
}: {
    isTracking: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {isTracking ? (
                        <Radio size={20} className="text-green-400" />
                    ) : (
                        <CircleOff size={20} className="text-[var(--text-secondary)]" />
                    )}
                    <div>
                        <p className="font-medium text-[var(--text-primary)]">
                            Live-Ortung
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {isTracking
                                ? 'Deine Position wird geteilt'
                                : 'Position wird nicht geteilt'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className={`
                        px-4 py-2 rounded-lg font-medium text-sm transition-colors
                        ${isTracking
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }
                    `}
                >
                    {isTracking ? 'Stoppen' : 'Aktivieren'}
                </button>
            </div>
            {isTracking && (
                <p className="mt-3 text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Shield size={12} />
                    Position wird nur während der Jagd geteilt und nicht gespeichert.
                </p>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Participant List
// ---------------------------------------------------------------------------

function ParticipantList({
    participants,
    currentUserId,
    onSelect,
}: {
    participants: TrackedParticipant[];
    currentUserId: string;
    onSelect: (id: string) => void;
}) {
    const sortedParticipants = [...participants].sort((a, b) => {
        // Current user first, then by role, then by name
        if (a.memberId === currentUserId) return -1;
        if (b.memberId === currentUserId) return 1;
        return a.memberName.localeCompare(b.memberName);
    });

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <Users size={14} />
                Teilnehmer ({participants.length})
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sortedParticipants.map((p) => {
                    const roleConfig = p.role ? ROLE_CONFIG[p.role] : null;
                    const hasPosition = !!p.position;

                    return (
                        <button
                            key={p.memberId}
                            onClick={() => onSelect(p.memberId)}
                            className={`
                                w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors
                                ${hasPosition
                                    ? 'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]'
                                    : 'opacity-50'
                                }
                            `}
                        >
                            {/* Role indicator */}
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: roleConfig?.color ?? '#6b7280' }}
                            >
                                {roleConfig ? (
                                    <roleConfig.icon size={16} color="white" />
                                ) : (
                                    <MapPin size={16} color="white" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text-primary)] truncate">
                                    {p.memberName}
                                    {p.memberId === currentUserId && (
                                        <span className="ml-1 text-xs text-[var(--glass-accent)]">(Du)</span>
                                    )}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                                    {roleConfig?.label ?? 'Teilnehmer'}
                                    {hasPosition && (
                                        <>
                                            <span className="opacity-50">•</span>
                                            <Clock size={10} />
                                            {formatLastSeen(p.lastPositionUpdate)}
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Battery */}
                            <BatteryIcon level={p.batteryLevel} />

                            {/* Online indicator */}
                            <div
                                className={`w-2 h-2 rounded-full ${hasPosition ? 'bg-green-400' : 'bg-gray-400'
                                    }`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LiveTrackingView({
    eventId,
    currentUserId,
    eventTitle,
    onClose,
}: LiveTrackingViewProps) {
    const [participants, setParticipants] = useState<TrackedParticipant[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Fetch participants with positions
    const fetchPositions = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/jagd/events/${eventId}`);
            if (!res.ok) throw new Error('Failed to fetch event');
            const data = await res.json();
            if (data.event?.participants) {
                setParticipants(data.event.participants);
            }
            setLoading(false);
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }, [eventId]);

    // Update own position
    const updatePosition = useCallback(
        async (position: GeolocationPosition) => {
            try {
                await fetch(`/api/v1/jagd/events/${eventId}/position`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: currentUserId,
                        position: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        },
                    }),
                });
            } catch (err) {
                console.error('Failed to update position:', err);
            }
        },
        [eventId, currentUserId]
    );

    // Start/stop geolocation watching
    const toggleTracking = useCallback(() => {
        if (isTracking) {
            // Stop tracking
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setIsTracking(false);
        } else {
            // Start tracking
            if ('geolocation' in navigator) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                    updatePosition,
                    (err) => console.error('Geolocation error:', err),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
                );
                setIsTracking(true);
            } else {
                setError('Geolocation wird nicht unterstützt');
            }
        }
    }, [isTracking, updatePosition]);

    // Polling effect
    useEffect(() => {
        fetchPositions();
        const interval = setInterval(fetchPositions, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchPositions]);

    // Cleanup geolocation on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Calculate map center from participants with positions
    const participantsWithPosition = participants.filter((p) => p.position);
    const mapCenter: [number, number] = participantsWithPosition.length > 0
        ? [
            participantsWithPosition.reduce((sum, p) => sum + (p.position?.lat ?? 0), 0) /
            participantsWithPosition.length,
            participantsWithPosition.reduce((sum, p) => sum + (p.position?.lng ?? 0), 0) /
            participantsWithPosition.length,
        ]
        : [51.1657, 10.4515]; // Germany center

    // Focus on selected participant
    const focusedCenter =
        selectedParticipant &&
            participants.find((p) => p.memberId === selectedParticipant)?.position
            ? [
                participants.find((p) => p.memberId === selectedParticipant)!.position!.lat,
                participants.find((p) => p.memberId === selectedParticipant)!.position!.lng,
            ] as [number, number]
            : mapCenter;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-[var(--text-secondary)]">Lade Tracking-Daten...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Radio size={20} className="text-green-400" />
                    Live-Ortung
                </h2>
                <div className="flex items-center gap-3">
                    {eventTitle && (
                        <span className="text-sm text-[var(--text-secondary)]">{eventTitle}</span>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] transition-colors"
                            title="Schließen"
                        >
                            <CircleOff size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tracking Toggle */}
            <TrackingToggle isTracking={isTracking} onToggle={toggleTracking} />

            {/* Map */}
            <div className="h-80 rounded-xl overflow-hidden border border-[var(--glass-border)]">
                <Map center={focusedCenter} zoom={14} attribution={false}>
                    {participantsWithPosition.map((p) => (
                        <Marker
                            key={p.memberId}
                            anchor={[p.position!.lat, p.position!.lng]}
                            offset={[20, 40]}
                        >
                            <ParticipantMarker
                                participant={p}
                                isCurrentUser={p.memberId === currentUserId}
                                onClick={() => setSelectedParticipant(p.memberId)}
                            />
                        </Marker>
                    ))}
                </Map>
            </div>

            {/* Participant List */}
            <ParticipantList
                participants={participants}
                currentUserId={currentUserId}
                onSelect={(id) => setSelectedParticipant(id)}
            />
        </div>
    );
}

export default LiveTrackingView;
