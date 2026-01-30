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
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Wildunfall melden
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
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
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                            {status === 'resolved' ? (
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Wildunfall #{incident?.id.slice(-6)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                    Neuer Vorfall
                </button>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
    const config: Record<IncidentStatus, { bg: string; text: string; label: string }> = {
        idle: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bereit' },
        creating: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Wird erstellt...' },
        open: { bg: 'bg-red-100', text: 'text-red-700', label: 'Offen' },
        accepted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Angenommen' },
        arrived: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vor Ort' },
        resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Erledigt' },
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
            <div className={`w-3 h-3 rounded-full ${completed ? 'bg-green-500' : active ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
        </div>
    );
}

function StepLine({ completed }: { completed: boolean }) {
    return (
        <div className={`flex-1 h-0.5 ${completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
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
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        gray: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    };

    return (
        <button className={`${colors[color]} p-4 rounded-xl text-left transition-all active:scale-95`}>
            {icon}
            <p className="font-semibold mt-2">{label}</p>
            <p className="text-sm opacity-75">{sublabel}</p>
        </button>
    );
}
