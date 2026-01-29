/**
 * WakeWordTraining - Settings component for wake word training
 *
 * Provides a UI for users to train a custom wake word using TensorFlow.js
 * Speech Commands with transfer learning.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Trash2, Play, Square, Check, Loader2, AlertCircle, Settings2 } from 'lucide-react';
import { useWakeWord, type WakeWordState, type TrainingProgress } from '@/hooks/useWakeWord';
import { useWakeWordStore } from '@/stores/wakeWordStore';

// ============================================================================
// Types
// ============================================================================

interface WakeWordTrainingProps {
    /** Callback when settings change (for parent state) */
    onConfigChange?: (config: WakeWordSettings) => void;
    /** Initial enabled state */
    initialEnabled?: boolean;
}

export interface WakeWordSettings {
    enabled: boolean;
    threshold: number;
    wakeWord: string;
}

// ============================================================================
// Component
// ============================================================================

export function WakeWordTraining({ onConfigChange, initialEnabled }: WakeWordTrainingProps) {
    // Global store state - select all at once to avoid multiple subscriptions
    const { enabled, threshold, setEnabled, setThreshold, setIsTrained: setGlobalIsTrained } = useWakeWordStore();

    // Local UI state only
    const wakeWord = 'hey_liquid';
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
    const [exampleCounts, setExampleCounts] = useState<Record<string, number> | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingType, setRecordingType] = useState<'wake' | 'noise' | null>(null);
    const [detected, setDetected] = useState(false);
    const detectedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs for synchronous recording state check (state updates are async)
    const isRecordingRef = useRef(false);
    const recordingTypeRef = useRef<'wake' | 'noise' | null>(null);

    // Memoize callbacks to prevent re-renders
    const onWakeWordDetected = useCallback(() => {
        console.log('[WakeWordTraining] Wake word detected!');
        setDetected(true);
        if (detectedTimeoutRef.current) clearTimeout(detectedTimeoutRef.current);
        detectedTimeoutRef.current = setTimeout(() => setDetected(false), 2000);
    }, []);

    const onStateChanged = useCallback((newState: WakeWordState) => {
        console.log('[WakeWordTraining] State:', newState);
    }, []);

    const onProgress = useCallback((progress: TrainingProgress) => {
        setTrainingProgress(progress);
    }, []);

    const onErrorOccurred = useCallback((err: Error) => {
        console.error('[WakeWordTraining] Error:', err);
    }, []);

    // Memoize config to prevent re-creating on every render
    const config = useMemo(() => ({
        enabled: true, // Always enabled in training mode
        threshold,
        wakeWord,
    }), [threshold, wakeWord]);

    // Wake word hook (dummy callback for training mode)
    const {
        state,
        startListening,
        stopListening,
        recordExample,
        cancelRecording,
        train,
        getExampleCounts,
        clearExamples,
        isTrained,
        error,
    } = useWakeWord({
        onWakeWord: onWakeWordDetected,
        onStateChange: onStateChanged,
        onTrainingProgress: onProgress,
        onError: onErrorOccurred,
        config,
    });

    // Sync trained state with global store - only when isTrained changes
    const prevIsTrainedRef = useRef(isTrained);
    useEffect(() => {
        if (prevIsTrainedRef.current !== isTrained) {
            prevIsTrainedRef.current = isTrained;
            setGlobalIsTrained(isTrained);
        }
    }, [isTrained, setGlobalIsTrained]);

    // Update example counts on mount only (counts are updated in handleRecordExample after each recording)
    useEffect(() => {
        const counts = getExampleCounts();
        if (counts) {
            setExampleCounts(counts);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Notify parent of config changes - memoized to prevent loops
    const configRef = useRef({ enabled, threshold, wakeWord });
    useEffect(() => {
        if (
            configRef.current.enabled !== enabled ||
            configRef.current.threshold !== threshold ||
            configRef.current.wakeWord !== wakeWord
        ) {
            configRef.current = { enabled, threshold, wakeWord };
            onConfigChange?.({ enabled, threshold, wakeWord });
        }
    }, [enabled, threshold, wakeWord, onConfigChange]);

    // Record example with visual feedback
    const handleRecordExample = useCallback(async (type: 'wake' | 'noise') => {
        // If already recording this type, cancel it (use refs for synchronous check)
        if (isRecordingRef.current && recordingTypeRef.current === type) {
            console.log('[WakeWordTraining] Cancelling recording via click');
            cancelRecording();
            isRecordingRef.current = false;
            recordingTypeRef.current = null;
            setIsRecording(false);
            setRecordingType(null);
            return;
        }

        // Don't allow recording if already recording a different type
        if (isRecordingRef.current) {
            console.log('[WakeWordTraining] Already recording different type, ignoring');
            return;
        }

        // Don't allow recording if not ready
        if (state === 'loading' || state === 'error' || state === 'disabled') {
            console.warn('[WakeWordTraining] Cannot record - model not ready');
            return;
        }

        // Set both refs (for sync check) and state (for UI)
        isRecordingRef.current = true;
        recordingTypeRef.current = type;
        setIsRecording(true);
        setRecordingType(type);

        // Safety timeout - always reset UI after 2.5s no matter what happens
        const safetyTimeout = setTimeout(() => {
            console.log('[WakeWordTraining] Safety timeout - resetting UI');
            isRecordingRef.current = false;
            recordingTypeRef.current = null;
            setIsRecording(false);
            setRecordingType(null);
        }, 2500);

        try {
            await recordExample(type === 'noise');
            // Refresh counts
            const counts = getExampleCounts();
            setExampleCounts(counts);
        } catch (err) {
            console.error('[WakeWordTraining] Recording failed:', err);
            // Don't crash - just log the error
        } finally {
            clearTimeout(safetyTimeout);
            isRecordingRef.current = false;
            recordingTypeRef.current = null;
            setIsRecording(false);
            setRecordingType(null);
        }
    }, [recordExample, cancelRecording, getExampleCounts, state]);

    // Handle training
    const handleTrain = useCallback(async () => {
        try {
            setTrainingProgress({ epoch: 0, totalEpochs: 25, loss: 0, accuracy: 0 });
            await train(25);
        } catch (err) {
            console.error('[WakeWordTraining] Training failed:', err);
        } finally {
            setTrainingProgress(null);
        }
    }, [train]);

    // Clear all examples
    const handleClearExamples = useCallback(() => {
        clearExamples();
        setExampleCounts(null);
    }, [clearExamples]);

    // Get state colors and icons
    const getStateInfo = (s: WakeWordState) => {
        switch (s) {
            case 'loading':
                return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Loader2, label: 'Loading model...' };
            case 'ready':
                return { color: 'text-green-400', bg: 'bg-green-400/20', icon: Check, label: 'Ready' };
            case 'listening':
                return { color: 'text-blue-400', bg: 'bg-blue-400/20', icon: Volume2, label: 'Listening...' };
            case 'training':
                return { color: 'text-purple-400', bg: 'bg-purple-400/20', icon: Loader2, label: 'Training...' };
            case 'error':
                return { color: 'text-red-400', bg: 'bg-red-400/20', icon: AlertCircle, label: 'Error' };
            case 'disabled':
                return { color: 'text-gray-400', bg: 'bg-gray-400/20', icon: MicOff, label: 'Disabled' };
            default:
                return { color: 'text-gray-400', bg: 'bg-gray-400/20', icon: Settings2, label: 'Unknown' };
        }
    };

    const stateInfo = getStateInfo(state);
    const wakeExamples = exampleCounts?.['hey_liquid'] ?? 0;
    const noiseExamples = exampleCounts?.['_background_noise_'] ?? 0;
    const canTrain = wakeExamples >= 5 && noiseExamples >= 3;

    return (
        <div className="space-y-6">
            {/* Header with Enable Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${stateInfo.bg}`}>
                        <stateInfo.icon className={`w-5 h-5 ${stateInfo.color} ${state === 'loading' || state === 'training' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Wake Word Detection</h3>
                        <p className="text-sm text-white/60">{stateInfo.label}</p>
                    </div>
                </div>

                {/* Toggle */}
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-white/20'
                        }`}
                >
                    <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                        animate={{ left: enabled ? 28 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-red-500/20 border border-red-500/30"
                    >
                        <p className="text-sm text-red-300">{error.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Training Section */}
            {state !== 'loading' && state !== 'disabled' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {/* Instructions */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="font-medium text-white mb-2">Train "Hey Liquid"</h4>
                        <p className="text-sm text-white/60">
                            Record at least 5 examples of you saying "Hey Liquid" and 3 examples of background noise.
                            The model will learn to recognize your voice pattern.
                        </p>
                    </div>

                    {/* Recording Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Wake Word Recording */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRecordExample('wake');
                            }}
                            disabled={(isRecording && recordingType !== 'wake') || state === 'training' || state === 'loading' || state === 'error'}
                            className={`p-4 rounded-xl border transition-all ${isRecording && recordingType === 'wake'
                                ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/50 cursor-pointer'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    animate={isRecording && recordingType === 'wake' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                >
                                    <Mic className={`w-8 h-8 ${isRecording && recordingType === 'wake' ? 'text-red-400' : 'text-blue-400'}`} />
                                </motion.div>
                                <span className="font-medium text-white">
                                    {isRecording && recordingType === 'wake' ? 'Recording...' : 'Say "Hey Liquid"'}
                                </span>
                                {isRecording && recordingType === 'wake' && (
                                    <span className="text-xs text-red-300">Tap to cancel</span>
                                )}
                                <span className="text-sm text-white/60">
                                    {wakeExamples} / 5 examples
                                </span>
                            </div>
                        </button>

                        {/* Background Noise Recording */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRecordExample('noise');
                            }}
                            disabled={(isRecording && recordingType !== 'noise') || state === 'training' || state === 'loading' || state === 'error'}
                            className={`p-4 rounded-xl border transition-all ${isRecording && recordingType === 'noise'
                                ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/50 cursor-pointer'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    animate={isRecording && recordingType === 'noise' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                >
                                    <MicOff className={`w-8 h-8 ${isRecording && recordingType === 'noise' ? 'text-orange-400' : 'text-gray-400'}`} />
                                </motion.div>
                                <span className="font-medium text-white">
                                    {isRecording && recordingType === 'noise' ? 'Recording...' : 'Background Noise'}
                                </span>
                                {isRecording && recordingType === 'noise' && (
                                    <span className="text-xs text-orange-300">Tap to cancel</span>
                                )}
                                <span className="text-sm text-white/60">
                                    {noiseExamples} / 3 examples
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Training Progress */}
                    <AnimatePresence>
                        {trainingProgress && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
                            >
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-purple-300">Training...</span>
                                    <span className="text-sm text-purple-300">
                                        Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-purple-900/50 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-purple-300/60">
                                    <span>Loss: {trainingProgress.loss?.toFixed(4) ?? 'N/A'}</span>
                                    <span>Accuracy: {((trainingProgress.accuracy ?? 0) * 100).toFixed(1)}%</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTrain}
                            disabled={!canTrain || state === 'training'}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${canTrain && state !== 'training'
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            {state === 'training' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Train Model
                        </button>

                        <button
                            onClick={handleClearExamples}
                            disabled={state === 'training' || (!wakeExamples && !noiseExamples)}
                            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Test Section (only when trained) */}
                    {isTrained && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`p-4 rounded-xl border transition-all duration-300 ${
                                detected
                                    ? 'bg-emerald-500/25 border-emerald-400/60 ring-2 ring-emerald-400/40'
                                    : 'bg-green-500/10 border-green-500/20'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <AnimatePresence mode="wait">
                                        {detected ? (
                                            <motion.div
                                                key="detected"
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                            >
                                                <h4 className="font-semibold text-emerald-300 flex items-center gap-2">
                                                    <Check className="w-4 h-4" />
                                                    Detected!
                                                </h4>
                                                <p className="text-sm text-emerald-300/70">
                                                    Wake word recognized successfully
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="idle"
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                            >
                                                <h4 className="font-medium text-green-300">Model Trained!</h4>
                                                <p className="text-sm text-green-300/60">
                                                    {state === 'listening'
                                                        ? 'Say "Hey Liquid" to test detection...'
                                                        : 'Test the wake word detection'}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={state === 'listening' ? stopListening : startListening}
                                    className={`py-2 px-4 rounded-xl font-medium transition-all flex items-center gap-2 ${state === 'listening'
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                >
                                    {state === 'listening' ? (
                                        <>
                                            <Square className="w-4 h-4" />
                                            Stop
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="w-4 h-4" />
                                            Test
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Threshold Slider */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-white/80">Detection Threshold</span>
                            <span className="text-sm text-white/60">{(threshold * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="99"
                            value={threshold * 100}
                            onChange={(e) => setThreshold(parseInt(e.target.value) / 100)}
                            className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-4
                                [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-blue-500
                                [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <p className="text-xs text-white/40 mt-2">
                            Higher = fewer false positives, Lower = more sensitive
                        </p>
                    </div>
                </motion.div>
            )
            }
        </div >
    );
}

export default WakeWordTraining;
