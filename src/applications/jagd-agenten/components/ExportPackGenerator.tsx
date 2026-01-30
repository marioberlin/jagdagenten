/**
 * Export Pack Generator Component
 *
 * UI for generating hunting reports (Streckenliste, Abschussmeldung, etc.)
 * in PDF/CSV format for submission to German hunting authorities.
 */

import React, { useEffect, useState } from 'react';
import {
    FileDown,
    FileSpreadsheet,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Plus,
    Download,
    Loader2,
} from 'lucide-react';
import { useBureaucracyStore, type ExportPack } from '@/stores/useBureaucracyStore';

// ============================================================================
// Constants
// ============================================================================

const PACK_TYPE_CONFIG: Record<ExportPack['packType'], { label: string; description: string; icon: React.ReactNode }> = {
    streckenliste: {
        label: 'Streckenliste',
        description: 'Übersicht aller erlegten Wildstücke',
        icon: <FileText className="w-5 h-5 text-green-400" />,
    },
    abschussmeldung: {
        label: 'Abschussmeldung',
        description: 'Offizielle Meldung an die Jagdbehörde',
        icon: <FileDown className="w-5 h-5 text-blue-400" />,
    },
    jagdstatistik: {
        label: 'Jagdstatistik',
        description: 'Statistische Auswertung der Jagdsaison',
        icon: <FileSpreadsheet className="w-5 h-5 text-purple-400" />,
    },
    wildnachweisung: {
        label: 'Wildnachweisung',
        description: 'Nachweis über erlegtes Wild',
        icon: <FileText className="w-5 h-5 text-yellow-400" />,
    },
    other: {
        label: 'Sonstiges',
        description: 'Andere Exportformate',
        icon: <FileText className="w-5 h-5 text-gray-400" />,
    },
};

const BUNDESLAENDER = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen',
];

const STATUS_CONFIG: Record<ExportPack['status'], { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Entwurf', color: 'text-gray-400 bg-gray-500/10', icon: <Clock className="w-4 h-4" /> },
    generated: { label: 'Generiert', color: 'text-green-400 bg-green-500/10', icon: <CheckCircle2 className="w-4 h-4" /> },
    submitted: { label: 'Eingereicht', color: 'text-blue-400 bg-blue-500/10', icon: <CheckCircle2 className="w-4 h-4" /> },
};

// ============================================================================
// Export Pack Card
// ============================================================================

interface ExportPackCardProps {
    pack: ExportPack;
}

function ExportPackCard({ pack }: ExportPackCardProps) {
    const config = PACK_TYPE_CONFIG[pack.packType];
    const status = STATUS_CONFIG[pack.status];

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {config.icon}
                    <div>
                        <h3 className="font-medium text-white">{config.label}</h3>
                        <p className="text-xs text-white/60">{pack.bundesland || 'Alle Bundesländer'}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${status.color}`}>
                    {status.icon}
                    <span>{status.label}</span>
                </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                <Calendar className="w-4 h-4" />
                <span>Erstellt am {new Date(pack.createdAt).toLocaleDateString('de-DE')}</span>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-2">
                {pack.pdfUrl && (
                    <a
                        href={pack.pdfUrl}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm"
                    >
                        <Download className="w-4 h-4" />
                        PDF
                    </a>
                )}
                {pack.csvUrl && (
                    <a
                        href={pack.csvUrl}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-sm"
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </a>
                )}
                {!pack.pdfUrl && !pack.csvUrl && (
                    <span className="text-sm text-white/40">Keine Downloads verfügbar</span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Generate Modal
// ============================================================================

interface GenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (args: {
        packType: string;
        bundesland: string;
        dateRange: { from: string; to: string };
    }) => Promise<void>;
    isLoading: boolean;
}

function GenerateModal({ isOpen, onClose, onSubmit, isLoading }: GenerateModalProps) {
    const [packType, setPackType] = useState<ExportPack['packType']>('streckenliste');
    const [bundesland, setBundesland] = useState('Bayern');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Default to current hunting season (Apr 1 - Mar 31)
    useEffect(() => {
        const now = new Date();
        const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        setDateFrom(`${year}-04-01`);
        setDateTo(`${year + 1}-03-31`);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            packType,
            bundesland,
            dateRange: { from: dateFrom, to: dateTo },
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-2xl border border-white/10 p-6 w-full max-w-lg mx-4">
                <h2 className="text-xl font-semibold text-white mb-4">Export generieren</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Pack Type */}
                    <div>
                        <label className="block text-sm text-white/70 mb-2">Exporttyp</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(PACK_TYPE_CONFIG).map(([value, config]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setPackType(value as ExportPack['packType'])}
                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${packType === value
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {config.icon}
                                    <span className="text-sm text-white">{config.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bundesland */}
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Bundesland</label>
                        <select
                            value={bundesland}
                            onChange={(e) => setBundesland(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                        >
                            {BUNDESLAENDER.map((bl) => (
                                <option key={bl} value={bl}>{bl}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Von</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Bis</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-200">
                            Der Export wird basierend auf Ihren Jagdsitzungen im gewählten Zeitraum generiert.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generiere...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Generieren
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExportPackGenerator() {
    const { exportPacks, exportPacksLoading, exportPacksError, fetchExportPacks, generateExportPack } = useBureaucracyStore();
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchExportPacks();
    }, [fetchExportPacks]);

    const handleGenerate = async (args: {
        packType: string;
        bundesland: string;
        dateRange: { from: string; to: string };
    }) => {
        setGenerating(true);
        await generateExportPack(args);
        setGenerating(false);
    };

    // Group packs by status
    const generatedPacks = exportPacks.filter((p) => p.status === 'generated' || p.status === 'submitted');
    const draftPacks = exportPacks.filter((p) => p.status === 'draft');

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Export-Pakete</h1>
                    <p className="text-sm text-white/60">Streckenlisten, Abschussmeldungen und Statistiken generieren</p>
                </div>

                <button
                    onClick={() => setGenerateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Neuer Export</span>
                </button>
            </div>

            {/* Error State */}
            {exportPacksError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
                    Fehler beim Laden: {exportPacksError}
                </div>
            )}

            {/* Loading State */}
            {exportPacksLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Empty State */}
            {!exportPacksLoading && exportPacks.length === 0 && (
                <div className="text-center py-12 text-white/50">
                    <FileDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Exporte erstellt</p>
                    <p className="text-sm mt-1">Generieren Sie Ihre erste Streckenliste oder Abschussmeldung.</p>
                </div>
            )}

            {/* Generated Packs */}
            {generatedPacks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Fertige Exporte</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedPacks.map((pack) => (
                            <ExportPackCard key={pack.id} pack={pack} />
                        ))}
                    </div>
                </div>
            )}

            {/* Draft Packs */}
            {draftPacks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Entwürfe</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {draftPacks.map((pack) => (
                            <ExportPackCard key={pack.id} pack={pack} />
                        ))}
                    </div>
                </div>
            )}

            {/* Generate Modal */}
            <GenerateModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onSubmit={handleGenerate}
                isLoading={generating}
            />
        </div>
    );
}
