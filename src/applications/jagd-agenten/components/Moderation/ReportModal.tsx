/**
 * ReportModal Component
 *
 * Modal for reporting problematic content.
 */

import { useState } from 'react';
import { Flag, X, AlertTriangle, Send } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportReason =
    | 'location_exposed'
    | 'illegal_content'
    | 'defamation'
    | 'harassment'
    | 'spam'
    | 'protected_species'
    | 'misleading'
    | 'other';

interface ReportModalProps {
    contentType: 'sighting' | 'story' | 'invite' | 'comment';
    contentId: string;
    contentPreview?: string;
    onSubmit: (reason: ReportReason, description: string) => Promise<void>;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Reason Options
// ---------------------------------------------------------------------------

const REASON_OPTIONS: { value: ReportReason; label: string; icon: string }[] = [
    { value: 'location_exposed', label: 'Standort zu genau / Sicherheitsrisiko', icon: '📍' },
    { value: 'illegal_content', label: 'Illegaler Inhalt', icon: '⚠️' },
    { value: 'defamation', label: 'Verleumdung / Rufschädigung', icon: '💬' },
    { value: 'harassment', label: 'Belästigung', icon: '🚫' },
    { value: 'spam', label: 'Spam / Werbung', icon: '📢' },
    { value: 'protected_species', label: 'Unbelegte Behauptung über geschützte Art', icon: '🐺' },
    { value: 'misleading', label: 'Irreführende Information', icon: '❓' },
    { value: 'other', label: 'Sonstiges', icon: '📋' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportModal({
    contentType,
    contentId: _contentId,
    contentPreview,
    onSubmit,
    onClose,
}: ReportModalProps) {
    const [reason, setReason] = useState<ReportReason | ''>('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const contentTypeLabels: Record<string, string> = {
        sighting: 'Sichtung',
        story: 'Strecken-Story',
        invite: 'Einladung',
        comment: 'Kommentar',
    };

    const handleSubmit = async () => {
        setError(null);

        if (!reason) {
            setError('Bitte Grund auswählen');
            return;
        }

        setSubmitting(true);

        try {
            await onSubmit(reason, description);
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (_err) {
            setError('Fehler beim Senden der Meldung');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="report-overlay">
                <div className="report-modal success">
                    <div className="success-content">
                        <div className="success-icon">✓</div>
                        <h3>Meldung eingegangen</h3>
                        <p>Vielen Dank. Wir prüfen den Inhalt.</p>
                    </div>
                </div>
                <style>{modalStyles}</style>
            </div>
        );
    }

    return (
        <div className="report-overlay">
            <div className="report-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-title">
                        <Flag className="w-5 h-5" />
                        <h3>{contentTypeLabels[contentType]} melden</h3>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content preview */}
                {contentPreview && (
                    <div className="content-preview">
                        <span className="preview-label">Gemeldeter Inhalt:</span>
                        <p>{contentPreview}</p>
                    </div>
                )}

                {/* Reason selection */}
                <div className="reason-section">
                    <label>Warum meldest du diesen Inhalt?</label>
                    <div className="reason-list">
                        {REASON_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`reason-option ${reason === opt.value ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="reason"
                                    value={opt.value}
                                    checked={reason === opt.value}
                                    onChange={() => setReason(opt.value)}
                                />
                                <span className="reason-icon">{opt.icon}</span>
                                <span className="reason-label">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="description-section">
                    <label>Weitere Details (optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Beschreibe das Problem genauer..."
                        rows={3}
                    />
                </div>

                {/* Info */}
                <div className="info-box">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                        Meldungen werden vertraulich behandelt. Der Inhalt wird bei mehreren
                        Meldungen automatisch ausgeblendet bis zur Prüfung.
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-box">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="modal-actions">
                    <button onClick={onClose} className="cancel-btn">
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !reason}
                        className="submit-btn"
                    >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Sende...' : 'Meldung senden'}
                    </button>
                </div>
            </div>

            <style>{modalStyles}</style>
        </div>
    );
}

const modalStyles = `
    .report-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    .report-modal {
        background: var(--bg-secondary, #1a1a2e);
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .report-modal.success {
        padding: 40px;
        text-align: center;
    }

    .success-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .success-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16, 185, 129, 0.2);
        border-radius: 50%;
        font-size: 2rem;
        color: #10b981;
    }

    .success-content h3 {
        margin: 0;
        color: var(--text-primary, #fff);
    }

    .success-content p {
        margin: 0;
        color: var(--text-secondary, #aaa);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color, #333);
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ef4444;
    }

    .header-title h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary, #fff);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #aaa);
        cursor: pointer;
        padding: 4px;
    }

    .content-preview {
        margin: 16px 20px;
        padding: 12px;
        background: var(--bg-tertiary, #2a2a4a);
        border-radius: 8px;
    }

    .preview-label {
        display: block;
        font-size: 0.7rem;
        color: var(--text-tertiary, #666);
        margin-bottom: 4px;
    }

    .content-preview p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary, #aaa);
        font-style: italic;
    }

    .reason-section,
    .description-section {
        padding: 0 20px;
        margin-bottom: 16px;
    }

    .reason-section label,
    .description-section label {
        display: block;
        margin-bottom: 10px;
        font-size: 0.875rem;
        color: var(--text-secondary, #aaa);
    }

    .reason-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .reason-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--bg-tertiary, #2a2a4a);
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reason-option:hover {
        border-color: var(--border-color, #444);
    }

    .reason-option.selected {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .reason-option input {
        display: none;
    }

    .reason-icon {
        font-size: 1rem;
    }

    .reason-label {
        font-size: 0.85rem;
        color: var(--text-primary, #fff);
    }

    .description-section textarea {
        width: 100%;
        padding: 10px 12px;
        background: var(--bg-tertiary, #2a2a4a);
        border: 1px solid var(--border-color, #333);
        border-radius: 8px;
        color: var(--text-primary, #fff);
        font-size: 0.9rem;
        resize: none;
    }

    .info-box {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0 20px 16px;
        padding: 10px 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        font-size: 0.75rem;
        color: #3b82f6;
    }

    .error-box {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 20px 16px;
        padding: 10px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 8px;
        color: #ef4444;
        font-size: 0.875rem;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid var(--border-color, #333);
    }

    .cancel-btn,
    .submit-btn {
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
        background: #ef4444;
        color: white;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
