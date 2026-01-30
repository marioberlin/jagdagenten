/**
 * HuntModeView
 *
 * Full-screen hunting mode interface.
 * Minimal UI for low distraction during active hunt.
 */

import { useState, useEffect } from 'react';
import {
    Compass,
    Wind,
    Eye,
    Crosshair,
    Square,
    Clock,
    ThermometerSun,
    ChevronUp,
} from 'lucide-react';
import { useHuntSessionStore, selectActiveSession, selectSessionDuration } from '../stores/useHuntSessionStore';
import type { SessionType, Observation, Shot } from '../types/HuntSession';
import { SESSION_TYPE_LABELS, SPECIES_LABELS } from '../types/HuntSession';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HuntModeViewProps {
    onEnd: () => void;
    isRedLightMode?: boolean;
}

// ---------------------------------------------------------------------------
// Quick Log Modal
// ---------------------------------------------------------------------------

function QuickLogModal({
    type,
    onClose,
    onSubmit,
}: {
    type: 'observation' | 'shot';
    onClose: () => void;
    onSubmit: (data: Partial<Observation> | Partial<Shot>) => void;
}) {
    const [species, setSpecies] = useState('rehwild');
    const [count, setCount] = useState(1);
    const [result, setResult] = useState<'hit' | 'miss'>('hit');

    const handleSubmit = () => {
        if (type === 'observation') {
            onSubmit({ species, count });
        } else {
            onSubmit({ result });
        }
        onClose();
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--glass-surface)] border-t border-[var(--glass-border)] rounded-t-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">
                    {type === 'observation' ? 'Beobachtung' : 'Schuss'} erfassen
                </h3>
                <button onClick={onClose} className="text-[var(--text-secondary)]">
                    ✕
                </button>
            </div>

            {type === 'observation' ? (
                <>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(SPECIES_LABELS).slice(0, 6).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setSpecies(key)}
                                className={`
                                    p-2 rounded-lg border text-sm transition-all
                                    ${species === key
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                        : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                                    }
                                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--text-secondary)]">Anzahl:</span>
                        <button
                            onClick={() => setCount(Math.max(1, count - 1))}
                            className="w-10 h-10 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        >
                            -
                        </button>
                        <span className="text-xl font-semibold text-[var(--text-primary)] w-8 text-center">
                            {count}
                        </span>
                        <button
                            onClick={() => setCount(count + 1)}
                            className="w-10 h-10 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        >
                            +
                        </button>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setResult('hit')}
                        className={`
                            p-3 rounded-lg border text-sm transition-all
                            ${result === 'hit'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                            }
                        `}
                    >
                        ✓ Treffer
                    </button>
                    <button
                        onClick={() => setResult('miss')}
                        className={`
                            p-3 rounded-lg border text-sm transition-all
                            ${result === 'miss'
                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                            }
                        `}
                    >
                        ✗ Fehlschuss
                    </button>
                </div>
            )}

            <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium"
            >
                Speichern
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HuntModeView({ onEnd, isRedLightMode = false }: HuntModeViewProps) {
    const session = useHuntSessionStore(selectActiveSession);
    const duration = useHuntSessionStore(selectSessionDuration);
    const { addObservation, addShot } = useHuntSessionStore();

    const [windDirection, setWindDirection] = useState(0);
    const [showQuickLog, setShowQuickLog] = useState<'observation' | 'shot' | null>(null);
    const [showActions, setShowActions] = useState(false);

    // Update wind direction from compass (if available)
    useEffect(() => {
        if (session?.weatherSnapshot?.windDirection) {
            setWindDirection(session.weatherSnapshot.windDirection);
        }
    }, [session]);

    // Format duration
    const formatDuration = (minutes: number): string => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (!session) return null;

    const accentColor = isRedLightMode ? 'rgb(180, 60, 60)' : 'rgb(52, 211, 153)';

    return (
        <div
            className="fixed inset-0 z-40 flex flex-col"
            style={{
                backgroundColor: isRedLightMode ? '#1a0505' : '#0a1a0a',
                color: isRedLightMode ? '#ff6666' : '#34d399',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-current/20">
                <div className="flex items-center gap-3">
                    <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm font-medium opacity-70">
                        {SESSION_TYPE_LABELS[session.type as SessionType]}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} />
                    <span className="font-mono">{formatDuration(duration)}</span>
                </div>
            </div>

            {/* Compass & Wind */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                {/* Big Compass */}
                <div
                    className="relative w-48 h-48 rounded-full border-2 border-current/30 flex items-center justify-center"
                >
                    {/* Cardinal points */}
                    <span className="absolute top-2 text-xs font-bold">N</span>
                    <span className="absolute bottom-2 text-xs opacity-50">S</span>
                    <span className="absolute left-2 text-xs opacity-50">W</span>
                    <span className="absolute right-2 text-xs opacity-50">O</span>

                    {/* Wind arrow */}
                    <div
                        className="absolute inset-8 flex items-center justify-center"
                        style={{ transform: `rotate(${windDirection}deg)` }}
                    >
                        <div
                            className="w-1 h-20 rounded-full"
                            style={{
                                background: `linear-gradient(to top, transparent, ${accentColor})`,
                            }}
                        />
                        <Wind
                            size={24}
                            className="absolute -top-3"
                            style={{ color: accentColor }}
                        />
                    </div>

                    {/* Center compass icon */}
                    <Compass size={32} className="opacity-50" />
                </div>

                {/* Wind info */}
                {session.weatherSnapshot && (
                    <div className="mt-6 text-center">
                        <div className="text-2xl font-light">
                            {Math.round(session.weatherSnapshot.windSpeed)} km/h
                        </div>
                        <div className="text-sm opacity-50">Wind aus {getWindLabel(windDirection)}</div>
                    </div>
                )}

                {/* Temperature */}
                {session.weatherSnapshot && (
                    <div className="mt-4 flex items-center gap-2 opacity-50 text-sm">
                        <ThermometerSun size={14} />
                        {Math.round(session.weatherSnapshot.temperature)}°C
                    </div>
                )}

                {/* Stand name */}
                {session.stand && (
                    <div className="mt-6 px-4 py-2 rounded-full border border-current/30 text-sm">
                        📍 {session.stand.name}
                    </div>
                )}
            </div>

            {/* Session stats */}
            <div className="flex items-center justify-center gap-8 py-4 border-t border-current/20">
                <div className="text-center">
                    <div className="text-2xl font-semibold">{session.observations.length}</div>
                    <div className="text-xs opacity-50">Beobachtungen</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-semibold">{session.shots.length}</div>
                    <div className="text-xs opacity-50">Schüsse</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-semibold">{session.harvests.length}</div>
                    <div className="text-xs opacity-50">Strecke</div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 space-y-2">
                {/* Expand toggle */}
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="w-full py-2 flex items-center justify-center gap-2 opacity-50"
                >
                    <ChevronUp
                        size={16}
                        style={{ transform: showActions ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                    <span className="text-xs">Aktionen</span>
                </button>

                {showActions && (
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setShowQuickLog('observation')}
                            className="p-4 rounded-xl border border-current/30 flex flex-col items-center gap-2"
                        >
                            <Eye size={24} />
                            <span className="text-xs">Beobachtung</span>
                        </button>
                        <button
                            onClick={() => setShowQuickLog('shot')}
                            className="p-4 rounded-xl border border-current/30 flex flex-col items-center gap-2"
                        >
                            <Crosshair size={24} />
                            <span className="text-xs">Schuss</span>
                        </button>
                        <button
                            onClick={onEnd}
                            className="p-4 rounded-xl border border-red-500/30 text-red-400 flex flex-col items-center gap-2"
                        >
                            <Square size={24} />
                            <span className="text-xs">Beenden</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Quick log modal */}
            {showQuickLog && (
                <QuickLogModal
                    type={showQuickLog}
                    onClose={() => setShowQuickLog(null)}
                    onSubmit={(data) => {
                        if (showQuickLog === 'observation') {
                            const obs = data as { species: string; count: number };
                            addObservation({ species: obs.species, count: obs.count });
                        } else {
                            const shot = data as { result: 'hit' | 'miss' };
                            addShot({ result: shot.result });
                        }
                    }}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWindLabel(degrees: number): string {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

export default HuntModeView;
