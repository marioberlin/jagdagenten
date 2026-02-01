/**
 * Wildunfall Emergency Mode Component
 *
 * Big-button stress-proof workflow for wildlife collision response.
 */

import React, { useState } from 'react';
import { AlertTriangle, Phone, MapPin, FileText, CheckCircle, Users } from 'lucide-react';

type IncidentStatus = 'idle' | 'creating' | 'open' | 'accepted' | 'arrived' | 'resolved';

interface WildunfallIncident {
    id: string;
    time: string;
    species?: string;
    status: IncidentStatus;
    responder?: string;
}

export function WildunfallMode() {
    const [status, setStatus] = useState<IncidentStatus>('idle');
    const [incident, setIncident] = useState<WildunfallIncident | null>(null);
    const [species, setSpecies] = useState('');

    const handleStartIncident = async () => {
        setStatus('creating');

        // Mock incident creation
        const newIncident: WildunfallIncident = {
            id: `wu_${Date.now()}`,
            time: new Date().toISOString(),
            species: species || undefined,
            status: 'open',
        };

        setIncident(newIncident);
        setStatus('open');
    };

    const handleUpdateStatus = (newStatus: IncidentStatus) => {
        if (incident) {
            setIncident({ ...incident, status: newStatus });
            setStatus(newStatus);
        }
    };

    // Idle state - show start button
    if (status === 'idle') {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-red-500/10 rounded-2xl">
                <AlertTriangle className="w-16 h-16 text-red-400 mb-6" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Wildunfall melden
                </h2>
                <p className="text-[var(--text-secondary)] text-center mb-6">
                    Schnell dokumentieren und Bereitschaft alarmieren
                </p>

                {/* Quick species selection */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {['Reh', 'Wildschwein', 'Hirsch', 'Fuchs', 'Dachs', 'Unbekannt'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpecies(s)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${species === s
                                ? 'bg-red-600 text-white'
                                : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleStartIncident}
                    className="w-full max-w-xs py-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xl font-bold shadow-lg transition-all active:scale-95"
                >
                    🚨 VORFALL STARTEN
                </button>
            </div>
        );
    }

    // Active incident state
    return (
        <div className="space-y-4">
            {/* Status header */}
            <div className="bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${status === 'resolved' ? 'bg-green-500/15' : 'bg-red-500/15'
                            }`}>
                            {status === 'resolved' ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)]">
                                Wildunfall #{incident?.id.slice(-6)}
                            </h3>
                            <p className="text-sm text-[var(--text-tertiary)]">
                                {incident?.species || 'Unbekannt'} • {new Date(incident?.time || '').toLocaleTimeString('de-DE')}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Progress steps */}
                <div className="flex items-center gap-2 mb-4">
                    <Step active={status === 'open'} completed={['accepted', 'arrived', 'resolved'].includes(status)} label="Gemeldet" />
                    <StepLine completed={['accepted', 'arrived', 'resolved'].includes(status)} />
                    <Step active={status === 'accepted'} completed={['arrived', 'resolved'].includes(status)} label="Angenommen" />
                    <StepLine completed={['arrived', 'resolved'].includes(status)} />
                    <Step active={status === 'arrived'} completed={status === 'resolved'} label="Vor Ort" />
                    <StepLine completed={status === 'resolved'} />
                    <Step active={status === 'resolved'} completed={false} label="Erledigt" />
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <ActionButton
                    icon={<Phone className="w-6 h-6" />}
                    label="Anrufen"
                    sublabel="Bereitschaft"
                    color="blue"
                />
                <ActionButton
                    icon={<MapPin className="w-6 h-6" />}
                    label="Standort"
                    sublabel="Teilen"
                    color="green"
                />
                <ActionButton
                    icon={<Users className="w-6 h-6" />}
                    label="Bereitschaft"
                    sublabel="Alarmieren"
                    color="orange"
                />
                <ActionButton
                    icon={<FileText className="w-6 h-6" />}
                    label="Notizen"
                    sublabel="Hinzufügen"
                    color="gray"
                />
            </div>

            {/* Status update buttons */}
            {status !== 'resolved' && (
                <div className="grid grid-cols-2 gap-3">
                    {status === 'open' && (
                        <button
                            onClick={() => handleUpdateStatus('accepted')}
                            className="col-span-2 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                        >
                            ✓ Übernommen
                        </button>
                    )}
                    {status === 'accepted' && (
                        <button
                            onClick={() => handleUpdateStatus('arrived')}
                            className="col-span-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                        >
                            📍 Vor Ort angekommen
                        </button>
                    )}
                    {status === 'arrived' && (
                        <button
                            onClick={() => handleUpdateStatus('resolved')}
                            className="col-span-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                        >
                            ✓ Abgeschlossen
                        </button>
                    )}
                </div>
            )}

            {/* Reset button */}
            {status === 'resolved' && (
                <button
                    onClick={() => {
                        setStatus('idle');
                        setIncident(null);
                        setSpecies('');
                    }}
                    className="w-full py-3 bg-[var(--glass-surface)] text-[var(--text-secondary)] rounded-xl font-medium"
                >
                    Neuer Vorfall
                </button>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
    const config: Record<IncidentStatus, { bg: string; text: string; label: string }> = {
        idle: { bg: 'bg-[var(--glass-surface)]', text: 'text-[var(--text-secondary)]', label: 'Bereit' },
        creating: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Wird erstellt...' },
        open: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Offen' },
        accepted: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Angenommen' },
        arrived: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Vor Ort' },
        resolved: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Erledigt' },
    };
    const c = config[status];
    return (
        <span className={`px-3 py-1 ${c.bg} ${c.text} rounded-full text-sm font-medium`}>
            {c.label}
        </span>
    );
}

function Step({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${completed ? 'bg-green-500' : active ? 'bg-amber-500' : 'bg-[var(--glass-border)]'
                }`} />
            <span className="text-xs text-[var(--text-tertiary)] mt-1">{label}</span>
        </div>
    );
}

function StepLine({ completed }: { completed: boolean }) {
    return (
        <div className={`flex-1 h-0.5 ${completed ? 'bg-green-500' : 'bg-[var(--glass-border)]'}`} />
    );
}

function ActionButton({
    icon,
    label,
    sublabel,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    color: 'blue' | 'green' | 'orange' | 'gray';
}) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-green-500/10 text-green-400',
        orange: 'bg-orange-500/10 text-orange-400',
        gray: 'bg-[var(--glass-surface)] text-[var(--text-secondary)]',
    };

    return (
        <button className={`${colors[color]} p-4 rounded-xl text-left transition-all active:scale-95`}>
            {icon}
            <p className="font-semibold mt-2">{label}</p>
            <p className="text-sm opacity-75">{sublabel}</p>
        </button>
    );
}
