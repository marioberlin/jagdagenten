/**
 * RulesAcknowledgement Component
 *
 * Safety rules acknowledgement form for Drückjagd.
 */

import { useState } from 'react';
import { Shield, AlertTriangle, Check, Phone, FileText } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RulesAcknowledgementProps {
    eventTitle: string;
    eventDate?: string;
    onAcknowledge: (data: { acknowledged: boolean; emergencyContact: string }) => void;
    onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Safety Rules
// ---------------------------------------------------------------------------

const SAFETY_RULES = [
    'Ich halte mich strikt an die Schussfreigaben des Jagdleiters',
    'Ich verlasse meinen Stand nicht vor dem offiziellen Anblasen',
    'Ich schieße nur in sichere Richtungen (kein Schuss auf der Linie)',
    'Ich trage durchgehend Warnweste/Signalkleidung',
    'Ich melde mich beim Jagdleiter vor Verlassen des Reviers ab',
    'Ich habe meine Jagdpapiere und Waffenbesitzkarte dabei',
    'Ich bin nüchtern und in der Lage, sicher zu jagen',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RulesAcknowledgement({
    eventTitle,
    eventDate,
    onAcknowledge,
    onCancel,
}: RulesAcknowledgementProps) {
    const [checkedRules, setCheckedRules] = useState<Set<number>>(new Set());
    const [emergencyContact, setEmergencyContact] = useState('');
    const [error, setError] = useState<string | null>(null);

    const allChecked = checkedRules.size === SAFETY_RULES.length;

    const toggleRule = (index: number) => {
        const newChecked = new Set(checkedRules);
        if (newChecked.has(index)) {
            newChecked.delete(index);
        } else {
            newChecked.add(index);
        }
        setCheckedRules(newChecked);
    };

    const handleSubmit = () => {
        setError(null);

        if (!allChecked) {
            setError('Bitte alle Regeln bestätigen');
            return;
        }

        if (!emergencyContact.trim()) {
            setError('Notfallkontakt erforderlich');
            return;
        }

        // Basic phone validation
        const phoneRegex = /^[\d\s\+\-\(\)]{8,}$/;
        if (!phoneRegex.test(emergencyContact.trim())) {
            setError('Bitte gültige Telefonnummer eingeben');
            return;
        }

        onAcknowledge({
            acknowledged: true,
            emergencyContact: emergencyContact.trim(),
        });
    };

    return (
        <div className="rules-form">
            {/* Header */}
            <div className="form-header">
                <Shield className="w-6 h-6" />
                <div>
                    <h3>Sicherheitsregeln</h3>
                    <p className="event-info">{eventTitle}{eventDate && ` • ${eventDate}`}</p>
                </div>
            </div>

            {/* Warning */}
            <div className="warning-box">
                <AlertTriangle className="w-4 h-4" />
                <span>
                    Diese Bestätigung ist rechtlich bindend und wird dokumentiert.
                </span>
            </div>

            {/* Rules checklist */}
            <div className="rules-list">
                <h4>
                    <FileText className="w-4 h-4" />
                    Ich bestätige:
                </h4>
                {SAFETY_RULES.map((rule, index) => (
                    <label key={index} className="rule-item">
                        <input
                            type="checkbox"
                            checked={checkedRules.has(index)}
                            onChange={() => toggleRule(index)}
                        />
                        <span className="checkbox-custom">
                            {checkedRules.has(index) && <Check className="w-3 h-3" />}
                        </span>
                        <span className="rule-text">{rule}</span>
                    </label>
                ))}
            </div>

            {/* Emergency contact */}
            <div className="emergency-section">
                <label>
                    <Phone className="w-4 h-4" />
                    Notfallkontakt (Telefon)
                </label>
                <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+49 ..."
                />
                <small>
                    Wird bei Unfällen an Rettungskräfte weitergegeben
                </small>
            </div>

            {/* Error */}
            {error && (
                <div className="error-box">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">
                    Abbrechen
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allChecked}
                    className="confirm-btn"
                >
                    <Shield className="w-4 h-4" />
                    Regeln bestätigen
                </button>
            </div>

            <style>{`
                .rules-form {
                    background: var(--glass-bg-regular);
                    border-radius: 16px;
                    padding: 20px;
                    max-width: 500px;
                }

                .form-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 16px;
                    color: #3b82f6;
                }

                .form-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--text-primary);
                }

                .event-info {
                    margin: 4px 0 0;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .warning-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: #f59e0b;
                    margin-bottom: 16px;
                }

                .rules-list h4 {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 0 0 12px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .rule-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--glass-border);
                    cursor: pointer;
                }

                .rule-item input {
                    display: none;
                }

                .checkbox-custom {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--glass-border);
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .rule-item input:checked + .checkbox-custom {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                .rule-text {
                    font-size: 0.875rem;
                    color: var(--text-primary);
                    line-height: 1.4;
                }

                .emergency-section {
                    margin-top: 16px;
                }

                .emergency-section label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .emergency-section input {
                    width: 100%;
                    padding: 12px;
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .emergency-section small {
                    display: block;
                    margin-top: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }

                .error-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 8px;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 16px;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                .cancel-btn,
                .confirm-btn {
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

                .confirm-btn {
                    background: #3b82f6;
                    color: white;
                }

                .confirm-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
