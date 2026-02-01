/**
 * LessonsLearnedForm Component
 *
 * Form for capturing hunting lessons learned.
 */

import React, { useState } from 'react';
import { Wind, Compass, Target, Search, Wrench, Save } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonsLearned {
    windConditions?: string;
    approachDirection?: string;
    shotDistanceM?: number;
    afterSearchNotes?: string;
    equipmentNotes?: string;
}

interface LessonsLearnedFormProps {
    initialData?: LessonsLearned;
    onSave: (data: LessonsLearned) => void;
    onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Wind Direction Options
// ---------------------------------------------------------------------------

const WIND_OPTIONS = [
    { value: 'N', label: 'Nord' },
    { value: 'NO', label: 'Nordost' },
    { value: 'O', label: 'Ost' },
    { value: 'SO', label: 'Südost' },
    { value: 'S', label: 'Süd' },
    { value: 'SW', label: 'Südwest' },
    { value: 'W', label: 'West' },
    { value: 'NW', label: 'Nordwest' },
    { value: 'wechselnd', label: 'Wechselnd' },
    { value: 'windstill', label: 'Windstill' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LessonsLearnedForm({
    initialData = {},
    onSave,
    onCancel,
}: LessonsLearnedFormProps) {
    const [data, setData] = useState<LessonsLearned>(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form className="lessons-form" onSubmit={handleSubmit}>
            <h4 className="form-title">
                <span>💡</span> Lessons Learned
            </h4>
            <p className="form-subtitle">
                Teile deine Erfahrungen mit der Community (optional)
            </p>

            {/* Wind conditions */}
            <div className="form-group">
                <label>
                    <Wind className="w-4 h-4" />
                    Windverhältnisse
                </label>
                <select
                    value={data.windConditions || ''}
                    onChange={(e) => setData({ ...data, windConditions: e.target.value })}
                >
                    <option value="">Nicht angegeben</option>
                    {WIND_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Approach direction */}
            <div className="form-group">
                <label>
                    <Compass className="w-4 h-4" />
                    Angehrichtung
                </label>
                <select
                    value={data.approachDirection || ''}
                    onChange={(e) => setData({ ...data, approachDirection: e.target.value })}
                >
                    <option value="">Nicht angegeben</option>
                    {WIND_OPTIONS.slice(0, 8).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            Von {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Shot distance */}
            <div className="form-group">
                <label>
                    <Target className="w-4 h-4" />
                    Schussentfernung (Meter)
                </label>
                <input
                    type="number"
                    min={0}
                    max={500}
                    value={data.shotDistanceM ?? ''}
                    onChange={(e) =>
                        setData({
                            ...data,
                            shotDistanceM: e.target.value ? Number(e.target.value) : undefined,
                        })
                    }
                    placeholder="z.B. 80"
                />
            </div>

            {/* After-search notes */}
            <div className="form-group">
                <label>
                    <Search className="w-4 h-4" />
                    Nachsuche-Notizen
                </label>
                <textarea
                    value={data.afterSearchNotes || ''}
                    onChange={(e) => setData({ ...data, afterSearchNotes: e.target.value })}
                    placeholder="Wie verlief die Nachsuche? Was war hilfreich?"
                    rows={2}
                />
            </div>

            {/* Equipment notes */}
            <div className="form-group">
                <label>
                    <Wrench className="w-4 h-4" />
                    Ausrüstungs-Tipps
                </label>
                <textarea
                    value={data.equipmentNotes || ''}
                    onChange={(e) => setData({ ...data, equipmentNotes: e.target.value })}
                    placeholder="Was hat gut funktioniert? Was würdest du anders machen?"
                    rows={2}
                />
            </div>

            {/* Actions */}
            <div className="form-actions">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="cancel-btn">
                        Abbrechen
                    </button>
                )}
                <button type="submit" className="save-btn">
                    <Save className="w-4 h-4" />
                    Speichern
                </button>
            </div>

            <style>{`
                .lessons-form {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                }

                .form-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 0 4px;
                    color: #f59e0b;
                    font-size: 1rem;
                }

                .form-subtitle {
                    margin: 0 0 16px;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .form-group {
                    margin-bottom: 14px;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 6px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
                }

                .cancel-btn,
                .save-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px;
                    border-radius: 8px;
                    border: none;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .cancel-btn {
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                }

                .save-btn {
                    background: #f59e0b;
                    color: white;
                }
            `}</style>
        </form>
    );
}
