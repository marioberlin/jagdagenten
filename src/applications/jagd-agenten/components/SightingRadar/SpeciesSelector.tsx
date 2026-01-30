/**
 * SpeciesSelector Component
 *
 * Dropdown for selecting wildlife species with icons and sensitivity labels.
 */

import { Shield } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeciesSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SPECIES_OPTIONS = [
    { id: '', label: 'Art auswählen...', icon: '', protected: false },
    { id: 'wolf', label: 'Wolf', icon: '🐺', protected: true },
    { id: 'luchs', label: 'Luchs', icon: '🐱', protected: true },
    { id: 'wildkatze', label: 'Wildkatze', icon: '🐈', protected: true },
    { id: 'schwarzwild', label: 'Schwarzwild', icon: '🐗', protected: false },
    { id: 'rotwild', label: 'Rotwild', icon: '🦌', protected: false },
    { id: 'rehwild', label: 'Rehwild', icon: '🦌', protected: false },
    { id: 'damwild', label: 'Damwild', icon: '🦌', protected: false },
    { id: 'muffelwild', label: 'Muffelwild', icon: '🐏', protected: false },
    { id: 'rotwildwechsel', label: 'Rotwild-Wechsel', icon: '🦶', protected: false },
    { id: 'krankes_wild', label: 'Krankes/Verletztes Wild', icon: '⚠️', protected: false },
    { id: 'andere', label: 'Andere Beobachtung', icon: '👁️', protected: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeciesSelector({ value, onChange }: SpeciesSelectorProps) {
    const selected = SPECIES_OPTIONS.find((s) => s.id === value);

    return (
        <div className="species-selector">
            <div className="select-wrapper">
                <select value={value} onChange={(e) => onChange(e.target.value)}>
                    {SPECIES_OPTIONS.map((species) => (
                        <option key={species.id} value={species.id}>
                            {species.icon} {species.label}
                        </option>
                    ))}
                </select>
            </div>

            {selected?.protected && (
                <div className="protected-notice">
                    <Shield className="w-4 h-4" />
                    <span>Geschützte Art – erweiterte Verzögerung (72h) für Datenschutz</span>
                </div>
            )}

            <style>{`
                .species-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .select-wrapper select {
                    width: 100%;
                    padding: 12px 14px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    font-size: 1rem;
                    cursor: pointer;
                }

                .protected-notice {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: #f59e0b;
                }
            `}</style>
        </div>
    );
}
