/**
 * Trail Camera Store
 *
 * Zustand store for trail camera management and photo galleries.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface Camera {
  id: string;
  name: string;
  standId?: string;
  geo?: { lat: number; lng: number };
  model?: string;
  batteryLevel?: number;
  sdCardFreeGb?: number;
  lastPhotoAt?: string;
  createdAt: string;
}

export interface TrailCamPhoto {
  id: string;
  cameraId: string;
  url: string;
  thumbnailUrl?: string;
  capturedAt: string;
  species?: string;
  confidence?: number;
  temperature?: number;
  windSpeed?: number;
  createdAt: string;
}

export interface TrailCamState {
  cameras: Camera[];
  photos: TrailCamPhoto[];
  selectedCamera: string | null;
  loading: boolean;
  error: string | null;
}

export interface TrailCamActions {
  fetchCameras: () => Promise<void>;
  fetchPhotos: (cameraId?: string) => Promise<void>;
  addCamera: (camera: { name: string; standId?: string; geo?: { lat: number; lng: number }; model?: string }) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  selectCamera: (id: string | null) => void;
}

export type TrailCamStore = TrailCamState & TrailCamActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/trailcam';

export const useTrailCamStore = create<TrailCamStore>((set) => ({
  cameras: [],
  photos: [],
  selectedCamera: null,
  loading: false,
  error: null,

  fetchCameras: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/cameras`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ cameras: data.cameras ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchPhotos: async (cameraId) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (cameraId) params.set('cameraId', cameraId);
      const res = await fetch(`${API}/photos?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ photos: data.photos ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addCamera: async (camera) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camera),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ cameras: [...s.cameras, data.camera], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteCamera: async (id) => {
    try {
      const res = await fetch(`${API}/cameras/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ cameras: s.cameras.filter((c) => c.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  selectCamera: (id) => {
    set({ selectedCamera: id });
  },
}));
