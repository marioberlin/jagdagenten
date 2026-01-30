/**
 * StartHuntModal
 *
 * Modal for starting a new hunting session.
 * Allows user to select session type and optional stand.
 */

import { useState } from 'react';
import {
    X,
    Target,
    Footprints,
    Users,
    MapPin,
    Thermometer,
    Wind,
    Play,
} from 'lucide-react';
import type { SessionType, StandReference, WeatherSnapshot } from '../types/HuntSession';
import { SESSION_TYPE_LABELS } from '../types/HuntSession';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StartHuntModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (type: SessionType, stand?: StandReference) => void;
    stands?: StandReference[];
    currentWeather?: WeatherSnapshot;
}

// ---------------------------------------------------------------------------
// Session Type Icons
// ---------------------------------------------------------------------------

const SESSION_TYPE_ICONS: Record<SessionType, typeof Target> = {
    ansitz: Target,
    pirsch: Footprints,
    drueckjagd: Users,
};

const SESSION_TYPE_DESCRIPTIONS: Record<SessionType, string> = {
    ansitz: 'Vom Hochsitz oder Ansitz aus',
    pirsch: 'Zu Fuß durch das Revier',
    drueckjagd: 'Gesellschaftsjagd mit Team',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StartHuntModal({
    isOpen,
    onClose,
    onStart,
    stands = [],
    currentWeather,
}: StartHuntModalProps) {
    const [selectedType, setSelectedType] = useState<SessionType>('ansitz');
    const [selectedStand, setSelectedStand] = useState<StandReference | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    if (!isOpen) return null;

    const handleStart = async () => {
        setIsStarting(true);
        try {
            await onStart(selectedType, selectedStand || undefined);
            onClose();
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        Jagd starten
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Session Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Jagdart
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((type) => {
                                const Icon = SESSION_TYPE_ICONS[type];
                                const isSelected = selectedType === type;

                                return (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`
                                            p-3 rounded-xl border flex flex-col items-center gap-2 transition-all
                                            ${isSelected
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
                                            }
                                        `}
                                    >
                                        <Icon size={24} />
                                        <span className="text-xs font-medium">
                                            {SESSION_TYPE_LABELS[type]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {SESSION_TYPE_DESCRIPTIONS[selectedType]}
                        </p>
                    </div>

                    {/* Stand Selection (for Ansitz) */}
                    {selectedType === 'ansitz' && stands.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                Stand (optional)
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                <button
                                    onClick={() => setSelectedStand(null)}
                                    className={`
                                        p-2 rounded-lg border text-sm flex items-center gap-2 transition-all
                                        ${!selectedStand
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                                        }
                                    `}
                                >
                                    <MapPin size={14} />
                                    Keiner
                                </button>
                                {stands.map((stand) => (
                                    <button
                                        key={stand.id}
                                        onClick={() => setSelectedStand(stand)}
                                        className={`
                                            p-2 rounded-lg border text-sm flex items-center gap-2 transition-all truncate
                                            ${selectedStand?.id === stand.id
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                                            }
                                        `}
                                    >
                                        <MapPin size={14} className="shrink-0" />
                                        <span className="truncate">{stand.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weather Preview */}
                    {currentWeather && (
                        <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                            <div className="text-xs text-[var(--text-tertiary)] mb-2">
                                Aktuelle Bedingungen
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--text-primary)]">
                                <div className="flex items-center gap-1">
                                    <Thermometer size={14} className="text-orange-400" />
                                    {Math.round(currentWeather.temperature)}°C
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wind size={14} className="text-blue-400" />
                                    {Math.round(currentWeather.windSpeed)} km/h
                                </div>
                                <div className="text-[var(--text-tertiary)]">
                                    {currentWeather.moonPhase}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={handleStart}
                        disabled={isStarting}
                        className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                        {isStarting ? (
                            'Starte...'
                        ) : (
                            <>
                                <Play size={18} />
                                {SESSION_TYPE_LABELS[selectedType]} starten
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StartHuntModal;
