/**
 * InviteEditor Component
 *
 * Editor for creating/editing Drückjagd invitations.
 */

import { useState } from 'react';
import {
    Save,
    X,
    Calendar,
    Clock,
    MapPin,
    Users,
    Target,
    Shield,
    AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InviteType = 'drueckjagd' | 'ansitz' | 'treibjagd' | 'lockjagd' | 'pirsch';
type RequiredRole = 'schuetze' | 'treiber' | 'hundefuehrer' | 'standaufsicht' | 'helfer';

interface InviteData {
    inviteType: InviteType;
    title: string;
    description: string;
    bundesland: string;
    region: string;
    eventDate: string;
    eventTimeStart: string;
    eventTimeEnd?: string;
    requiredRoles: RequiredRole[];
    maxParticipants: number;
    rulesRequired: boolean;
    equipmentNotes?: string;
    contactEmail?: string;
}

interface InviteEditorProps {
    initialData?: Partial<InviteData>;
    onSave: (data: InviteData) => Promise<void>;
    onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const INVITE_TYPES: { id: InviteType; label: string; icon: string }[] = [
    { id: 'drueckjagd', label: 'Drückjagd', icon: '🎯' },
    { id: 'ansitz', label: 'Gemeinschaftsansitz', icon: '🌙' },
    { id: 'treibjagd', label: 'Treibjagd', icon: '🚶' },
    { id: 'lockjagd', label: 'Lockjagd', icon: '🦆' },
    { id: 'pirsch', label: 'Pirschgang', icon: '🌲' },
];

const ROLE_OPTIONS: { id: RequiredRole; label: string }[] = [
    { id: 'schuetze', label: 'Schütze' },
    { id: 'treiber', label: 'Treiber' },
    { id: 'hundefuehrer', label: 'Hundeführer' },
    { id: 'standaufsicht', label: 'Standaufsicht' },
    { id: 'helfer', label: 'Helfer' },
];

const BUNDESLAENDER = [
    'Bayern', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Niedersachsen',
    'Hessen', 'Brandenburg', 'Sachsen', 'Thüringen', 'Sachsen-Anhalt',
    'Mecklenburg-Vorpommern', 'Rheinland-Pfalz', 'Schleswig-Holstein', 'Saarland',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InviteEditor({
    initialData = {},
    onSave,
    onCancel,
}: InviteEditorProps) {
    const [data, setData] = useState<InviteData>({
        inviteType: initialData.inviteType || 'drueckjagd',
        title: initialData.title || '',
        description: initialData.description || '',
        bundesland: initialData.bundesland || '',
        region: initialData.region || '',
        eventDate: initialData.eventDate || '',
        eventTimeStart: initialData.eventTimeStart || '',
        eventTimeEnd: initialData.eventTimeEnd || '',
        requiredRoles: initialData.requiredRoles || [],
        maxParticipants: initialData.maxParticipants || 10,
        rulesRequired: initialData.rulesRequired ?? true,
        equipmentNotes: initialData.equipmentNotes || '',
        contactEmail: initialData.contactEmail || '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleRole = (role: RequiredRole) => {
        const newRoles = data.requiredRoles.includes(role)
            ? data.requiredRoles.filter((r) => r !== role)
            : [...data.requiredRoles, role];
        setData({ ...data, requiredRoles: newRoles });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!data.title.trim()) {
            setError('Titel erforderlich');
            return;
        }
        if (!data.bundesland) {
            setError('Bundesland erforderlich');
            return;
        }
        if (!data.eventDate) {
            setError('Datum erforderlich');
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

    return (
        <div className="invite-editor-overlay">
            <div className="invite-editor">
                {/* Header */}
                <div className="editor-header">
                    <h3>
                        <Target className="w-5 h-5" />
                        {initialData.title ? 'Einladung bearbeiten' : 'Neue Einladung erstellen'}
                    </h3>
                    <button onClick={onCancel} className="close-btn">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Type selection */}
                    <div className="form-group">
                        <label>Jagdart</label>
                        <div className="type-selector">
                            {INVITE_TYPES.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={`type-btn ${data.inviteType === t.id ? 'active' : ''}`}
                                    onClick={() => setData({ ...data, inviteType: t.id })}
                                >
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label>Titel *</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                            placeholder="z.B. Drückjagd im Staatsforst"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Beschreibung</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData({ ...data, description: e.target.value })}
                            placeholder="Details zur Jagd, Anfahrt, Treffpunkt..."
                            rows={3}
                        />
                    </div>

                    {/* Location */}
                    <div className="form-row">
                        <div className="form-group half">
                            <label><MapPin className="w-4 h-4" /> Bundesland *</label>
                            <select
                                value={data.bundesland}
                                onChange={(e) => setData({ ...data, bundesland: e.target.value })}
                            >
                                <option value="">Auswählen...</option>
                                {BUNDESLAENDER.map((bl) => (
                                    <option key={bl} value={bl}>{bl}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half">
                            <label><MapPin className="w-4 h-4" /> Region</label>
                            <input
                                type="text"
                                value={data.region}
                                onChange={(e) => setData({ ...data, region: e.target.value })}
                                placeholder="z.B. Spessart"
                            />
                        </div>
                    </div>

                    {/* Date/Time */}
                    <div className="form-row">
                        <div className="form-group half">
                            <label><Calendar className="w-4 h-4" /> Datum *</label>
                            <input
                                type="date"
                                value={data.eventDate}
                                onChange={(e) => setData({ ...data, eventDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group quarter">
                            <label><Clock className="w-4 h-4" /> Beginn</label>
                            <input
                                type="time"
                                value={data.eventTimeStart}
                                onChange={(e) => setData({ ...data, eventTimeStart: e.target.value })}
                            />
                        </div>
                        <div className="form-group quarter">
                            <label><Clock className="w-4 h-4" /> Ende</label>
                            <input
                                type="time"
                                value={data.eventTimeEnd || ''}
                                onChange={(e) => setData({ ...data, eventTimeEnd: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Roles needed */}
                    <div className="form-group">
                        <label>Gesuchte Rollen</label>
                        <div className="role-chips">
                            {ROLE_OPTIONS.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    className={`role-chip ${data.requiredRoles.includes(r.id) ? 'active' : ''}`}
                                    onClick={() => toggleRole(r.id)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max participants */}
                    <div className="form-group">
                        <label><Users className="w-4 h-4" /> Max. Teilnehmer</label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={data.maxParticipants}
                            onChange={(e) => setData({ ...data, maxParticipants: Number(e.target.value) })}
                        />
                    </div>

                    {/* Safety checkbox */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={data.rulesRequired}
                                onChange={(e) => setData({ ...data, rulesRequired: e.target.checked })}
                            />
                            <Shield className="w-4 h-4" />
                            <span>Sicherheitsregeln-Bestätigung erforderlich</span>
                        </label>
                    </div>

                    {/* Equipment notes */}
                    <div className="form-group">
                        <label>Ausrüstungshinweise</label>
                        <textarea
                            value={data.equipmentNotes || ''}
                            onChange={(e) => setData({ ...data, equipmentNotes: e.target.value })}
                            placeholder="z.B. Signalkleidung Pflicht, Hochsitze vorhanden..."
                            rows={2}
                        />
                    </div>

                    {/* Contact */}
                    <div className="form-group">
                        <label>Kontakt-Email</label>
                        <input
                            type="email"
                            value={data.contactEmail || ''}
                            onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
                            placeholder="Für Rückfragen"
                        />
                    </div>

                    {/* Warning */}
                    <div className="safety-notice">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Einladungen werden vor Veröffentlichung geprüft.</span>
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
                            {submitting ? 'Speichern...' : 'Einladung speichern'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .invite-editor-overlay {
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

                .invite-editor {
                    background: var(--bg-secondary, #1a1a2e);
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
                    border-bottom: 1px solid var(--border-color, #333);
                }

                .editor-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    color: var(--text-primary, #fff);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary, #aaa);
                    cursor: pointer;
                }

                form { padding: 20px; }

                .form-group { margin-bottom: 16px; }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 6px;
                    font-size: 0.875rem;
                    color: var(--text-secondary, #aaa);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    font-size: 0.9rem;
                }

                .form-row { display: flex; gap: 12px; }
                .form-group.half { flex: 1; }
                .form-group.quarter { flex: 0.5; }

                .type-selector {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .type-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid transparent;
                    border-radius: 8px;
                    color: var(--text-secondary, #aaa);
                    cursor: pointer;
                }

                .type-btn.active {
                    background: rgba(16, 185, 129, 0.15);
                    border-color: var(--color-primary, #10b981);
                    color: var(--color-primary, #10b981);
                }

                .role-chips { display: flex; flex-wrap: wrap; gap: 8px; }

                .role-chip {
                    padding: 6px 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid transparent;
                    border-radius: 16px;
                    color: var(--text-secondary, #aaa);
                    font-size: 0.85rem;
                    cursor: pointer;
                }

                .role-chip.active {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: #3b82f6;
                    color: #3b82f6;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-label input { width: auto; }

                .safety-notice {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 8px;
                    color: #f59e0b;
                    font-size: 0.8rem;
                    margin-bottom: 16px;
                }

                .form-error {
                    padding: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 8px;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }

                .form-actions { display: flex; gap: 12px; }

                .cancel-btn, .save-btn {
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
                    background: var(--bg-tertiary, #2a2a4a);
                    color: var(--text-secondary, #aaa);
                }

                .save-btn {
                    background: var(--color-primary, #10b981);
                    color: white;
                }

                .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
