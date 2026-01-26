/**
 * Composition Store
 *
 * Zustand store for managing video composition state.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Composition,
  TimelineTrack,
  TimelineEvent,
  CompositionElement,
  Effect,
} from '../types';

// ============================================================================
// Store Types
// ============================================================================

interface CompositionState {
  // State
  composition: Composition | null;
  tracks: TimelineTrack[];
  elements: Map<string, CompositionElement>;
  selectedElement: string | null;
  currentFrame: number;
  isPlaying: boolean;
  history: HistoryEntry[];
  historyIndex: number;

  // Actions - Composition
  createComposition: (params: Omit<Composition, 'id'>) => void;
  updateComposition: (updates: Partial<Composition>) => void;
  loadComposition: (composition: Composition, tracks?: TimelineTrack[]) => void;
  clearComposition: () => void;

  // Actions - Tracks
  addTrack: (track: Omit<TimelineTrack, 'id' | 'events'>) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Actions - Events
  addEvent: (trackId: string, event: Omit<TimelineEvent, 'id' | 'trackId'>) => void;
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  removeEvent: (eventId: string) => void;
  moveEvent: (eventId: string, newStartFrame: number) => void;
  resizeEvent: (eventId: string, startFrame: number, endFrame: number) => void;

  // Actions - Elements
  addElement: (element: Omit<CompositionElement, 'id'>) => void;
  updateElement: (elementId: string, updates: Partial<CompositionElement>) => void;
  removeElement: (elementId: string) => void;

  // Actions - Selection
  selectElement: (elementId: string | null) => void;

  // Actions - Playback
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
}

interface HistoryEntry {
  composition: Composition | null;
  tracks: TimelineTrack[];
  elements: Map<string, CompositionElement>;
}

// ============================================================================
// ID Generation
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Store
// ============================================================================

export const useCompositionStore = create<CompositionState>()(
  immer((set, get) => ({
    // Initial state
    composition: null,
    tracks: [],
    elements: new Map(),
    selectedElement: null,
    currentFrame: 0,
    isPlaying: false,
    history: [],
    historyIndex: -1,

    // Composition actions
    createComposition: (params) => {
      const composition: Composition = {
        id: generateId('comp'),
        ...params,
      };

      set((state) => {
        state.composition = composition;
        state.tracks = [];
        state.elements = new Map();
        state.selectedElement = null;
        state.currentFrame = 0;
      });

      get().saveToHistory();
    },

    updateComposition: (updates) => {
      set((state) => {
        if (state.composition) {
          Object.assign(state.composition, updates);
        }
      });
      get().saveToHistory();
    },

    loadComposition: (composition, tracks = []) => {
      set((state) => {
        state.composition = composition;
        state.tracks = tracks;
        state.elements = new Map();
        state.selectedElement = null;
        state.currentFrame = 0;
      });
      get().saveToHistory();
    },

    clearComposition: () => {
      set((state) => {
        state.composition = null;
        state.tracks = [];
        state.elements = new Map();
        state.selectedElement = null;
        state.currentFrame = 0;
      });
    },

    // Track actions
    addTrack: (params) => {
      const track: TimelineTrack = {
        id: generateId('track'),
        events: [],
        ...params,
      };

      set((state) => {
        state.tracks.push(track);
      });
      get().saveToHistory();
    },

    updateTrack: (trackId, updates) => {
      set((state) => {
        const track = state.tracks.find((t) => t.id === trackId);
        if (track) {
          Object.assign(track, updates);
        }
      });
      get().saveToHistory();
    },

    removeTrack: (trackId) => {
      set((state) => {
        const index = state.tracks.findIndex((t) => t.id === trackId);
        if (index >= 0) {
          state.tracks.splice(index, 1);
        }
      });
      get().saveToHistory();
    },

    reorderTracks: (fromIndex, toIndex) => {
      set((state) => {
        const [track] = state.tracks.splice(fromIndex, 1);
        state.tracks.splice(toIndex, 0, track);
      });
      get().saveToHistory();
    },

    // Event actions
    addEvent: (trackId, params) => {
      const event: TimelineEvent = {
        id: generateId('event'),
        trackId,
        ...params,
      };

      set((state) => {
        const track = state.tracks.find((t) => t.id === trackId);
        if (track) {
          track.events.push(event);
          // Sort by start frame
          track.events.sort((a, b) => a.startFrame - b.startFrame);
        }
      });
      get().saveToHistory();
    },

    updateEvent: (eventId, updates) => {
      set((state) => {
        for (const track of state.tracks) {
          const event = track.events.find((e) => e.id === eventId);
          if (event) {
            Object.assign(event, updates);
            break;
          }
        }
      });
      get().saveToHistory();
    },

    removeEvent: (eventId) => {
      set((state) => {
        for (const track of state.tracks) {
          const index = track.events.findIndex((e) => e.id === eventId);
          if (index >= 0) {
            track.events.splice(index, 1);
            break;
          }
        }
      });
      get().saveToHistory();
    },

    moveEvent: (eventId, newStartFrame) => {
      set((state) => {
        for (const track of state.tracks) {
          const event = track.events.find((e) => e.id === eventId);
          if (event) {
            const duration = event.endFrame - event.startFrame;
            event.startFrame = Math.max(0, newStartFrame);
            event.endFrame = event.startFrame + duration;
            break;
          }
        }
      });
      get().saveToHistory();
    },

    resizeEvent: (eventId, startFrame, endFrame) => {
      set((state) => {
        for (const track of state.tracks) {
          const event = track.events.find((e) => e.id === eventId);
          if (event) {
            event.startFrame = Math.max(0, startFrame);
            event.endFrame = Math.max(event.startFrame + 1, endFrame);
            break;
          }
        }
      });
      get().saveToHistory();
    },

    // Element actions
    addElement: (params) => {
      const element: CompositionElement = {
        id: generateId('elem'),
        ...params,
      };

      set((state) => {
        state.elements.set(element.id, element);
      });
      get().saveToHistory();
    },

    updateElement: (elementId, updates) => {
      set((state) => {
        const element = state.elements.get(elementId);
        if (element) {
          state.elements.set(elementId, { ...element, ...updates });
        }
      });
      get().saveToHistory();
    },

    removeElement: (elementId) => {
      set((state) => {
        state.elements.delete(elementId);
        if (state.selectedElement === elementId) {
          state.selectedElement = null;
        }
      });
      get().saveToHistory();
    },

    // Selection
    selectElement: (elementId) => {
      set((state) => {
        state.selectedElement = elementId;
      });
    },

    // Playback
    setCurrentFrame: (frame) => {
      set((state) => {
        state.currentFrame = frame;
      });
    },

    setIsPlaying: (playing) => {
      set((state) => {
        state.isPlaying = playing;
      });
    },

    // History
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const entry = history[historyIndex - 1];
        set((state) => {
          state.composition = entry.composition;
          state.tracks = entry.tracks;
          state.elements = entry.elements;
          state.historyIndex = historyIndex - 1;
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const entry = history[historyIndex + 1];
        set((state) => {
          state.composition = entry.composition;
          state.tracks = entry.tracks;
          state.elements = entry.elements;
          state.historyIndex = historyIndex + 1;
        });
      }
    },

    saveToHistory: () => {
      const { composition, tracks, elements, history, historyIndex } = get();

      // Create snapshot
      const entry: HistoryEntry = {
        composition: composition ? { ...composition } : null,
        tracks: tracks.map((t) => ({ ...t, events: [...t.events] })),
        elements: new Map(elements),
      };

      set((state) => {
        // Remove any redo entries
        state.history = history.slice(0, historyIndex + 1);
        state.history.push(entry);

        // Limit history size
        if (state.history.length > 50) {
          state.history.shift();
        } else {
          state.historyIndex = state.history.length - 1;
        }
      });
    },
  }))
);
