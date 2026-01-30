/**
 * Nachsuche Case Component
 *
 * Tracking workflow triggered after a shot event.
 * Role assignment, status tracking, and lessons learned.
 */

import { useState } from 'react';
import { Target, Dog, Car, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type NachsucheStatus = 'open' | 'started' | 'paused' | 'located' | 'recovered' | 'stopped' | 'closed';

interface NachsucheCase {
    id: string;
    sessionId: string;
    shotConfidence: number;
    flightDirection?: string;
    signs: string[];
    status: NachsucheStatus;
    waitTimeMinutes: number;
    roles: { role: string; person: string }[];
}

export function NachsucheFlow() {
    const [step, setStep] = useState<'initial' | 'team' | 'tracking' | 'complete'>('initial');
    const [caseData, setCaseData] = useState<NachsucheCase | null>(null);
    const [confidence, setConfidence] = useState(70);
    const [signs, setSigns] = useState<string[]>([]);
    const [direction, setDirection] = useState('');

    const handleStartCase = () => {
        const newCase: NachsucheCase = {
            id: `ns_${Date.now()}`,
            sessionId: 'current_session',
            shotConfidence: confidence,
            flightDirection: direction || undefined,
            signs,
            status: 'open',
            waitTimeMinutes: confidence >= 80 ? 15 : confidence >= 50 ? 30 : 60,
            roles: [],
        };
        setCaseData(newCase);
        setStep('team');
    };

    const handleAssignRole = (role: string, person: string) => {
        if (caseData) {
            setCaseData({
                ...caseData,
                roles: [...caseData.roles.filter(r => r.role !== role), { role, person }],
            });
        }
    };

    const handleStartTracking = () => {
        if (caseData) {
            setCaseData({ ...caseData, status: 'started' });
            setStep('tracking');
        }
    };

    const handleOutcome = (outcome: 'recovered' | 'stopped') => {
        if (caseData) {
            setCaseData({ ...caseData, status: outcome });
            setStep('complete');
        }
    };

    // Initial: shot confidence and signs
    if (step === 'initial') {
        return (
            <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center gap-3">
                    <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Schuss dokumentiert</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nachsuche vorbereiten</p>
                    </div>
                </div>

                {/* Confidence slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Treffersicherheit
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidence}
                        onChange={(e) => setConfidence(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Unsicher</span>
                        <span className={`font-bold ${confidence >= 80 ? 'text-green-600' : confidence >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>{confidence}%</span>
                        <span className="text-gray-500">Sicher</span>
                    </div>
                </div>

                {/* Flight direction */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fluchtrichtung
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'].map((dir) => (
                            <button
                                key={dir}
                                onClick={() => setDirection(dir)}
                                className={`py-2 rounded-lg text-sm font-medium transition-colors ${direction === dir
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {dir}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Signs */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pirschzeichen
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'blood', label: 'Schweiß', emoji: '🩸' },
                            { id: 'hair', label: 'Haar', emoji: '🦌' },
                            { id: 'bone', label: 'Knochen', emoji: '🦴' },
                            { id: 'none', label: 'Keine', emoji: '❌' },
                        ].map((sign) => (
                            <button
                                key={sign.id}
                                onClick={() => {
                                    if (signs.includes(sign.id)) {
                                        setSigns(signs.filter(s => s !== sign.id));
                                    } else {
                                        setSigns([...signs.filter(s => s !== 'none'), sign.id]);
                                    }
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${signs.includes(sign.id)
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {sign.emoji} {sign.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Wait time recommendation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Empfohlene Wartezeit</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">
                            {confidence >= 80 ? '15 Minuten' : confidence >= 50 ? '30 Minuten' : '60+ Minuten'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleStartCase}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                    Nachsuche vorbereiten
                </button>
            </div>
        );
    }

    // Team assignment
    if (step === 'team') {
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Team zuweisen</h3>

                {[
                    { role: 'shooter', label: 'Schütze', icon: <Target className="w-5 h-5" /> },
                    { role: 'handler', label: 'Hundeführer', icon: <Dog className="w-5 h-5" /> },
                    { role: 'driver', label: 'Begleitung', icon: <Car className="w-5 h-5" /> },
                    { role: 'safety_contact', label: 'Sicherheit', icon: <Shield className="w-5 h-5" /> },
                ].map(({ role, label, icon }) => (
                    <div key={role} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                                {icon}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                                <input
                                    type="text"
                                    placeholder="Name eingeben..."
                                    className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                    onChange={(e) => handleAssignRole(role, e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleStartTracking}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold"
                >
                    🐕 Nachsuche starten
                </button>
            </div>
        );
    }

    // Active tracking
    if (step === 'tracking') {
        return (
            <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Dog className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Nachsuche läuft</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Fall #{caseData?.id.slice(-6)}</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        Aktiv
                    </span>
                </div>

                {/* Team display */}
                <div className="grid grid-cols-2 gap-2">
                    {caseData?.roles.map(({ role, person }) => (
                        <div key={role} className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm">
                            <p className="text-gray-500 dark:text-gray-400 capitalize">{role}</p>
                            <p className="font-medium text-gray-900 dark:text-white">{person || '-'}</p>
                        </div>
                    ))}
                </div>

                {/* Outcome buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleOutcome('recovered')}
                        className="py-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex flex-col items-center gap-2"
                    >
                        <CheckCircle className="w-8 h-8" />
                        Gefunden
                    </button>
                    <button
                        onClick={() => handleOutcome('stopped')}
                        className="py-6 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold flex flex-col items-center gap-2"
                    >
                        <AlertCircle className="w-8 h-8" />
                        Abgebrochen
                    </button>
                </div>
            </div>
        );
    }

    // Complete
    return (
        <div className="space-y-4">
            <div className={`rounded-xl p-6 text-center ${caseData?.status === 'recovered'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-800'
                }`}>
                {caseData?.status === 'recovered' ? (
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                ) : (
                    <AlertCircle className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {caseData?.status === 'recovered' ? 'Wild gefunden' : 'Nachsuche beendet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Fall #{caseData?.id.slice(-6)} abgeschlossen
                </p>
            </div>

            {/* Lessons learned prompt */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💡 Was hast du gelernt?
                </label>
                <textarea
                    placeholder="Notizen für das nächste Mal..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    rows={3}
                />
            </div>

            <button
                onClick={() => {
                    setStep('initial');
                    setCaseData(null);
                    setConfidence(70);
                    setSigns([]);
                    setDirection('');
                }}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
            >
                Fertig
            </button>
        </div>
    );
}
