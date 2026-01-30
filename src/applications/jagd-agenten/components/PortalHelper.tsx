/**
 * PortalHelper
 *
 * UX component that generates formatted copy/paste packs for state hunting portals.
 * Simplifies entering Streckenmeldung data into official web forms.
 */

import { useState } from 'react';
import { Copy, Check, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HarvestData {
    date: string;
    time?: string;
    species: string;
    gender?: 'männlich' | 'weiblich' | 'unbekannt';
    ageClass?: 'Kalb' | 'Überläufer' | 'Frischling' | 'Jährling' | 'mehrjährig' | 'unbekannt';
    weight?: number;
    weaponType?: 'Büchse' | 'Flinte' | 'Kombinierte';
    caliber?: string;
    revierName: string;
    revierNumber?: string;
    hunterName: string;
    hunterLicenseNumber?: string;
    location?: string;
    notes?: string;
}

interface PortalConfig {
    name: string;
    state: string;
    url: string;
    fields: string[];
}

interface PortalHelperProps {
    harvest: HarvestData;
    state: string;
    className?: string;
}

// ---------------------------------------------------------------------------
// Portal Configurations
// ---------------------------------------------------------------------------

const PORTAL_CONFIGS: Record<string, PortalConfig> = {
    'bayern': {
        name: 'Wildtierportal Bayern',
        state: 'Bayern',
        url: 'https://www.wildtierportal.bayern.de',
        fields: ['Erlegungsdatum', 'Wildart', 'Geschlecht', 'Alter', 'Aufbruchgewicht', 'Erleger', 'Revier'],
    },
    'nrw': {
        name: 'Streckenmeldung NRW',
        state: 'Nordrhein-Westfalen',
        url: 'https://www.streckenmeldung.nrw.de',
        fields: ['Datum', 'Uhrzeit', 'Wildart', 'Geschlecht', 'Gewicht', 'Waffe', 'Kaliber', 'Jäger', 'Revier-Nr.'],
    },
    'niedersachsen': {
        name: 'Wildtiererfassung Niedersachsen',
        state: 'Niedersachsen',
        url: 'https://www.wildtiererfassung.niedersachsen.de',
        fields: ['Erlegungsdatum', 'Wildart', 'Geschlecht', 'Altersklasse', 'Gewicht', 'Revier', 'Erleger'],
    },
    'bw': {
        name: 'Wildtiermonitoring BW',
        state: 'Baden-Württemberg',
        url: 'https://www.wildtiermonitoring-bw.de',
        fields: ['Datum', 'Art', 'Geschlecht', 'Alter', 'Gewicht', 'Ort', 'Erleger'],
    },
    'hessen': {
        name: 'Jagdstatistik Hessen',
        state: 'Hessen',
        url: 'https://www.jagdstatistik.hessen.de',
        fields: ['Erlegungsdatum', 'Wildart', 'Geschlecht', 'Altersklasse', 'Gewicht', 'Revier', 'Jäger'],
    },
};

// ---------------------------------------------------------------------------
// Copy Pack Generator
// ---------------------------------------------------------------------------

function generateCopyPack(harvest: HarvestData, _config: PortalConfig): { label: string; value: string }[] {
    const pack: { label: string; value: string }[] = [];

    // Date
    const date = new Date(harvest.date);
    pack.push({
        label: 'Erlegungsdatum',
        value: date.toLocaleDateString('de-DE'),
    });

    // Time
    if (harvest.time) {
        pack.push({
            label: 'Uhrzeit',
            value: harvest.time,
        });
    }

    // Species
    const speciesMap: Record<string, string> = {
        'rotwild': 'Rotwild (Cervus elaphus)',
        'rehwild': 'Rehwild (Capreolus capreolus)',
        'damwild': 'Damwild (Dama dama)',
        'schwarzwild': 'Schwarzwild (Sus scrofa)',
        'muffelwild': 'Muffelwild (Ovis gmelini)',
        'sikawild': 'Sikawild (Cervus nippon)',
    };
    pack.push({
        label: 'Wildart',
        value: speciesMap[harvest.species] || harvest.species,
    });

    // Gender
    if (harvest.gender) {
        pack.push({
            label: 'Geschlecht',
            value: harvest.gender,
        });
    }

    // Age
    if (harvest.ageClass) {
        pack.push({
            label: 'Altersklasse',
            value: harvest.ageClass,
        });
    }

    // Weight
    if (harvest.weight) {
        pack.push({
            label: 'Aufbruchgewicht (kg)',
            value: `${harvest.weight}`,
        });
    }

    // Weapon
    if (harvest.weaponType) {
        pack.push({
            label: 'Waffe',
            value: harvest.weaponType,
        });
    }

    // Caliber
    if (harvest.caliber) {
        pack.push({
            label: 'Kaliber',
            value: harvest.caliber,
        });
    }

    // Revier
    pack.push({
        label: 'Revier',
        value: harvest.revierName,
    });

    if (harvest.revierNumber) {
        pack.push({
            label: 'Revier-Nr.',
            value: harvest.revierNumber,
        });
    }

    // Hunter
    pack.push({
        label: 'Erleger',
        value: harvest.hunterName,
    });

    if (harvest.hunterLicenseNumber) {
        pack.push({
            label: 'Jagdschein-Nr.',
            value: harvest.hunterLicenseNumber,
        });
    }

    // Location
    if (harvest.location) {
        pack.push({
            label: 'Erlegungsort',
            value: harvest.location,
        });
    }

    return pack;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PortalHelper({ harvest, state, className = '' }: PortalHelperProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const stateKey = state.toLowerCase().replace(/[^a-z]/g, '');
    const config = PORTAL_CONFIGS[stateKey] || PORTAL_CONFIGS['bayern'];
    const copyPack = generateCopyPack(harvest, config);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        }
    };

    const copyAll = async () => {
        const allText = copyPack.map(item => `${item.label}: ${item.value}`).join('\n');
        await copyToClipboard(allText, 'all');
    };

    return (
        <div className={`rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-blue-400" />
                        <h3 className="font-semibold text-[var(--text-primary)]">Portal-Assistent</h3>
                    </div>
                    <a
                        href={config.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                    >
                        {config.name}
                        <ExternalLink size={12} />
                    </a>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Daten einzeln oder als Pack kopieren
                </p>
            </div>

            {/* Copy All Button */}
            <div className="p-4 border-b border-[var(--glass-border)]">
                <button
                    onClick={copyAll}
                    className="w-full py-3 rounded-lg bg-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                >
                    {copied === 'all' ? (
                        <>
                            <Check size={18} />
                            Kopiert!
                        </>
                    ) : (
                        <>
                            <Copy size={18} />
                            Alle Daten kopieren
                        </>
                    )}
                </button>
            </div>

            {/* Expandable Fields */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-3 flex items-center justify-between text-sm text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]"
            >
                <span>Einzelne Felder ({copyPack.length})</span>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded && (
                <div className="p-4 pt-0 space-y-2">
                    {copyPack.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between p-2 rounded-lg bg-[var(--glass-surface-hover)]"
                        >
                            <div className="flex-1">
                                <div className="text-xs text-[var(--text-tertiary)]">{item.label}</div>
                                <div className="text-sm text-[var(--text-primary)]">{item.value}</div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(item.value, item.label)}
                                className="p-2 rounded hover:bg-[var(--glass-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                                {copied === item.label ? (
                                    <Check size={16} className="text-emerald-400" />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="p-3 bg-[var(--glass-surface-hover)] text-xs text-[var(--text-tertiary)] border-t border-[var(--glass-border)]">
                💡 Öffnen Sie das {config.name} und fügen Sie die Daten in die entsprechenden Felder ein
            </div>
        </div>
    );
}

export default PortalHelper;
