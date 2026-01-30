/**
 * Confirmation Modal Component
 *
 * DSA-compliant confirmation dialog for Tier 2/3 actions.
 * Shows preview of what will happen and requires explicit consent.
 */

import { AlertTriangle, Shield, MapPin, Clock, Users } from 'lucide-react';

interface ConfirmationPreview {
    scope: 'private' | 'team' | 'public';
    geoMode: 'none' | 'coarse_grid' | 'precise';
    timeDelay?: number;
    participants?: string[];
}

interface ConfirmationRequest {
    tier: 2 | 3;
    action: string;
    summary: string;
    preview: ConfirmationPreview;
    confirmToken: string;
}

interface ConfirmationModalProps {
    request: ConfirmationRequest;
    onConfirm: (token: string) => void;
    onCancel: () => void;
}

const SCOPE_LABELS: Record<string, string> = {
    private: 'Nur für mich',
    team: 'Jagdfreunde',
    public: 'Öffentlich',
};

const GEO_LABELS: Record<string, string> = {
    none: 'Kein Standort',
    coarse_grid: 'Grobe Angabe (~2km)',
    precise: 'Präzise Koordinaten',
};

export function ConfirmationModal({ request, onConfirm, onCancel }: ConfirmationModalProps) {
    const isTier3 = request.tier === 3;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div
                    className={`px-6 py-4 flex items-center gap-3 ${isTier3 ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                >
                    <AlertTriangle className="text-white" size={24} />
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {isTier3 ? 'Kritische Aktion' : 'Bestätigung erforderlich'}
                        </h2>
                        <p className="text-white/80 text-sm">{request.action}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-slate-700 dark:text-slate-300">{request.summary}</p>

                    {/* Preview Details */}
                    <div className="space-y-2 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Wird angewendet:
                        </div>

                        {/* Scope */}
                        <div className="flex items-center gap-2 text-sm">
                            <Shield size={14} className="text-slate-500" />
                            <span className="text-slate-600 dark:text-slate-300">
                                Sichtbarkeit: <strong>{SCOPE_LABELS[request.preview.scope]}</strong>
                            </span>
                        </div>

                        {/* Geo */}
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-slate-500" />
                            <span className="text-slate-600 dark:text-slate-300">
                                Standort: <strong>{GEO_LABELS[request.preview.geoMode]}</strong>
                            </span>
                        </div>

                        {/* Time Delay */}
                        {request.preview.timeDelay && request.preview.timeDelay > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock size={14} className="text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-300">
                                    Verzögerung: <strong>{request.preview.timeDelay}h</strong>
                                </span>
                            </div>
                        )}

                        {/* Participants */}
                        {request.preview.participants && request.preview.participants.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <Users size={14} className="text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-300">
                                    Teilnehmer: <strong>{request.preview.participants.length}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tier 3 Warning */}
                    {isTier3 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                <strong>Achtung:</strong> Diese Aktion kann nicht rückgängig gemacht werden und
                                hat rechtliche Auswirkungen.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => onConfirm(request.confirmToken)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${isTier3
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                    >
                        {isTier3 ? 'Ich verstehe, fortfahren' : 'Bestätigen'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
