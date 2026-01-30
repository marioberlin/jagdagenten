/**
 * Offline Store
 *
 * IndexedDB-backed store for offline-first hunt data persistence.
 * Uses Zustand for reactive state + idb for IndexedDB operations.
 */

import { create } from 'zustand';
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

// ============================================================================
// IndexedDB Schema
// ============================================================================

interface JagdDB extends DBSchema {
    sessions: {
        key: string;
        value: {
            id: string;
            sessionType: string;
            startTime: string;
            endTime?: string;
            location?: { lat: number; lng: number };
            notes?: string;
            synced: boolean;
            createdAt: string;
            updatedAt: string;
        };
        indexes: { 'by-synced': number; 'by-date': string };
    };
    events: {
        key: string;
        value: {
            id: string;
            sessionId: string;
            eventType: string;
            timestamp: string;
            data: Record<string, unknown>;
            synced: boolean;
        };
        indexes: { 'by-session': string; 'by-synced': number };
    };
    journal: {
        key: string;
        value: {
            id: string;
            date: string;
            content: string;
            tags: string[];
            attachments: string[];
            synced: boolean;
            createdAt: string;
            updatedAt: string;
        };
        indexes: { 'by-date': string; 'by-synced': number };
    };
    syncQueue: {
        key: string;
        value: {
            id: string;
            operation: 'create' | 'update' | 'delete';
            store: 'sessions' | 'events' | 'journal';
            entityId: string;
            payload: unknown;
            createdAt: string;
            retries: number;
        };
    };
}

const DB_NAME = 'jagd-agenten-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JagdDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<JagdDB>> {
    if (!dbPromise) {
        dbPromise = openDB<JagdDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Sessions store
                const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
                sessionsStore.createIndex('by-synced', 'synced');
                sessionsStore.createIndex('by-date', 'startTime');

                // Events store
                const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
                eventsStore.createIndex('by-session', 'sessionId');
                eventsStore.createIndex('by-synced', 'synced');

                // Journal store
                const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
                journalStore.createIndex('by-date', 'date');
                journalStore.createIndex('by-synced', 'synced');

                // Sync queue
                db.createObjectStore('syncQueue', { keyPath: 'id' });
            },
        });
    }
    return dbPromise;
}

// ============================================================================
// Types
// ============================================================================

interface OfflineState {
    isOnline: boolean;
    pendingSyncCount: number;
    lastSyncTime: string | null;
    syncInProgress: boolean;
}

interface OfflineActions {
    setOnline: (online: boolean) => void;

    // Sessions
    saveSession: (session: JagdDB['sessions']['value']) => Promise<void>;
    getSessions: () => Promise<JagdDB['sessions']['value'][]>;
    getSession: (id: string) => Promise<JagdDB['sessions']['value'] | undefined>;

    // Events
    saveEvent: (event: JagdDB['events']['value']) => Promise<void>;
    getSessionEvents: (sessionId: string) => Promise<JagdDB['events']['value'][]>;

    // Journal
    saveJournalEntry: (entry: JagdDB['journal']['value']) => Promise<void>;
    getJournalEntries: () => Promise<JagdDB['journal']['value'][]>;

    // Sync
    queueForSync: (operation: JagdDB['syncQueue']['value']) => Promise<void>;
    processQueue: () => Promise<void>;
    refreshPendingCount: () => Promise<void>;
}

export type OfflineStore = OfflineState & OfflineActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: OfflineState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingSyncCount: 0,
    lastSyncTime: null,
    syncInProgress: false,
};

// ============================================================================
// Store
// ============================================================================

export const useOfflineStore = create<OfflineStore>()((set, get) => ({
    ...initialState,

    setOnline: (online) => {
        set({ isOnline: online });
        // Auto-sync when coming back online
        if (online && get().pendingSyncCount > 0) {
            get().processQueue();
        }
    },

    // Sessions
    saveSession: async (session) => {
        const db = await getDB();
        await db.put('sessions', session);
        if (!session.synced) {
            await get().queueForSync({
                id: crypto.randomUUID(),
                operation: 'create',
                store: 'sessions',
                entityId: session.id,
                payload: session,
                createdAt: new Date().toISOString(),
                retries: 0,
            });
        }
    },

    getSessions: async () => {
        const db = await getDB();
        return db.getAllFromIndex('sessions', 'by-date');
    },

    getSession: async (id) => {
        const db = await getDB();
        return db.get('sessions', id);
    },

    // Events
    saveEvent: async (event) => {
        const db = await getDB();
        await db.put('events', event);
        if (!event.synced) {
            await get().queueForSync({
                id: crypto.randomUUID(),
                operation: 'create',
                store: 'events',
                entityId: event.id,
                payload: event,
                createdAt: new Date().toISOString(),
                retries: 0,
            });
        }
    },

    getSessionEvents: async (sessionId) => {
        const db = await getDB();
        return db.getAllFromIndex('events', 'by-session', sessionId);
    },

    // Journal
    saveJournalEntry: async (entry) => {
        const db = await getDB();
        await db.put('journal', entry);
        if (!entry.synced) {
            await get().queueForSync({
                id: crypto.randomUUID(),
                operation: 'create',
                store: 'journal',
                entityId: entry.id,
                payload: entry,
                createdAt: new Date().toISOString(),
                retries: 0,
            });
        }
    },

    getJournalEntries: async () => {
        const db = await getDB();
        return db.getAllFromIndex('journal', 'by-date');
    },

    // Sync Queue
    queueForSync: async (operation) => {
        const db = await getDB();
        await db.put('syncQueue', operation);
        await get().refreshPendingCount();
    },

    refreshPendingCount: async () => {
        const db = await getDB();
        const count = await db.count('syncQueue');
        set({ pendingSyncCount: count });
    },

    processQueue: async () => {
        const state = get();
        if (state.syncInProgress || !state.isOnline) return;

        set({ syncInProgress: true });

        try {
            const db = await getDB();
            const queue = await db.getAll('syncQueue');

            for (const item of queue) {
                try {
                    // Attempt to sync with server
                    const response = await fetch(`/api/v1/jagd/${item.store}`, {
                        method: item.operation === 'delete' ? 'DELETE' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload),
                    });

                    if (response.ok) {
                        // Mark entity as synced
                        const entityStore = item.store as keyof Pick<JagdDB, 'sessions' | 'events' | 'journal'>;
                        const entity = await db.get(entityStore, item.entityId);
                        if (entity) {
                            await db.put(entityStore, { ...entity, synced: true });
                        }
                        // Remove from queue
                        await db.delete('syncQueue', item.id);
                    } else {
                        // Increment retry count
                        await db.put('syncQueue', { ...item, retries: item.retries + 1 });
                    }
                } catch {
                    // Network error, leave in queue
                    await db.put('syncQueue', { ...item, retries: item.retries + 1 });
                }
            }

            set({ lastSyncTime: new Date().toISOString() });
            await get().refreshPendingCount();
        } finally {
            set({ syncInProgress: false });
        }
    },
}));

// ============================================================================
// Network Status Listener
// ============================================================================

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useOfflineStore.getState().setOnline(true);
    });
    window.addEventListener('offline', () => {
        useOfflineStore.getState().setOnline(false);
    });

    // Initialize pending count
    useOfflineStore.getState().refreshPendingCount();
}
