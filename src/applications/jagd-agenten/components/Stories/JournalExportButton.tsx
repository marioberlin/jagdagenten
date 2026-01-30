/**
 * JournalExportButton Component
 *
 * Button to export hunting journal/stories as PDF or CSV.
 */

import { useState } from 'react';
import { Download, FileText, Table, Loader } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportFormat = 'pdf' | 'csv';

interface JournalExportButtonProps {
    userId: string;
    dateRange?: { start: string; end: string };
    onExport?: (format: ExportFormat) => Promise<Blob>;
    disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JournalExportButton({
    userId,
    dateRange,
    onExport,
    disabled = false,
}: JournalExportButtonProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [exporting, setExporting] = useState<ExportFormat | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async (format: ExportFormat) => {
        setExporting(format);
        setError(null);

        try {
            let blob: Blob;

            if (onExport) {
                blob = await onExport(format);
            } else {
                // Default API call
                const params = new URLSearchParams({ userId, format });
                if (dateRange) {
                    params.set('startDate', dateRange.start);
                    params.set('endDate', dateRange.end);
                }

                const response = await fetch(`/api/v1/jagd/stories/export?${params}`);
                if (!response.ok) {
                    throw new Error('Export fehlgeschlagen');
                }
                blob = await response.blob();
            }

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jagdbuch_${new Date().toISOString().slice(0, 10)}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setShowOptions(false);
        } catch (_err) {
            setError('Export fehlgeschlagen');
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="journal-export">
            <button
                onClick={() => setShowOptions(!showOptions)}
                disabled={disabled}
                className="export-trigger"
            >
                <Download className="w-4 h-4" />
                <span>Exportieren</span>
            </button>

            {showOptions && (
                <div className="export-options">
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={exporting !== null}
                        className="export-option"
                    >
                        {exporting === 'pdf' ? (
                            <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        <div className="option-text">
                            <span className="option-title">PDF</span>
                            <span className="option-desc">Druckfertiges Jagdbuch</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleExport('csv')}
                        disabled={exporting !== null}
                        className="export-option"
                    >
                        {exporting === 'csv' ? (
                            <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                            <Table className="w-4 h-4" />
                        )}
                        <div className="option-text">
                            <span className="option-title">CSV</span>
                            <span className="option-desc">Für Tabellenkalkulation</span>
                        </div>
                    </button>

                    {error && <div className="export-error">{error}</div>}
                </div>
            )}

            <style>{`
                .journal-export {
                    position: relative;
                }

                .export-trigger {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .export-trigger:hover:not(:disabled) {
                    background: var(--bg-secondary, #1a1a2e);
                    border-color: var(--color-primary, #10b981);
                }

                .export-trigger:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .export-options {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 200px;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 10px;
                    padding: 6px;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .export-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    cursor: pointer;
                    text-align: left;
                    transition: background 0.2s;
                }

                .export-option:hover:not(:disabled) {
                    background: var(--bg-tertiary, #2a2a4a);
                }

                .export-option:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .option-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .option-title {
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .option-desc {
                    font-size: 0.7rem;
                    color: var(--text-tertiary, #666);
                }

                .export-error {
                    padding: 8px 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 6px;
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 6px;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export type { ExportFormat };
