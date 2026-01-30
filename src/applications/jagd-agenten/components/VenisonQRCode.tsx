/**
 * VenisonQRCode
 *
 * Generates printable QR codes for venison bags with food safety tracking.
 * Features:
 * - QR code with harvest data
 * - Printable label format
 * - Cooling chain tracking
 */

import { useState } from 'react';
import {
    QrCode,
    Printer,
    Download,
    Thermometer,
    Calendar,
    MapPin,
    Scale,
    Check,
    Plus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VenisonData {
    id: string;
    harvestId: string;
    harvestDate: string;
    species: string;
    weight: number;
    location: string;
    revierName?: string;
    hunterName?: string;
    coolingChain: CoolingEvent[];
    createdAt: string;
}

interface CoolingEvent {
    id: string;
    timestamp: string;
    type: 'harvest' | 'transport' | 'storage' | 'butcher' | 'sale';
    temperature?: number;
    location?: string;
    notes?: string;
}

interface VenisonQRCodeProps {
    harvest: {
        id: string;
        date: string;
        species: string;
        weight?: number;
        location?: string;
    };
    revierName?: string;
    hunterName?: string;
    onGenerate?: (venisonId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIES_LABELS: Record<string, string> = {
    rotwild: 'Rotwild',
    rehwild: 'Rehwild',
    damwild: 'Damwild',
    schwarzwild: 'Schwarzwild',
    muffelwild: 'Muffelwild',
    hase: 'Feldhase',
};

const COOLING_EVENT_LABELS: Record<string, string> = {
    harvest: 'Erlegung',
    transport: 'Transport',
    storage: 'Kühlung',
    butcher: 'Metzger',
    sale: 'Verkauf',
};

// ---------------------------------------------------------------------------
// QR Code Generator (SVG-based)
// ---------------------------------------------------------------------------

function generateQRCodeSVG(data: string, size: number = 150): string {
    // Simple QR placeholder - in production use qrcode library
    // This creates a data URL that encodes the venison lookup URL
    const encoded = encodeURIComponent(data);

    // For demo, return a placeholder pattern
    // Real implementation would use: import QRCode from 'qrcode'
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
            <rect fill="white" width="100" height="100"/>
            <text x="50" y="45" text-anchor="middle" font-size="8" fill="#333">SCAN QR</text>
            <text x="50" y="55" text-anchor="middle" font-size="6" fill="#666">${encoded.substring(0, 10)}...</text>
            <rect x="10" y="10" width="20" height="20" fill="#333"/>
            <rect x="70" y="10" width="20" height="20" fill="#333"/>
            <rect x="10" y="70" width="20" height="20" fill="#333"/>
            <rect x="35" y="35" width="30" height="30" stroke="#333" stroke-width="2" fill="none"/>
        </svg>
    `;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function VenisonQRCode({
    harvest,
    revierName,
    hunterName,
    onGenerate,
}: VenisonQRCodeProps) {
    const [venisonData, setVenisonData] = useState<VenisonData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCoolingForm, setShowCoolingForm] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CoolingEvent>>({
        type: 'storage',
        temperature: undefined,
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/v1/jagd/venison/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    harvestId: harvest.id,
                    harvestDate: harvest.date,
                    species: harvest.species,
                    weight: harvest.weight,
                    location: harvest.location,
                    revierName,
                    hunterName,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setVenisonData(data.venison);
                onGenerate?.(data.venison.id);
            }
        } catch (error) {
            console.error('Failed to generate venison record:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddCoolingEvent = async () => {
        if (!venisonData || !newEvent.type) return;

        try {
            const response = await fetch(`/api/v1/jagd/venison/${venisonData.id}/chain`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newEvent.type,
                    temperature: newEvent.temperature,
                    location: newEvent.location,
                    notes: newEvent.notes,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setVenisonData(data.venison);
                setShowCoolingForm(false);
                setNewEvent({ type: 'storage', temperature: undefined });
            }
        } catch (error) {
            console.error('Failed to add cooling event:', error);
        }
    };

    const handlePrint = () => {
        if (!venisonData) return;
        window.open(`/api/v1/jagd/venison/${venisonData.id}/label`, '_blank');
    };

    const qrUrl = venisonData
        ? `${window.location.origin}/venison/${venisonData.id}`
        : '';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <QrCode size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        Wildbret-Etikett
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        QR-Code für Rückverfolgbarkeit
                    </p>
                </div>
            </div>

            {/* Harvest Info */}
            <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--text-tertiary)]" />
                        <span className="text-[var(--text-primary)]">
                            {new Date(harvest.date).toLocaleDateString('de-DE')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)]">
                            {SPECIES_LABELS[harvest.species] || harvest.species}
                        </span>
                    </div>
                    {harvest.weight && (
                        <div className="flex items-center gap-2">
                            <Scale size={14} className="text-[var(--text-tertiary)]" />
                            <span className="text-[var(--text-primary)]">{harvest.weight} kg</span>
                        </div>
                    )}
                    {harvest.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[var(--text-tertiary)]" />
                            <span className="text-[var(--text-primary)]">{harvest.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code Display or Generate Button */}
            {!venisonData ? (
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full p-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        'Erstelle Etikett...'
                    ) : (
                        <>
                            <QrCode size={18} />
                            QR-Code erstellen
                        </>
                    )}
                </button>
            ) : (
                <>
                    {/* QR Code */}
                    <div className="flex flex-col items-center p-4 rounded-lg bg-white">
                        <div
                            dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(qrUrl) }}
                        />
                        <p className="mt-2 text-xs text-gray-500 font-mono">
                            {venisonData.id.substring(0, 8)}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-hover)] flex items-center justify-center gap-2"
                        >
                            <Printer size={16} />
                            Drucken
                        </button>
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = `data:image/svg+xml,${encodeURIComponent(generateQRCodeSVG(qrUrl, 300))}`;
                                link.download = `wildbret-${venisonData.id.substring(0, 8)}.svg`;
                                link.click();
                            }}
                            className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-hover)] flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Speichern
                        </button>
                    </div>

                    {/* Cooling Chain */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <Thermometer size={14} />
                                Kühlkette
                            </h4>
                            <button
                                onClick={() => setShowCoolingForm(true)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                                <Plus size={12} />
                                Eintrag
                            </button>
                        </div>

                        {venisonData.coolingChain.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] italic">
                                Keine Kühlketten-Einträge
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {venisonData.coolingChain.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-2 rounded bg-[var(--glass-surface)] text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Check size={12} className="text-emerald-400" />
                                            <span className="text-[var(--text-primary)]">
                                                {COOLING_EVENT_LABELS[event.type]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                                            {event.temperature && (
                                                <span>{event.temperature}°C</span>
                                            )}
                                            <span>
                                                {new Date(event.timestamp).toLocaleTimeString('de-DE', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Cooling Event Form */}
                        {showCoolingForm && (
                            <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-2">
                                <select
                                    value={newEvent.type}
                                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CoolingEvent['type'] })}
                                    className="w-full p-2 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                >
                                    {Object.entries(COOLING_EVENT_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Temperatur (°C)"
                                    value={newEvent.temperature || ''}
                                    onChange={(e) => setNewEvent({ ...newEvent, temperature: parseFloat(e.target.value) })}
                                    className="w-full p-2 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)]"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCoolingForm(false)}
                                        className="flex-1 p-2 rounded text-sm text-[var(--text-secondary)]"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={handleAddCoolingEvent}
                                        className="flex-1 p-2 rounded bg-emerald-500/20 text-emerald-400 text-sm"
                                    >
                                        Hinzufügen
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default VenisonQRCode;
