/**
 * Voice WebSocket Handler
 * 
 * WebSocket endpoint for real-time bidirectional voice streaming.
 * Handles continuous audio streaming between client and Gemini Live API.
 */

import { Elysia, t } from 'elysia';
import { v1 } from '@liquidcrypto/a2a-sdk';
import { GoogleGenAI, Modality, Session } from '@google/genai';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface VoiceWebSocketSession {
    id: string;
    contextId: string;
    geminiSession: Session | null;
    systemPrompt?: string;
    voice?: string;
    createdAt: Date;
}

// ============================================================================
// Voice WebSocket Manager
// ============================================================================

export class VoiceWebSocketManager {
    private sessions: Map<string, VoiceWebSocketSession> = new Map();
    private client: GoogleGenAI | null = null;
    private model = 'gemini-2.5-flash-preview-native-audio-dialog';

    constructor() {
        this.initClient();
    }

    private initClient(): void {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.client = new GoogleGenAI({ apiKey });
        }
    }

    /**
     * Create a new voice session
     */
    async createSession(contextId: string, config?: { systemPrompt?: string; voice?: string }): Promise<VoiceWebSocketSession> {
        if (!this.client) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Check for existing session
        const existing = this.getSessionByContext(contextId);
        if (existing) {
            return existing;
        }

        const session: VoiceWebSocketSession = {
            id: randomUUID(),
            contextId,
            geminiSession: null,
            systemPrompt: config?.systemPrompt,
            voice: config?.voice,
            createdAt: new Date(),
        };

        this.sessions.set(session.id, session);
        return session;
    }

    /**
     * Connect session to Gemini Live
     */
    async connect(sessionId: string): Promise<Session> {
        const session = this.sessions.get(sessionId);
        if (!session || !this.client) {
            throw new Error('Session not found or client not initialized');
        }

        if (session.geminiSession) {
            return session.geminiSession;
        }

        const geminiSession = await this.client.live.connect({
            model: this.model,
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: session.systemPrompt || 'You are a helpful AI assistant.',
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: session.voice || 'Puck',
                        },
                    },
                },
            },
        });

        session.geminiSession = geminiSession;
        return geminiSession;
    }

    /**
     * Send audio to Gemini
     */
    async sendAudio(sessionId: string, audioData: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session?.geminiSession) {
            throw new Error('No active Gemini session');
        }

        session.geminiSession.sendRealtimeInput({
            data: audioData,
            mimeType: 'audio/pcm;rate=16000',
        });
    }

    /**
     * Close a session
     */
    async closeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session?.geminiSession) {
            await session.geminiSession.close();
        }
        this.sessions.delete(sessionId);
    }

    /**
     * Get session by context ID
     */
    getSessionByContext(contextId: string): VoiceWebSocketSession | undefined {
        for (const session of this.sessions.values()) {
            if (session.contextId === contextId) {
                return session;
            }
        }
        return undefined;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): VoiceWebSocketSession | undefined {
        return this.sessions.get(sessionId);
    }
}

// Global instance
const voiceManager = new VoiceWebSocketManager();

// ============================================================================
// WebSocket Plugin
// ============================================================================

export function createVoiceWebSocketPlugin() {
    return new Elysia({ name: 'voice-ws' })
        .ws('/ws/voice/:contextId', {
            // Message schema
            body: t.Union([
                // Audio data message
                t.Object({
                    type: t.Literal('audio'),
                    data: t.String(), // base64 PCM
                }),
                // Control messages
                t.Object({
                    type: t.Literal('start'),
                    systemPrompt: t.Optional(t.String()),
                    voice: t.Optional(t.String()),
                }),
                t.Object({
                    type: t.Literal('stop'),
                }),
            ]),

            // Connection opened
            async open(ws) {
                const contextId = ws.data.params.contextId;
                console.log(`[VoiceWS] Connection opened for context: ${contextId}`);

                try {
                    // Create session
                    const session = await voiceManager.createSession(contextId);

                    // Store session ID in WebSocket data
                    (ws.data as { sessionId?: string }).sessionId = session.id;

                    ws.send(JSON.stringify({
                        type: 'connected',
                        sessionId: session.id,
                        contextId,
                    }));
                } catch (error) {
                    console.error('[VoiceWS] Connection error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error instanceof Error ? error.message : 'Connection failed',
                    }));
                    ws.close();
                }
            },

            // Message received
            async message(ws, message) {
                const sessionId = (ws.data as { sessionId?: string }).sessionId;
                if (!sessionId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'No session' }));
                    return;
                }

                try {
                    if (message.type === 'start') {
                        // Connect to Gemini Live
                        const geminiSession = await voiceManager.connect(sessionId);

                        // Set up response handler
                        geminiSession.on('message', (msg) => {
                            if (msg.serverContent?.modelTurn?.parts) {
                                for (const part of msg.serverContent.modelTurn.parts) {
                                    // Audio response
                                    if (part.inlineData) {
                                        ws.send(JSON.stringify({
                                            type: 'audio',
                                            data: part.inlineData.data,
                                            mimeType: part.inlineData.mimeType,
                                        }));
                                    }
                                    // Transcript
                                    if (part.text) {
                                        ws.send(JSON.stringify({
                                            type: 'transcript',
                                            text: part.text,
                                        }));
                                    }
                                }
                            }
                            // Turn complete
                            if (msg.serverContent?.turnComplete) {
                                ws.send(JSON.stringify({ type: 'turnComplete' }));
                            }
                        });

                        geminiSession.on('error', (error) => {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: error.message,
                            }));
                        });

                        ws.send(JSON.stringify({ type: 'started' }));
                        console.log(`[VoiceWS] Session started: ${sessionId}`);

                    } else if (message.type === 'audio') {
                        // Forward audio to Gemini
                        await voiceManager.sendAudio(sessionId, message.data);

                    } else if (message.type === 'stop') {
                        // Close session
                        await voiceManager.closeSession(sessionId);
                        ws.send(JSON.stringify({ type: 'stopped' }));
                        console.log(`[VoiceWS] Session stopped: ${sessionId}`);
                    }
                } catch (error) {
                    console.error('[VoiceWS] Message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error instanceof Error ? error.message : 'Processing failed',
                    }));
                }
            },

            // Connection closed
            async close(ws) {
                const sessionId = (ws.data as { sessionId?: string }).sessionId;
                if (sessionId) {
                    await voiceManager.closeSession(sessionId);
                    console.log(`[VoiceWS] Connection closed: ${sessionId}`);
                }
            },
        });
}

export { voiceManager };
