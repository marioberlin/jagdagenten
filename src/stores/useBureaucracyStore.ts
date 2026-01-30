/**
 * Bureaucracy Store
 *
 * Zustand store for document vault, export packs, and guest permits.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface VaultDocument {
    id: string;
    docType: 'jagdschein' | 'wbk' | 'insurance' | 'permit' | 'other';
    name: string;
    expiresAt?: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface ExportPack {
    id: string;
    packType: 'streckenliste' | 'abschussmeldung' | 'jagdstatistik' | 'wildnachweisung' | 'other';
    bundesland?: string;
    data: Record<string, unknown>;
    pdfUrl?: string;
    csvUrl?: string;
    status: 'draft' | 'generated' | 'submitted';
    createdAt: string;
}

export interface GuestPermit {
    id: string;
    guestName: string;
    validFrom: string;
    validUntil: string;
    revier?: string;
    conditions: Record<string, unknown>;
    pdfUrl?: string;
    createdAt: string;
}

interface BureaucracyState {
    // Document Vault
    documents: VaultDocument[];
    documentsLoading: boolean;
    documentsError: string | null;

    // Export Packs
    exportPacks: ExportPack[];
    exportPacksLoading: boolean;
    exportPacksError: string | null;

    // Guest Permits
    guestPermits: GuestPermit[];
    guestPermitsLoading: boolean;
    guestPermitsError: string | null;
}

interface BureaucracyActions {
    // Document Vault
    fetchDocuments: () => Promise<void>;
    uploadDocument: (doc: Omit<VaultDocument, 'id' | 'createdAt'>) => Promise<VaultDocument | null>;
    deleteDocument: (id: string) => Promise<boolean>;

    // Export Packs
    fetchExportPacks: () => Promise<void>;
    generateExportPack: (args: {
        packType: string;
        bundesland: string;
        dateRange: { from: string; to: string };
        sessionIds?: string[];
    }) => Promise<ExportPack | null>;

    // Guest Permits
    fetchGuestPermits: () => Promise<void>;
    createGuestPermit: (args: {
        guestName: string;
        validFrom: string;
        validUntil: string;
        revier?: string;
        conditions?: Record<string, unknown>;
    }) => Promise<GuestPermit | null>;
}

export type BureaucracyStore = BureaucracyState & BureaucracyActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: BureaucracyState = {
    documents: [],
    documentsLoading: false,
    documentsError: null,

    exportPacks: [],
    exportPacksLoading: false,
    exportPacksError: null,

    guestPermits: [],
    guestPermitsLoading: false,
    guestPermitsError: null,
};

// ============================================================================
// Store
// ============================================================================

export const useBureaucracyStore = create<BureaucracyStore>()((set) => ({
    ...initialState,

    // =========================================================================
    // Document Vault Actions
    // =========================================================================

    fetchDocuments: async () => {
        set({ documentsLoading: true, documentsError: null });
        try {
            const response = await fetch('/api/v1/jagd/vault');
            const data = await response.json();
            if (data.error) {
                set({ documentsError: data.error, documentsLoading: false });
            } else {
                set({ documents: data.documents || [], documentsLoading: false });
            }
        } catch (err) {
            set({ documentsError: (err as Error).message, documentsLoading: false });
        }
    },

    uploadDocument: async (doc) => {
        try {
            const response = await fetch('/api/v1/jagd/vault', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doc),
            });
            const data = await response.json();
            if (data.error) {
                set({ documentsError: data.error });
                return null;
            }
            // Add to local state
            set((state) => ({
                documents: [data.document, ...state.documents],
                documentsError: null,
            }));
            return data.document;
        } catch (err) {
            set({ documentsError: (err as Error).message });
            return null;
        }
    },

    deleteDocument: async (id) => {
        try {
            const response = await fetch(`/api/v1/jagd/vault/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.error) {
                set({ documentsError: data.error });
                return false;
            }
            // Remove from local state
            set((state) => ({
                documents: state.documents.filter((d) => d.id !== id),
                documentsError: null,
            }));
            return true;
        } catch (err) {
            set({ documentsError: (err as Error).message });
            return false;
        }
    },

    // =========================================================================
    // Export Pack Actions
    // =========================================================================

    fetchExportPacks: async () => {
        set({ exportPacksLoading: true, exportPacksError: null });
        try {
            const response = await fetch('/api/v1/jagd/export-packs');
            const data = await response.json();
            if (data.error) {
                set({ exportPacksError: data.error, exportPacksLoading: false });
            } else {
                set({ exportPacks: data.exportPacks || [], exportPacksLoading: false });
            }
        } catch (err) {
            set({ exportPacksError: (err as Error).message, exportPacksLoading: false });
        }
    },

    generateExportPack: async (args) => {
        set({ exportPacksLoading: true, exportPacksError: null });
        try {
            const response = await fetch('/api/v1/jagd/export-packs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args),
            });
            const data = await response.json();
            if (data.error) {
                set({ exportPacksError: data.error, exportPacksLoading: false });
                return null;
            }
            // Add to local state
            set((state) => ({
                exportPacks: [data.exportPack, ...state.exportPacks],
                exportPacksLoading: false,
                exportPacksError: null,
            }));
            return data.exportPack;
        } catch (err) {
            set({ exportPacksError: (err as Error).message, exportPacksLoading: false });
            return null;
        }
    },

    // =========================================================================
    // Guest Permit Actions
    // =========================================================================

    fetchGuestPermits: async () => {
        set({ guestPermitsLoading: true, guestPermitsError: null });
        try {
            const response = await fetch('/api/v1/jagd/guest-permits');
            const data = await response.json();
            if (data.error) {
                set({ guestPermitsError: data.error, guestPermitsLoading: false });
            } else {
                set({ guestPermits: data.guestPermits || [], guestPermitsLoading: false });
            }
        } catch (err) {
            set({ guestPermitsError: (err as Error).message, guestPermitsLoading: false });
        }
    },

    createGuestPermit: async (args) => {
        set({ guestPermitsLoading: true, guestPermitsError: null });
        try {
            const response = await fetch('/api/v1/jagd/guest-permits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args),
            });
            const data = await response.json();
            if (data.error) {
                set({ guestPermitsError: data.error, guestPermitsLoading: false });
                return null;
            }
            // Add to local state
            set((state) => ({
                guestPermits: [data.guestPermit, ...state.guestPermits],
                guestPermitsLoading: false,
                guestPermitsError: null,
            }));
            return data.guestPermit;
        } catch (err) {
            set({ guestPermitsError: (err as Error).message, guestPermitsLoading: false });
            return null;
        }
    },
}));
