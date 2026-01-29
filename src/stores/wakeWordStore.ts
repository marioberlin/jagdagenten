/**
 * Wake Word Store - Global state for wake word detection
 *
 * This Zustand store manages the global wake word detection state,
 * allowing components across the app to check if wake word listening
 * is active and trigger voice activation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WakeWordListeningState = 'disabled' | 'idle' | 'loading' | 'listening' | 'detected' | 'error';

interface WakeWordState {
    /** Whether wake word detection is enabled in settings */
    enabled: boolean;
    /** Current listening state */
    listeningState: WakeWordListeningState;
    /** Whether the model is trained and ready */
    isTrained: boolean;
    /** Detection threshold (0-1) */
    threshold: number;
    /** Last error message if any */
    error: string | null;
    /** Callback ID for voice activation */
    voiceActivationCallbackId: string | null;

    // Actions
    setEnabled: (enabled: boolean) => void;
    setListeningState: (state: WakeWordListeningState) => void;
    setIsTrained: (trained: boolean) => void;
    setThreshold: (threshold: number) => void;
    setError: (error: string | null) => void;
    setVoiceActivationCallbackId: (id: string | null) => void;
    markDetected: () => void;
}

export const useWakeWordStore = create<WakeWordState>()(
    persist(
        (set) => ({
            enabled: false,
            listeningState: 'disabled',
            isTrained: false,
            threshold: 0.85,
            error: null,
            voiceActivationCallbackId: null,

            setEnabled: (enabled) => set({
                enabled,
                listeningState: enabled ? 'idle' : 'disabled',
            }),
            setListeningState: (listeningState) => set({ listeningState }),
            setIsTrained: (isTrained) => set({ isTrained }),
            setThreshold: (threshold) => set({ threshold }),
            setError: (error) => set({ error }),
            setVoiceActivationCallbackId: (voiceActivationCallbackId) => set({ voiceActivationCallbackId }),
            markDetected: () => set({ listeningState: 'detected' }),
        }),
        {
            name: 'liquid-wake-word',
            partialize: (state) => ({
                enabled: state.enabled,
                threshold: state.threshold,
                isTrained: state.isTrained,
            }),
        }
    )
);

// Selectors
export const selectWakeWordEnabled = (state: WakeWordState) => state.enabled;
export const selectWakeWordListening = (state: WakeWordState) => state.listeningState === 'listening';
export const selectWakeWordReady = (state: WakeWordState) => state.enabled && state.isTrained;
