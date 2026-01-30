/**
 * Document Vault Component
 *
 * UI for managing hunting documents (Jagdscheine, WBK, insurance, permits).
 * Displays expiry warnings and allows upload/delete operations.
 */

import React, { useEffect, useState } from 'react';
import {
    FileText,
    Shield,
    AlertTriangle,
    Upload,
    Trash2,
    Calendar,
    Clock,
    Plus,
} from 'lucide-react';
import { useBureaucracyStore, type VaultDocument } from '@/stores/useBureaucracyStore';

// ============================================================================
// Document Type Icons
// ============================================================================

const DOC_TYPE_ICONS: Record<VaultDocument['docType'], React.ReactNode> = {
    jagdschein: <FileText className="w-5 h-5 text-green-400" />,
    wbk: <Shield className="w-5 h-5 text-blue-400" />,
    insurance: <Shield className="w-5 h-5 text-purple-400" />,
    permit: <FileText className="w-5 h-5 text-yellow-400" />,
    other: <FileText className="w-5 h-5 text-gray-400" />,
};

const DOC_TYPE_LABELS: Record<VaultDocument['docType'], string> = {
    jagdschein: 'Jagdschein',
    wbk: 'Waffenbesitzkarte',
    insurance: 'Jagdhaftpflicht',
    permit: 'Sondergenehmigung',
    other: 'Sonstiges',
};

// ============================================================================
// Expiry Helper
// ============================================================================

function getExpiryStatus(expiresAt?: string): { label: string; color: string; urgent: boolean } {
    if (!expiresAt) return { label: 'Kein Ablaufdatum', color: 'text-gray-400', urgent: false };

    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
        return { label: 'Abgelaufen', color: 'text-red-500', urgent: true };
    }
    if (daysUntil <= 30) {
        return { label: `${daysUntil} Tage verbleibend`, color: 'text-orange-400', urgent: true };
    }
    if (daysUntil <= 90) {
        return { label: `${daysUntil} Tage verbleibend`, color: 'text-yellow-400', urgent: false };
    }
    return { label: `Gültig bis ${expiry.toLocaleDateString('de-DE')}`, color: 'text-green-400', urgent: false };
}

// ============================================================================
// Document Card
// ============================================================================

interface DocumentCardProps {
    doc: VaultDocument;
    onDelete: (id: string) => void;
}

function DocumentCard({ doc, onDelete }: DocumentCardProps) {
    const expiry = getExpiryStatus(doc.expiresAt);

    return (
        <div className="relative bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all group">
            {/* Urgent badge */}
            {expiry.urgent && (
                <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-white" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {DOC_TYPE_ICONS[doc.docType]}
                    <div>
                        <h3 className="font-medium text-white">{doc.name}</h3>
                        <p className="text-xs text-white/60">{DOC_TYPE_LABELS[doc.docType]}</p>
                    </div>
                </div>

                <button
                    onClick={() => onDelete(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>

            {/* Expiry */}
            <div className={`flex items-center gap-2 text-sm ${expiry.color}`}>
                {expiry.urgent ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                <span>{expiry.label}</span>
            </div>

            {/* Created date */}
            <p className="text-xs text-white/40 mt-2">
                Hochgeladen am {new Date(doc.createdAt).toLocaleDateString('de-DE')}
            </p>
        </div>
    );
}

// ============================================================================
// Upload Modal
// ============================================================================

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (doc: Omit<VaultDocument, 'id' | 'createdAt'>) => void;
}

function UploadModal({ isOpen, onClose, onSubmit }: UploadModalProps) {
    const [name, setName] = useState('');
    const [docType, setDocType] = useState<VaultDocument['docType']>('jagdschein');
    const [expiresAt, setExpiresAt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            docType,
            expiresAt: expiresAt || undefined,
            metadata: {},
        });
        setName('');
        setDocType('jagdschein');
        setExpiresAt('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold text-white mb-4">Dokument hochladen</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                            placeholder="z.B. Jagdschein Bayern 2024"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/70 mb-1">Dokumenttyp</label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value as VaultDocument['docType'])}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                        >
                            {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-white/70 mb-1">Ablaufdatum (optional)</label>
                        <input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Hochladen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentVault() {
    const { documents, documentsLoading, documentsError, fetchDocuments, uploadDocument, deleteDocument } = useBureaucracyStore();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Sort documents: expired/expiring soon first
    const sortedDocuments = [...documents].sort((a, b) => {
        const aExpiry = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const bExpiry = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return aExpiry - bExpiry;
    });

    const urgentCount = documents.filter((d: VaultDocument) => getExpiryStatus(d.expiresAt).urgent).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dokumenten-Tresor</h1>
                    <p className="text-sm text-white/60">Verwalten Sie Ihre Jagddokumente sicher und zentral</p>
                </div>

                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Dokument hinzufügen</span>
                </button>
            </div>

            {/* Urgent Alert */}
            {urgentCount > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                    <p className="text-orange-200">
                        <strong>{urgentCount}</strong> Dokument{urgentCount > 1 ? 'e' : ''} benötigt{urgentCount > 1 ? 'en' : ''} Ihre Aufmerksamkeit
                    </p>
                </div>
            )}

            {/* Error State */}
            {documentsError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
                    Fehler beim Laden: {documentsError}
                </div>
            )}

            {/* Loading State */}
            {documentsLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Documents Grid */}
            {!documentsLoading && documents.length === 0 && (
                <div className="text-center py-12 text-white/50">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Dokumente hochgeladen</p>
                    <p className="text-sm mt-1">Laden Sie Ihren Jagdschein, WBK oder andere Dokumente hoch.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDocuments.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onDelete={deleteDocument} />
                ))}
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSubmit={uploadDocument}
            />
        </div>
    );
}
