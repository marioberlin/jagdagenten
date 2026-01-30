/**
 * StreckenlisterGenerator
 *
 * UI component for generating state-specific Streckenliste (harvest reports).
 * Features:
 * - Bundesland selection with matching form fields
 * - Auto-fill from session data
 * - PDF download/email
 */

import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Mail,
    ChevronRight,
    Check,
    AlertCircle,
    Calendar,
    MapPin,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HarvestEntry {
    id: string;
    date: string;
    species: string;
    gender?: 'male' | 'female' | 'unknown';
    age?: string;
    weight?: number;
    location?: string;
    revier?: string;
}

interface StreckenlisteProps {
    harvests: HarvestEntry[];
    revierName?: string;
    onGenerate?: (pdfUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUNDESLAENDER = [
    { code: 'BY', name: 'Bayern' },
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'NI', name: 'Niedersachsen' },
    { code: 'NRW', name: 'Nordrhein-Westfalen' },
    { code: 'HE', name: 'Hessen' },
    { code: 'RP', name: 'Rheinland-Pfalz' },
    { code: 'SN', name: 'Sachsen' },
    { code: 'TH', name: 'Thüringen' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'ST', name: 'Sachsen-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'SL', name: 'Saarland' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'BE', name: 'Berlin' },
];

const SPECIES_LABELS: Record<string, string> = {
    rotwild: 'Rotwild',
    rehwild: 'Rehwild',
    damwild: 'Damwild',
    schwarzwild: 'Schwarzwild',
    muffelwild: 'Muffelwild',
    gamswild: 'Gamswild',
    hase: 'Feldhase',
    fasan: 'Fasan',
    wildente: 'Wildente',
    fuchs: 'Fuchs',
    dachs: 'Dachs',
    marder: 'Marder',
    waschbaer: 'Waschbär',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function StreckenlisteGenerator({
    harvests,
    revierName,
    onGenerate,
}: StreckenlisteProps) {
    const [bundesland, setBundesland] = useState<string>('');
    const [jagdjahr, setJagdjahr] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Calculate Jagdjahr (April 1 - March 31)
    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        // If before April, use previous year as start
        const startYear = month < 3 ? year - 1 : year;
        setJagdjahr(`${startYear}/${startYear + 1}`);
    }, []);

    // Group harvests by species
    const harvestSummary = harvests.reduce(
        (acc, h) => {
            const key = h.species || 'sonstiges';
            if (!acc[key]) acc[key] = { count: 0, male: 0, female: 0, unknown: 0 };
            acc[key].count++;
            if (h.gender === 'male') acc[key].male++;
            else if (h.gender === 'female') acc[key].female++;
            else acc[key].unknown++;
            return acc;
        },
        {} as Record<string, { count: number; male: number; female: number; unknown: number }>
    );

    const handleGenerate = async () => {
        if (!bundesland) {
            setError('Bitte wählen Sie ein Bundesland');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/jagd/streckenliste/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bundesland,
                    jagdjahr,
                    revierName,
                    harvests: harvests.map((h) => ({
                        date: h.date,
                        species: h.species,
                        gender: h.gender,
                        age: h.age,
                        weight: h.weight,
                        location: h.location,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('PDF-Generierung fehlgeschlagen');
            }

            const data = await response.json();
            setGeneratedUrl(data.pdfUrl);
            onGenerate?.(data.pdfUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (generatedUrl) {
            window.open(generatedUrl, '_blank');
        }
    };

    const handleEmail = async () => {
        if (!generatedUrl) return;

        try {
            await fetch('/api/v1/jagd/streckenliste/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfUrl: generatedUrl }),
            });
            // Show success feedback
        } catch {
            setError('E-Mail-Versand fehlgeschlagen');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <FileText size={20} className="text-amber-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        Streckenliste
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Jagdjahr {jagdjahr}
                    </p>
                </div>
            </div>

            {/* Bundesland Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Bundesland *
                </label>
                <select
                    value={bundesland}
                    onChange={(e) => setBundesland(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                >
                    <option value="">Bundesland wählen...</option>
                    {BUNDESLAENDER.map((bl) => (
                        <option key={bl.code} value={bl.code}>
                            {bl.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Revier Info */}
            {revierName && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                    <MapPin size={16} className="text-[var(--text-secondary)]" />
                    <span className="text-sm text-[var(--text-primary)]">{revierName}</span>
                </div>
            )}

            {/* Harvest Summary */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                    <Calendar size={14} />
                    Strecke ({harvests.length} Einträge)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(harvestSummary).map(([species, data]) => (
                        <div
                            key={species}
                            className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm"
                        >
                            <div className="font-medium text-[var(--text-primary)]">
                                {SPECIES_LABELS[species] || species}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                                {data.count} Stück
                                {data.male > 0 && ` (${data.male}♂`}
                                {data.female > 0 && ` ${data.female}♀`}
                                {(data.male > 0 || data.female > 0) && ')'}
                            </div>
                        </div>
                    ))}
                </div>
                {harvests.length === 0 && (
                    <p className="text-sm text-[var(--text-tertiary)] italic">
                        Keine Strecke für dieses Jagdjahr
                    </p>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                {!generatedUrl ? (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || harvests.length === 0}
                        className={`
                            w-full flex items-center justify-center gap-2 p-3 rounded-lg
                            font-medium transition-colors
                            ${isGenerating || harvests.length === 0
                                ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                            }
                        `}
                    >
                        {isGenerating ? (
                            <>Generiere PDF...</>
                        ) : (
                            <>
                                <FileText size={18} />
                                Streckenliste erstellen
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                ) : (
                    <>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 text-green-400 text-sm">
                            <Check size={16} />
                            PDF erfolgreich erstellt
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-hover)]"
                            >
                                <Download size={16} />
                                Download
                            </button>
                            <button
                                onClick={handleEmail}
                                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-hover)]"
                            >
                                <Mail size={16} />
                                Per E-Mail
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StreckenlisteGenerator;
