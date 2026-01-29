/**
 * useA2AVoice - A2A Voice Session Hook
 *
 * React hook for managing realtime voice sessions via A2A protocol.
 * Handles WebSocket audio streaming, mic capture, and playback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface VoiceSessionConfig {
    /** Agent ID for context */
    agentId?: string;
    /** System prompt for the voice session */
    systemPrompt?: string;
    /** Voice name (e.g., "Aoede", "Charon", "Fenrir", "Kore", "Puck") */
    voice?: string;
}

export interface UseA2AVoiceOptions {
    /** Context ID for the A2A session */
    contextId: string;
    /** Callback when transcript is received */
    onTranscript?: (text: string) => void;
    /** Callback when voice state changes */
    onStateChange?: (state: VoiceState) => void;
    /** Callback when error occurs */
    onError?: (error: Error) => void;
}

export interface UseA2AVoiceReturn {
    /** Current voice state */
    state: VoiceState;
    /** Start a voice session */
    start: (config?: VoiceSessionConfig) => Promise<void>;
    /** Stop the voice session */
    stop: () => Promise<void>;
    /** Whether a session is active */
    isActive: boolean;
    /** Last error */
    error: Error | null;
}

// ============================================================================
// Audio Utilities
// ============================================================================

/**
 * Convert Float32Array to base64 PCM (16-bit, 16kHz)
 */
function float32ToBase64PCM(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

/**
 * Convert base64 PCM to Float32Array for playback
 */
function base64PCMToFloat32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }
    return float32Array;
}

// ============================================================================
// Hook
// ============================================================================

export function useA2AVoice(options: UseA2AVoiceOptions): UseA2AVoiceReturn {
    const { contextId, onTranscript, onStateChange, onError } = options;

    const [state, setState] = useState<VoiceState>('idle');
    const [error, setError] = useState<Error | null>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const taskIdRef = useRef<string | null>(null);
    const playbackQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        taskIdRef.current = null;
        playbackQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    // Update state with callback
    const updateState = useCallback((newState: VoiceState) => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    // Handle error
    const handleError = useCallback((err: Error) => {
        setError(err);
        onError?.(err);
        updateState('error');
        cleanup();
    }, [onError, updateState, cleanup]);

    // Play audio from queue
    const playAudioQueue = useCallback(async () => {
        if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;
        if (!audioContextRef.current) return;

        isPlayingRef.current = true;
        updateState('speaking');

        while (playbackQueueRef.current.length > 0) {
            const audioData = playbackQueueRef.current.shift();
            if (!audioData || !audioContextRef.current) break;

            const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
            buffer.getChannelData(0).set(audioData);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);

            await new Promise<void>(resolve => {
                source.onended = () => resolve();
                source.start();
            });
        }

        isPlayingRef.current = false;
        if (state !== 'idle' && state !== 'error') {
            updateState('listening');
        }
    }, [state, updateState]);

    // Start voice session
    const start = useCallback(async (config?: VoiceSessionConfig) => {
        if (state !== 'idle' && state !== 'error') {
            return;
        }

        try {
            updateState('connecting');
            setError(null);

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            mediaStreamRef.current = stream;

            // Create audio context
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Create script processor for capturing audio
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            // Send start voice command via A2A
            const startResponse = await fetch('/a2a', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'A2A-Version': '1.0',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: crypto.randomUUID(),
                    method: 'SendMessage',
                    params: {
                        message: {
                            messageId: crypto.randomUUID(),
                            role: 'user',
                            contextId,
                            parts: [{ text: `start voice${config?.voice ? ` with ${config.voice}` : ''}` }],
                        },
                        metadata: {
                            targetAgent: 'voice',
                            agentId: config?.agentId,
                            systemPrompt: config?.systemPrompt,
                        },
                    },
                }),
            });

            const startResult = await startResponse.json();
            if (startResult.error) {
                throw new Error(startResult.error.message);
            }

            taskIdRef.current = startResult.result?.id;

            // Subscribe to SSE stream for real-time audio/transcript updates
            if (taskIdRef.current) {
                const eventSource = new EventSource(`/a2a/stream?taskId=${taskIdRef.current}`);
                eventSourceRef.current = eventSource;

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('[useA2AVoice] SSE event:', data.method);

                        // Handle artifact updates (audio and transcripts)
                        if (data.method === 'a2a.task.artifact.update') {
                            const artifact = data.params?.artifact;
                            if (artifact?.name === 'transcript-chunk') {
                                // Handle transcript chunk
                                for (const part of artifact.parts || []) {
                                    if ((part as { text?: string }).text && onTranscript) {
                                        console.log('[useA2AVoice] Transcript:', (part as { text: string }).text);
                                        onTranscript((part as { text: string }).text);
                                    }
                                }
                            } else if (artifact?.name === 'audio-response') {
                                // Handle audio response
                                for (const part of artifact.parts || []) {
                                    const dataPart = part as { data?: { data?: string; mimeType?: string } };
                                    if (dataPart.data?.data) {
                                        console.log('[useA2AVoice] Audio received');
                                        const audioData = base64PCMToFloat32(dataPart.data.data);
                                        playbackQueueRef.current.push(audioData);
                                        updateState('speaking');
                                        playAudioQueue();
                                    }
                                }
                            }
                        }

                        // Handle status updates
                        if (data.method === 'a2a.task.status.update') {
                            const status = data.params?.status;
                            if (status?.state === 'failed') {
                                handleError(new Error(status.message?.parts?.[0]?.text || 'Voice session failed'));
                            }
                        }
                    } catch (parseError) {
                        console.error('[useA2AVoice] SSE parse error:', parseError);
                    }
                };

                eventSource.onerror = (err) => {
                    console.warn('[useA2AVoice] SSE error (may reconnect):', err);
                    // Don't immediately error - SSE will auto-reconnect
                };
            }

            // Handle transcript from initial response
            const responseMessage = startResult.result?.status?.message;
            if (responseMessage?.parts) {
                for (const part of responseMessage.parts) {
                    if ((part as { text?: string }).text && onTranscript) {
                        onTranscript((part as { text: string }).text);
                    }
                }
            }

            // Send audio data on process
            processorRef.current.onaudioprocess = async (e) => {
                if (!taskIdRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const base64Audio = float32ToBase64PCM(inputData);

                // Send audio chunk via A2A
                try {
                    const audioResponse = await fetch('/a2a', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'A2A-Version': '1.0',
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: crypto.randomUUID(),
                            method: 'SendMessage',
                            params: {
                                message: {
                                    messageId: crypto.randomUUID(),
                                    role: 'user',
                                    contextId,
                                    parts: [{
                                        data: {
                                            data: {
                                                mimeType: 'audio/pcm;rate=16000',
                                                data: base64Audio,
                                            },
                                        },
                                    }],
                                },
                                metadata: {
                                    targetAgent: 'voice',
                                },
                            },
                        }),
                    });

                    const audioResult = await audioResponse.json();

                    // Handle transcript from audio response
                    if (audioResult.result?.status?.message?.parts) {
                        for (const part of audioResult.result.status.message.parts) {
                            if ((part as { text?: string }).text && onTranscript) {
                                onTranscript((part as { text: string }).text);
                            }
                        }
                    }

                    // Handle audio response for playback
                    if (audioResult.result?.artifacts) {
                        for (const artifact of audioResult.result.artifacts) {
                            if (artifact?.parts) {
                                for (const part of artifact.parts) {
                                    // Handle audio data
                                    const dataPart = part as { data?: { data?: { type?: string; data?: string } } };
                                    if (dataPart.data?.data?.type === 'audio' && dataPart.data.data.data) {
                                        const audioData = base64PCMToFloat32(dataPart.data.data.data);
                                        playbackQueueRef.current.push(audioData);
                                        playAudioQueue();
                                    }
                                }
                            }
                        }
                    }
                } catch (audioError) {
                    console.error('[useA2AVoice] Audio send error:', audioError);
                }
            };

            updateState('listening');
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [state, contextId, updateState, handleError, cleanup, playAudioQueue, onTranscript]);

    // Stop voice session
    const stop = useCallback(async () => {
        if (state === 'idle') return;

        try {
            // Send end voice command
            await fetch('/a2a', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'A2A-Version': '1.0',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: crypto.randomUUID(),
                    method: 'SendMessage',
                    params: {
                        message: {
                            messageId: crypto.randomUUID(),
                            role: 'user',
                            contextId,
                            parts: [{ text: 'end voice' }],
                        },
                        metadata: {
                            targetAgent: 'voice',
                        },
                    },
                }),
            });

            cleanup();
            updateState('idle');
        } catch (err) {
            handleError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [state, contextId, cleanup, updateState, handleError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        state,
        start,
        stop,
        isActive: state !== 'idle' && state !== 'error',
        error,
    };
}
