/**
 * Quartermaster Store
 *
 * Zustand store for equipment inventory and ammo management.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface GearItem {
    id: string;
    itemType: 'weapon' | 'optic' | 'ammo' | 'clothing' | 'accessory' | 'other';
    name: string;
    status: 'ready' | 'maintenance_due' | 'in_repair' | 'retired';
    caliber?: string;
    serialEncrypted?: string;
    optic?: string;
    notes?: string;
    maintenanceDueAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AmmoInventory {
    caliber: string;
    totalUsed: number;
}

export interface AmmoLog {
    id: string;
    equipmentId?: string;
    caliber: string;
    roundsUsed: number;
    sessionId?: string;
    notes?: string;
    loggedAt: string;
}

interface QuartermasterState {
    // Equipment
    gear: GearItem[];
    gearLoading: boolean;
    gearError: string | null;

    // Ammo
    ammoInventory: AmmoInventory[];
    ammoLoading: boolean;
    ammoError: string | null;
}

interface QuartermasterActions {
    // Equipment
    fetchGear: () => Promise<void>;
    addGear: (item: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) => Promise<GearItem | null>;
    updateGear: (id: string, updates: Partial<GearItem>) => Promise<GearItem | null>;
    deleteGear: (id: string) => Promise<boolean>;

    // Ammo
    fetchAmmoInventory: () => Promise<void>;
    logAmmoUsage: (args: {
        equipmentId?: string;
        caliber: string;
        roundsUsed: number;
        sessionId?: string;
        notes?: string;
    }) => Promise<AmmoLog | null>;
}

export type QuartermasterStore = QuartermasterState & QuartermasterActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: QuartermasterState = {
    gear: [],
    gearLoading: false,
    gearError: null,

    ammoInventory: [],
    ammoLoading: false,
    ammoError: null,
};

// ============================================================================
// Store
// ============================================================================

export const useQuartermasterStore = create<QuartermasterStore>()((set, get) => ({
    ...initialState,

    // =========================================================================
    // Equipment Actions
    // =========================================================================

    fetchGear: async () => {
        set({ gearLoading: true, gearError: null });
        try {
            const response = await fetch('/api/v1/jagd/gear');
            const data = await response.json();
            if (data.error) {
                set({ gearError: data.error, gearLoading: false });
            } else {
                set({ gear: data.gear || [], gearLoading: false });
            }
        } catch (err) {
            set({ gearError: (err as Error).message, gearLoading: false });
        }
    },

    addGear: async (item) => {
        try {
            const response = await fetch('/api/v1/jagd/gear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            const data = await response.json();
            if (data.error) {
                set({ gearError: data.error });
                return null;
            }
            // Add to local state
            set((state) => ({
                gear: [data.gear, ...state.gear],
                gearError: null,
            }));
            return data.gear;
        } catch (err) {
            set({ gearError: (err as Error).message });
            return null;
        }
    },

    updateGear: async (id, updates) => {
        try {
            const response = await fetch(`/api/v1/jagd/gear/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await response.json();
            if (data.error) {
                set({ gearError: data.error });
                return null;
            }
            // Update in local state
            set((state) => ({
                gear: state.gear.map((g) => (g.id === id ? data.gear : g)),
                gearError: null,
            }));
            return data.gear;
        } catch (err) {
            set({ gearError: (err as Error).message });
            return null;
        }
    },

    deleteGear: async (id) => {
        try {
            const response = await fetch(`/api/v1/jagd/gear/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.error) {
                set({ gearError: data.error });
                return false;
            }
            // Remove from local state
            set((state) => ({
                gear: state.gear.filter((g) => g.id !== id),
                gearError: null,
            }));
            return true;
        } catch (err) {
            set({ gearError: (err as Error).message });
            return false;
        }
    },

    // =========================================================================
    // Ammo Actions
    // =========================================================================

    fetchAmmoInventory: async () => {
        set({ ammoLoading: true, ammoError: null });
        try {
            const response = await fetch('/api/v1/jagd/ammo');
            const data = await response.json();
            if (data.error) {
                set({ ammoError: data.error, ammoLoading: false });
            } else {
                set({ ammoInventory: data.ammoInventory || [], ammoLoading: false });
            }
        } catch (err) {
            set({ ammoError: (err as Error).message, ammoLoading: false });
        }
    },

    logAmmoUsage: async (args) => {
        try {
            const response = await fetch('/api/v1/jagd/ammo/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args),
            });
            const data = await response.json();
            if (data.error) {
                set({ ammoError: data.error });
                return null;
            }
            // Refresh inventory after logging
            get().fetchAmmoInventory();
            return data.ammoLog;
        } catch (err) {
            set({ ammoError: (err as Error).message });
            return null;
        }
    },
}));
