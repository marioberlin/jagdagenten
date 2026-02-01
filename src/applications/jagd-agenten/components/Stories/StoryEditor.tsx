/**
 * StoryEditor Component
 *
 * Full editor for creating/editing Strecke stories.
 */

import { useState } from 'react';
import {
    Save,
    X,
    Image,
    MapPin,
    Calendar,
    Scale,
    FileText,
    Lightbulb,
} from 'lucide-react';
import LessonsLearnedForm from './LessonsLearnedForm';

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

interface StoryData {
    title: string;
    summary: string;
    fullContent: string;
    species?: string;
    weightKg?: number;
    coarseArea?: string;
    dateWindow?: string;
    photoUrls: string[];
    lessonsLearned?: LessonsLearned;
    isPrivate: boolean;
}

interface StoryEditorProps {
    initialData?: Partial<StoryData>;
    onSave: (data: StoryData) => Promise<void>;
    onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Species Options
// ---------------------------------------------------------------------------

const SPECIES_OPTIONS = [
    { id: '', label: 'Art auswählen (optional)' },
    { id: 'schwarzwild', label: '🐗 Schwarzwild' },
    { id: 'rotwild', label: '🦌 Rotwild' },
    { id: 'rehwild', label: '🦌 Rehwild' },
    { id: 'damwild', label: '🦌 Damwild' },
    { id: 'muffelwild', label: '🐏 Muffelwild' },
    { id: 'fuchs', label: '🦊 Fuchs' },
    { id: 'andere', label: '🎯 Andere' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryEditor({
    initialData = {},
    onSave,
    onCancel,
}: StoryEditorProps) {
    const [data, setData] = useState<StoryData>({
        title: initialData.title || '',
        summary: initialData.summary || '',
        fullContent: initialData.fullContent || '',
        species: initialData.species || '',
        weightKg: initialData.weightKg,
        coarseArea: initialData.coarseArea || '',
        dateWindow: initialData.dateWindow || '',
        photoUrls: initialData.photoUrls || [],
        lessonsLearned: initialData.lessonsLearned,
        isPrivate: initialData.isPrivate ?? false,
    });

    const [showLessons, setShowLessons] = useState(!!initialData.lessonsLearned);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!data.title.trim()) {
            setError('Titel erforderlich');
            return;
        }
        if (!data.summary.trim()) {
            setError('Zusammenfassung erforderlich');
            return;
        }

        setSubmitting(true);
        try {
            await onSave(data);
        } catch {
            setError('Fehler beim Speichern');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLessonsSave = (lessons: LessonsLearned) => {
        setData({ ...data, lessonsLearned: lessons });
    };

    return (
        <div className="story-editor-overlay">
            <div className="story-editor">
                {/* Header */}
                <div className="editor-header">
                    <h3>
                        <FileText className="w-5 h-5" />
                        {initialData.title ? 'Story bearbeiten' : 'Neue Story erstellen'}
                    </h3>
                    <button onClick={onCancel} className="close-btn">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="form-group">
                        <label>Titel *</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                            placeholder="z.B. Mein erster Keiler"
                            maxLength={100}
                        />
                    </div>

                    {/* Summary */}
                    <div className="form-group">
                        <label>Kurzbeschreibung *</label>
                        <textarea
                            value={data.summary}
                            onChange={(e) => setData({ ...data, summary: e.target.value })}
                            placeholder="Was macht diese Jagd besonders?"
                            rows={2}
                            maxLength={300}
                        />
                    </div>

                    {/* Full content */}
                    <div className="form-group">
                        <label>Vollständiger Bericht</label>
                        <textarea
                            value={data.fullContent}
                            onChange={(e) => setData({ ...data, fullContent: e.target.value })}
                            placeholder="Erzähle die ganze Geschichte..."
                            rows={6}
                        />
                    </div>

                    {/* Meta row */}
                    <div className="form-row">
                        <div className="form-group half">
                            <label><Scale className="w-4 h-4" /> Wildart</label>
                            <select
                                value={data.species || ''}
                                onChange={(e) => setData({ ...data, species: e.target.value })}
                            >
                                {SPECIES_OPTIONS.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half">
                            <label><Scale className="w-4 h-4" /> Gewicht (kg)</label>
                            <input
                                type="number"
                                min={0}
                                max={500}
                                value={data.weightKg ?? ''}
                                onChange={(e) => setData({
                                    ...data,
                                    weightKg: e.target.value ? Number(e.target.value) : undefined,
                                })}
                                placeholder="z.B. 85"
                            />
                        </div>
                    </div>

                    {/* Location/Date row */}
                    <div className="form-row">
                        <div className="form-group half">
                            <label><MapPin className="w-4 h-4" /> Region (grob)</label>
                            <input
                                type="text"
                                value={data.coarseArea}
                                onChange={(e) => setData({ ...data, coarseArea: e.target.value })}
                                placeholder="z.B. Bayerischer Wald"
                            />
                        </div>
                        <div className="form-group half">
                            <label><Calendar className="w-4 h-4" /> Zeitraum</label>
                            <input
                                type="text"
                                value={data.dateWindow}
                                onChange={(e) => setData({ ...data, dateWindow: e.target.value })}
                                placeholder="z.B. November 2025"
                            />
                        </div>
                    </div>

                    {/* Photos placeholder */}
                    <div className="form-group">
                        <label><Image className="w-4 h-4" /> Fotos</label>
                        <div className="photo-upload-placeholder">
                            <Image className="w-8 h-8" />
                            <span>Fotos hinzufügen (demnächst)</span>
                        </div>
                    </div>

                    {/* Privacy toggle */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={data.isPrivate}
                                onChange={(e) => setData({ ...data, isPrivate: e.target.checked })}
                            />
                            <span>Nur für mein Jagdbuch (nicht öffentlich teilen)</span>
                        </label>
                    </div>

                    {/* Lessons Learned section */}
                    <div className="lessons-section">
                        {!showLessons ? (
                            <button
                                type="button"
                                onClick={() => setShowLessons(true)}
                                className="add-lessons-btn"
                            >
                                <Lightbulb className="w-4 h-4" />
                                Lessons Learned hinzufügen
                            </button>
                        ) : (
                            <LessonsLearnedForm
                                initialData={data.lessonsLearned}
                                onSave={handleLessonsSave}
                                onCancel={() => setShowLessons(false)}
                            />
                        )}
                    </div>

                    {/* Error */}
                    {error && <div className="form-error">{error}</div>}

                    {/* Actions */}
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-btn">
                            Abbrechen
                        </button>
                        <button type="submit" disabled={submitting} className="save-btn">
                            <Save className="w-4 h-4" />
                            {submitting ? 'Speichern...' : 'Story speichern'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .story-editor-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    overflow-y: auto;
                }

                .story-editor {
                    background: var(--glass-bg-regular);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--glass-border);
                }

                .editor-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    color: var(--text-primary);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }

                form {
                    padding: 20px;
                }

                .form-group {
                    margin-bottom: 16px;
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
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .form-row {
                    display: flex;
                    gap: 12px;
                }

                .form-group.half {
                    flex: 1;
                }

                .photo-upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 24px;
                    background: var(--glass-surface);
                    border: 2px dashed var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-tertiary);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-label input {
                    width: auto;
                }

                .lessons-section {
                    margin: 20px 0;
                }

                .add-lessons-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px dashed rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    color: #f59e0b;
                    cursor: pointer;
                    width: 100%;
                    justify-content: center;
                }

                .form-error {
                    padding: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 8px;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                }

                .cancel-btn,
                .save-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 12px;
                    border-radius: 8px;
                    border: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                }

                .cancel-btn {
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                }

                .save-btn {
                    background: var(--glass-accent, #10b981);
                    color: white;
                }

                .save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
