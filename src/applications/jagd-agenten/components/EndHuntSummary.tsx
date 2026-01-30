/**
 * EndHuntSummary
 *
 * Post-hunt summary screen showing session details and prompting for follow-up actions.
 */

import { useState } from 'react';
import {
    Clock,
    Eye,
    Target,
    ThermometerSun,
    Wind,
    FileText,
    QrCode,
    BookOpen,
    Check,
    X,
} from 'lucide-react';
import type { SessionSummary, HuntSession, SessionType } from '../types/HuntSession';
import { SESSION_TYPE_LABELS, SPECIES_LABELS } from '../types/HuntSession';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EndHuntSummaryProps {
    session: HuntSession;
    summary: SessionSummary;
    onClose: () => void;
    onCreateStreckenmeldung?: () => void;
    onCreateVenisonPass?: (harvestId: string) => void;
    onSaveToJournal?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EndHuntSummary({
    session,
    summary,
    onClose,
    onCreateStreckenmeldung,
    onCreateVenisonPass,
    onSaveToJournal,
}: EndHuntSummaryProps) {
    const [savedToJournal, setSavedToJournal] = useState(false);

    // Format duration
    const formatDuration = (minutes: number | undefined): string => {
        if (!minutes) return '—';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}min` : `${m} min`;
    };

    // Format time
    const formatTime = (isoString: string): string => {
        return new Date(isoString).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const hasHarvests = session.harvests.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] shadow-xl">
                {/* Header */}
                <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            {SESSION_TYPE_LABELS[session.type as SessionType]} beendet
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {formatTime(session.startTime)} – {formatTime(session.endTime!)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="p-4 grid grid-cols-3 gap-4 border-b border-[var(--glass-border)]">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Clock size={16} className="text-blue-400" />
                        </div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]">
                            {formatDuration(summary.duration)}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">Dauer</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Eye size={16} className="text-amber-400" />
                        </div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]">
                            {summary.observationCount}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">Beobachtungen</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <Target size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]">
                            {summary.harvestCount}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">Strecke</div>
                    </div>
                </div>

                {/* Weather at start */}
                {session.weatherSnapshot && (
                    <div className="p-4 border-b border-[var(--glass-border)]">
                        <div className="text-xs text-[var(--text-tertiary)] mb-2">
                            Wetter beim Start
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--text-primary)]">
                            <div className="flex items-center gap-1">
                                <ThermometerSun size={14} className="text-orange-400" />
                                {Math.round(session.weatherSnapshot.temperature)}°C
                            </div>
                            <div className="flex items-center gap-1">
                                <Wind size={14} className="text-blue-400" />
                                {Math.round(session.weatherSnapshot.windSpeed)} km/h
                            </div>
                            <div className="text-[var(--text-secondary)]">
                                {session.weatherSnapshot.moonPhase}
                            </div>
                        </div>
                    </div>
                )}

                {/* Observations List */}
                {session.observations.length > 0 && (
                    <div className="p-4 border-b border-[var(--glass-border)]">
                        <div className="text-xs text-[var(--text-tertiary)] mb-2">
                            Beobachtungen
                        </div>
                        <div className="space-y-2">
                            {session.observations.map((obs) => (
                                <div
                                    key={obs.id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-[var(--text-primary)]">
                                        {obs.count}× {SPECIES_LABELS[obs.species] || obs.species}
                                    </span>
                                    <span className="text-[var(--text-tertiary)]">
                                        {formatTime(obs.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Harvests List */}
                {hasHarvests && (
                    <div className="p-4 border-b border-[var(--glass-border)]">
                        <div className="text-xs text-[var(--text-tertiary)] mb-2">
                            Strecke
                        </div>
                        <div className="space-y-2">
                            {session.harvests.map((harvest) => (
                                <div
                                    key={harvest.id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-emerald-400 font-medium">
                                        🦌 {SPECIES_LABELS[harvest.species] || harvest.species}
                                        {harvest.gender && ` (${harvest.gender === 'male' ? '♂' : '♀'})`}
                                    </span>
                                    <span className="text-[var(--text-tertiary)]">
                                        {formatTime(harvest.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Prompts */}
                <div className="p-4 space-y-2">
                    <div className="text-xs text-[var(--text-tertiary)] mb-2">
                        Nächste Schritte
                    </div>

                    {/* Streckenmeldung (if harvests) */}
                    {hasHarvests && onCreateStreckenmeldung && (
                        <button
                            onClick={onCreateStreckenmeldung}
                            className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 hover:bg-emerald-500/20 transition-colors"
                        >
                            <FileText size={20} />
                            <div className="text-left">
                                <div className="font-medium">Streckenmeldung erstellen</div>
                                <div className="text-xs opacity-70">Für Landkreis-Meldung</div>
                            </div>
                        </button>
                    )}

                    {/* Wildbret Pass (for each harvest) */}
                    {hasHarvests && onCreateVenisonPass && session.harvests.map((harvest) => (
                        <button
                            key={harvest.id}
                            onClick={() => onCreateVenisonPass(harvest.id)}
                            className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-3 hover:bg-amber-500/20 transition-colors"
                        >
                            <QrCode size={20} />
                            <div className="text-left">
                                <div className="font-medium">Wildbret Pass erstellen</div>
                                <div className="text-xs opacity-70">
                                    {SPECIES_LABELS[harvest.species] || harvest.species} — QR-Etikett
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Save to Journal */}
                    {onSaveToJournal && (
                        <button
                            onClick={() => {
                                onSaveToJournal();
                                setSavedToJournal(true);
                            }}
                            disabled={savedToJournal}
                            className={`
                                w-full p-3 rounded-xl border flex items-center gap-3 transition-colors
                                ${savedToJournal
                                    ? 'bg-[var(--glass-surface)] border-emerald-500/50 text-emerald-400'
                                    : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-hover)]'
                                }
                            `}
                        >
                            {savedToJournal ? <Check size={20} /> : <BookOpen size={20} />}
                            <div className="text-left">
                                <div className="font-medium">
                                    {savedToJournal ? 'Im Tagebuch gespeichert' : 'Im Tagebuch speichern'}
                                </div>
                                <div className="text-xs opacity-70">
                                    Für persönliche Aufzeichnungen
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Close button */}
                <div className="p-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] font-medium hover:bg-[var(--glass-surface-hover)] transition-colors"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EndHuntSummary;
