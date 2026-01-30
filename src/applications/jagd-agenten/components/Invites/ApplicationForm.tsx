/**
 * ApplicationForm Component
 *
 * Form for applying to a Drückjagd invitation.
 */

import { useState } from 'react';
import { Send, User, Phone, Target, Dog, Shield, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicantRole = 'schuetze' | 'treiber' | 'hundefuehrer' | 'standaufsicht' | 'helfer';

interface ApplicationData {
    role: ApplicantRole;
    experience: string;
    hasInsurance: boolean;
    hasDog: boolean;
    dogBreed?: string;
    emergencyContact: string;
    notes?: string;
}

interface ApplicationFormProps {
    inviteTitle: string;
    inviteDate: string;
    availableRoles: ApplicantRole[];
    onSubmit: (data: ApplicationData) => Promise<void>;
    onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<ApplicantRole, string> = {
    schuetze: 'Schütze',
    treiber: 'Treiber',
    hundefuehrer: 'Hundeführer',
    standaufsicht: 'Standaufsicht',
    helfer: 'Helfer',
};

const EXPERIENCE_LEVELS = [
    { id: 'anfaenger', label: 'Anfänger (< 2 Jahre)' },
    { id: 'erfahren', label: 'Erfahren (2-5 Jahre)' },
    { id: 'routiniert', label: 'Routiniert (5-10 Jahre)' },
    { id: 'experte', label: 'Experte (> 10 Jahre)' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApplicationForm({
    inviteTitle,
    inviteDate,
    availableRoles,
    onSubmit,
    onCancel,
}: ApplicationFormProps) {
    const [data, setData] = useState<ApplicationData>({
        role: availableRoles[0] || 'schuetze',
        experience: '',
        hasInsurance: false,
        hasDog: false,
        dogBreed: '',
        emergencyContact: '',
        notes: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!data.experience) {
            setError('Bitte Erfahrungslevel angeben');
            return;
        }
        if (!data.hasInsurance) {
            setError('Jagdhaftpflichtversicherung erforderlich');
            return;
        }
        if (!data.emergencyContact.trim()) {
            setError('Notfallkontakt erforderlich');
            return;
        }
        if (data.hasDog && !data.dogBreed?.trim()) {
            setError('Bitte Hunderasse angeben');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(data);
        } catch {
            setError('Fehler beim Senden der Bewerbung');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="application-form-overlay">
            <div className="application-form">
                {/* Header */}
                <div className="form-header">
                    <div>
                        <h3>Bewerbung</h3>
                        <p className="invite-info">{inviteTitle} • {inviteDate}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role selection */}
                    <div className="form-group">
                        <label><Target className="w-4 h-4" /> Rolle *</label>
                        <div className="role-options">
                            {availableRoles.map((role) => (
                                <label key={role} className="role-option">
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role}
                                        checked={data.role === role}
                                        onChange={() => setData({ ...data, role })}
                                    />
                                    <span className="role-label">{ROLE_LABELS[role]}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="form-group">
                        <label><User className="w-4 h-4" /> Erfahrung *</label>
                        <select
                            value={data.experience}
                            onChange={(e) => setData({ ...data, experience: e.target.value })}
                        >
                            <option value="">Bitte auswählen...</option>
                            {EXPERIENCE_LEVELS.map((lvl) => (
                                <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Insurance */}
                    <div className="form-group">
                        <label className="checkbox-label important">
                            <input
                                type="checkbox"
                                checked={data.hasInsurance}
                                onChange={(e) => setData({ ...data, hasInsurance: e.target.checked })}
                            />
                            <Shield className="w-4 h-4" />
                            <span>Ich habe eine gültige Jagdhaftpflichtversicherung *</span>
                        </label>
                    </div>

                    {/* Dog section */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={data.hasDog}
                                onChange={(e) => setData({ ...data, hasDog: e.target.checked })}
                            />
                            <Dog className="w-4 h-4" />
                            <span>Ich bringe einen Jagdhund mit</span>
                        </label>
                    </div>

                    {data.hasDog && (
                        <div className="form-group indent">
                            <label>Hunderasse / Ausbildung</label>
                            <input
                                type="text"
                                value={data.dogBreed || ''}
                                onChange={(e) => setData({ ...data, dogBreed: e.target.value })}
                                placeholder="z.B. Bayerischer Gebirgsschweißhund, BGS-Prüfung"
                            />
                        </div>
                    )}

                    {/* Emergency contact */}
                    <div className="form-group">
                        <label><Phone className="w-4 h-4" /> Notfallkontakt (Telefon) *</label>
                        <input
                            type="tel"
                            value={data.emergencyContact}
                            onChange={(e) => setData({ ...data, emergencyContact: e.target.value })}
                            placeholder="+49 ..."
                        />
                        <small>Wird bei Unfällen an Rettungskräfte weitergegeben</small>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label>Anmerkungen</label>
                        <textarea
                            value={data.notes || ''}
                            onChange={(e) => setData({ ...data, notes: e.target.value })}
                            placeholder="Sonstiges, was der Jagdleiter wissen sollte..."
                            rows={2}
                        />
                    </div>

                    {/* Info */}
                    <div className="info-notice">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                            Mit dem Absenden bestätigst du, dass du die Sicherheitsregeln
                            am Jagdtag persönlich anerkennen wirst.
                        </span>
                    </div>

                    {/* Error */}
                    {error && <div className="form-error">{error}</div>}

                    {/* Actions */}
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-btn">
                            Abbrechen
                        </button>
                        <button type="submit" disabled={submitting} className="submit-btn">
                            <Send className="w-4 h-4" />
                            {submitting ? 'Sende...' : 'Bewerbung absenden'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .application-form-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .application-form {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 480px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .form-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color, #333);
                }

                .form-header h3 {
                    margin: 0;
                    color: var(--text-primary, #fff);
                }

                .invite-info {
                    margin: 4px 0 0;
                    font-size: 0.8rem;
                    color: var(--text-secondary, #aaa);
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

                .form-group small {
                    display: block;
                    margin-top: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }

                .form-group.indent { margin-left: 28px; }

                .role-options { display: flex; flex-wrap: wrap; gap: 8px; }

                .role-option {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border-radius: 8px;
                    cursor: pointer;
                }

                .role-option input { display: none; }

                .role-option:has(input:checked) {
                    background: rgba(59, 130, 246, 0.15);
                    outline: 1px solid #3b82f6;
                }

                .role-label {
                    font-size: 0.85rem;
                    color: var(--text-primary, #fff);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-label input { width: auto; }

                .checkbox-label.important { color: #f59e0b; }

                .info-notice {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 8px;
                    color: #3b82f6;
                    font-size: 0.75rem;
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

                .cancel-btn, .submit-btn {
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

                .submit-btn {
                    background: #3b82f6;
                    color: white;
                }

                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
