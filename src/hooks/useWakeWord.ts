/**
 * useWakeWord - Wake Word Detection Hook
 *
 * React hook for detecting custom wake words using TensorFlow.js Speech Commands
 * with transfer learning. Enables "Hey Liquid" activation without cloud APIs.
 *
 * Architecture:
 * 1. Load base speech-commands model (pre-trained on 20 words)
 * 2. Create transfer recognizer for custom wake word
 * 3. User trains by recording examples (10-20 samples)
 * 4. Trained model persisted to IndexedDB
 * 5. Continuous listening detects wake word and triggers callback
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type WakeWordState = 'loading' | 'ready' | 'listening' | 'training' | 'error' | 'disabled';

export interface WakeWordConfig {
    /** Name of the wake word (e.g., 'hey_liquid') */
    wakeWord?: string;
    /** Probability threshold for detection (0-1, default 0.85) */
    threshold?: number;
    /** Overlap factor for spectrogram analysis (0-1, default 0.5) */
    overlapFactor?: number;
    /** Enable/disable wake word detection */
    enabled?: boolean;
}

export interface TrainingProgress {
    epoch: number;
    totalEpochs: number;
    loss: number;
    accuracy: number;
}

export interface UseWakeWordOptions {
    /** Callback when wake word is detected */
    onWakeWord: () => void;
    /** Callback for state changes */
    onStateChange?: (state: WakeWordState) => void;
    /** Callback for training progress */
    onTrainingProgress?: (progress: TrainingProgress) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
    /** Configuration */
    config?: WakeWordConfig;
}

export interface UseWakeWordReturn {
    /** Current state */
    state: WakeWordState;
    /** Start listening for wake word */
    startListening: () => Promise<void>;
    /** Stop listening */
    stopListening: () => Promise<void>;
    /** Record a training example */
    recordExample: (isBackgroundNoise?: boolean) => Promise<void>;
    /** Train the model with collected examples */
    train: (epochs?: number) => Promise<void>;
    /** Get count of collected examples */
    getExampleCounts: () => Record<string, number> | null;
    /** Clear all training data */
    clearExamples: () => void;
    /** Save trained model to IndexedDB */
    saveModel: () => Promise<void>;
    /** Load trained model from IndexedDB */
    loadModel: () => Promise<boolean>;
    /** Check if model is trained */
    isTrained: boolean;
    /** Error if any */
    error: Error | null;
}

// ============================================================================
// IndexedDB Storage
// ============================================================================

const DB_NAME = 'liquid-wake-word';
const STORE_NAME = 'models';
const EXAMPLES_KEY = 'wake-word-examples';

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function saveToIDB(key: string, data: unknown): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(data, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadFromIDB<T>(key: string): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
    });
}

// ============================================================================
// Hook
// ============================================================================

export function useWakeWord(options: UseWakeWordOptions): UseWakeWordReturn {
    const { onWakeWord, onStateChange, onTrainingProgress, onError, config = {} } = options;
    const {
        wakeWord = 'hey_liquid',
        threshold = 0.85,
        overlapFactor = 0.5,
        enabled = true,
    } = config;

    const [state, setState] = useState<WakeWordState>(enabled ? 'loading' : 'disabled');
    const [error, setError] = useState<Error | null>(null);
    const [isTrained, setIsTrained] = useState(false);

    // Refs for TensorFlow.js objects
    const baseRecognizerRef = useRef<any>(null);
    const transferRecognizerRef = useRef<any>(null);
    const isListeningRef = useRef(false);

    // Update state with callback
    const updateState = useCallback((newState: WakeWordState) => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    // Handle errors
    const handleError = useCallback((err: Error) => {
        console.error('[useWakeWord] Error:', err);
        setError(err);
        onError?.(err);
        updateState('error');
    }, [onError, updateState]);

    // Initialize TensorFlow.js and base recognizer
    useEffect(() => {
        if (!enabled) {
            updateState('disabled');
            return;
        }

        let mounted = true;

        async function init() {
            try {
                // Import TensorFlow.js first to ensure backends are registered
                // This must happen BEFORE speech-commands tries to use tf
                const tf = await import('@tensorflow/tfjs');

                // Wait for backend to be ready (prefers WebGL, falls back to WASM/CPU)
                await tf.ready();
                console.log('[useWakeWord] TensorFlow.js ready with backend:', tf.getBackend());

                // NOW import speech-commands (which depends on tf being initialized)
                const speechCommands = await import('@tensorflow-models/speech-commands');

                // Create base recognizer
                const recognizer = speechCommands.create('BROWSER_FFT');
                await recognizer.ensureModelLoaded();

                if (!mounted) return;

                baseRecognizerRef.current = recognizer;

                // Create transfer recognizer for our wake word
                const transfer = recognizer.createTransfer(wakeWord);
                transferRecognizerRef.current = transfer;

                // Try to load saved model
                const loaded = await loadSavedModel();

                if (!mounted) return;

                if (loaded) {
                    setIsTrained(true);
                    updateState('ready');
                } else {
                    updateState('ready');
                }

                console.log('[useWakeWord] Initialized successfully');
            } catch (err) {
                if (mounted) {
                    handleError(err instanceof Error ? err : new Error(String(err)));
                }
            }
        }

        init();

        return () => {
            mounted = false;
            if (isListeningRef.current && transferRecognizerRef.current) {
                transferRecognizerRef.current.stopListening().catch(console.error);
            }
        };
    }, [enabled, wakeWord, updateState, handleError]);

    // Load saved model from IndexedDB
    const loadSavedModel = useCallback(async (): Promise<boolean> => {
        try {
            const savedExamples = await loadFromIDB<ArrayBuffer>(EXAMPLES_KEY);
            if (savedExamples && transferRecognizerRef.current) {
                transferRecognizerRef.current.loadExamples(savedExamples);

                // Retrain with saved examples
                await transferRecognizerRef.current.train({
                    epochs: 25,
                    callback: {
                        onEpochEnd: (epoch: number, logs: { loss: number; acc: number }) => {
                            console.log(`[useWakeWord] Reload training epoch ${epoch}: loss=${logs.loss?.toFixed(4)}`);
                        },
                    },
                });

                return true;
            }
            return false;
        } catch (err) {
            console.warn('[useWakeWord] Failed to load saved model:', err);
            return false;
        }
    }, []);

    // Start listening for wake word
    const startListening = useCallback(async () => {
        if (!transferRecognizerRef.current || !isTrained) {
            handleError(new Error('Model not trained. Record examples first.'));
            return;
        }

        if (isListeningRef.current) return;

        try {
            updateState('listening');
            isListeningRef.current = true;

            await transferRecognizerRef.current.listen(
                (result: { scores: Float32Array }) => {
                    const scores = result.scores;
                    const words = transferRecognizerRef.current.wordLabels();
                    const wakeWordIdx = words.indexOf(wakeWord);

                    if (wakeWordIdx >= 0 && scores[wakeWordIdx] > threshold) {
                        console.log(`[useWakeWord] Wake word detected! Score: ${scores[wakeWordIdx].toFixed(2)}`);
                        onWakeWord();
                    }
                },
                {
                    probabilityThreshold: threshold * 0.8, // Pre-filter
                    overlapFactor,
                    invokeCallbackOnNoiseAndUnknown: false,
                }
            );

            console.log('[useWakeWord] Started listening for wake word');
        } catch (err) {
            isListeningRef.current = false;
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [isTrained, wakeWord, threshold, overlapFactor, onWakeWord, updateState, handleError]);

    // Stop listening
    const stopListening = useCallback(async () => {
        if (!isListeningRef.current || !transferRecognizerRef.current) return;

        try {
            await transferRecognizerRef.current.stopListening();
            isListeningRef.current = false;
            updateState('ready');
            console.log('[useWakeWord] Stopped listening');
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [updateState, handleError]);

    // Record a training example
    const recordExample = useCallback(async (isBackgroundNoise = false) => {
        if (!transferRecognizerRef.current) {
            handleError(new Error('Recognizer not initialized'));
            return;
        }

        try {
            // Request microphone permission first (if not already granted)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop the stream immediately - we just needed to trigger permission
                stream.getTracks().forEach(track => track.stop());
                console.log('[useWakeWord] Microphone permission granted');
            } catch (micErr) {
                throw new Error('Microphone permission denied. Please allow microphone access to record examples.');
            }

            const label = isBackgroundNoise ? '_background_noise_' : wakeWord;
            console.log(`[useWakeWord] Recording example for: ${label}`);

            await transferRecognizerRef.current.collectExample(label);

            // Log example count (may throw if no examples yet - that's ok)
            try {
                console.log('[useWakeWord] Example recorded:', transferRecognizerRef.current.countExamples());
            } catch {
                console.log('[useWakeWord] Example recorded (count unavailable)');
            }
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [wakeWord, handleError]);

    // Train the model
    const train = useCallback(async (epochs = 25) => {
        if (!transferRecognizerRef.current) {
            handleError(new Error('Recognizer not initialized'));
            return;
        }

        let counts: Record<string, number> | null = null;
        try {
            counts = transferRecognizerRef.current.countExamples();
        } catch {
            // countExamples throws if no examples collected
        }
        if (!counts || Object.keys(counts).length === 0) {
            handleError(new Error('No examples recorded. Record at least 5 examples.'));
            return;
        }

        try {
            updateState('training');

            await transferRecognizerRef.current.train({
                epochs,
                callback: {
                    onEpochEnd: (epoch: number, logs: { loss: number; acc: number }) => {
                        onTrainingProgress?.({
                            epoch: epoch + 1,
                            totalEpochs: epochs,
                            loss: logs.loss,
                            accuracy: logs.acc,
                        });
                    },
                },
            });

            setIsTrained(true);
            updateState('ready');

            // Auto-save after training
            await saveModel();

            console.log('[useWakeWord] Training complete');
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [updateState, onTrainingProgress, handleError]);

    // Get example counts
    const getExampleCounts = useCallback((): Record<string, number> | null => {
        if (!transferRecognizerRef.current) return null;
        try {
            return transferRecognizerRef.current.countExamples();
        } catch {
            // countExamples() throws if no examples have been collected yet
            return null;
        }
    }, []);

    // Clear examples
    const clearExamples = useCallback(() => {
        if (!transferRecognizerRef.current) return;
        transferRecognizerRef.current.clearExamples();
        setIsTrained(false);
        console.log('[useWakeWord] Examples cleared');
    }, []);

    // Save model to IndexedDB
    const saveModel = useCallback(async () => {
        if (!transferRecognizerRef.current) return;

        try {
            const serialized = transferRecognizerRef.current.serializeExamples();
            await saveToIDB(EXAMPLES_KEY, serialized);
            console.log('[useWakeWord] Model saved to IndexedDB');
        } catch (err) {
            console.error('[useWakeWord] Failed to save model:', err);
        }
    }, []);

    // Load model from IndexedDB
    const loadModel = useCallback(async (): Promise<boolean> => {
        if (!transferRecognizerRef.current) return false;
        return loadSavedModel();
    }, [loadSavedModel]);

    return {
        state,
        startListening,
        stopListening,
        recordExample,
        train,
        getExampleCounts,
        clearExamples,
        saveModel,
        loadModel,
        isTrained,
        error,
    };
}
