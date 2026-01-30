/**
 * Voice Executor - Gemini Live API Integration
 *
 * A2A-native realtime voice executor using Google Gemini Live API.
 * Manages bidirectional audio streaming through the A2A protocol.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@jagdagenten/a2a-sdk';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { BaseA2UIExecutor, type AgentExecutionContext, type AgentExecutionResult } from './base.js';
import type { EventQueue } from '../adapter/elysia-adapter.js';

// ============================================================================
// Types
// ============================================================================

interface VoiceSession {
    id: string;
    taskId: string;
    contextId: string;
    geminiSession: Session;
    systemPrompt?: string;
    agentId?: string;
    createdAt: Date;
}

export interface VoiceConfig {
    /** Agent ID for context */
    agentId?: string;
    /** System prompt for the voice session */
    systemPrompt?: string;
    /** Voice name (e.g., "Aoede", "Charon", "Fenrir", "Kore", "Puck") */
    voice?: string;
}

// ============================================================================
// VoiceExecutor
// ============================================================================

/**
 * Voice executor for realtime bidirectional audio via Gemini Live API
 */
export class VoiceExecutor extends BaseA2UIExecutor {
    private sessions: Map<string, VoiceSession> = new Map();
    private client: GoogleGenAI | null = null;
    private model = 'gemini-2.5-flash-preview-native-audio-dialog';
    private eventQueue: EventQueue | null = null;

    constructor() {
        super();
        this.initClient();
    }

    /**
     * Inject EventQueue for streaming events (called by elysia-plugin)
     */
    setEventQueue(queue: EventQueue): void {
        this.eventQueue = queue;
    }

    private initClient(): void {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.client = new GoogleGenAI({ apiKey });
        }
    }

    /**
     * Execute a voice message
     */
    async execute(
        message: v1.Message,
        context: AgentExecutionContext
    ): Promise<AgentExecutionResult> {
        const text = this.extractText(message);
        const lowered = text.toLowerCase().trim();

        // Debug logging
        console.log('[VoiceExecutor] execute called:', {
            contextId: context.contextId,
            taskId: context.taskId,
            metadata: context.metadata,
            text: text.substring(0, 100),
            partsCount: message.parts?.length ?? 0,
            partTypes: message.parts?.map(p => 'text' in p ? 'text' : 'data' in p ? 'data' : 'file' in p ? 'file' : 'unknown'),
        });

        // Check for audio parts in the message
        const audioPart = message.parts.find((p): p is v1.DataPart =>
            'data' in p && typeof p.data === 'object' && p.data !== null && 'mimeType' in (p.data as Record<string, unknown>) && (p.data as Record<string, unknown>).mimeType?.toString().startsWith('audio/')
        );

        // Handle voice commands
        if (lowered.startsWith('start voice') || lowered === 'voice on') {
            console.log('[VoiceExecutor] Starting voice session');
            return this.handleStartVoice(text, context);
        }

        if (lowered.startsWith('end voice') || lowered === 'voice off' || lowered === 'stop voice') {
            console.log('[VoiceExecutor] Ending voice session');
            return this.handleEndVoice(context);
        }

        // Handle audio data
        if (audioPart) {
            console.log('[VoiceExecutor] Processing audio chunk');
            return this.handleAudioInput(audioPart, context);
        }

        // No voice session active - return help
        return this.createTextResponse(
            'Voice commands: "start voice" to begin, "end voice" to stop. Send audio data through DataPart for realtime conversation.',
            context.contextId,
            context.taskId
        );
    }

    /**
     * Start a new voice session
     */
    private async handleStartVoice(
        text: string,
        context: AgentExecutionContext
    ): Promise<AgentExecutionResult> {
        if (!this.client) {
            return this.createErrorResponse(-32603, 'GEMINI_API_KEY not configured');
        }

        // Check if session already exists for this context
        const existingSession = this.getSessionByContext(context.contextId);
        if (existingSession) {
            return this.createTextResponse(
                'Voice session already active. Say "end voice" to stop the current session.',
                context.contextId,
                context.taskId
            );
        }

        // Parse voice config from message
        const config = this.parseVoiceConfig(text, context);

        try {
            // Create Gemini Live session
            const geminiSession = await this.client.live.connect({
                model: this.model,
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: config.systemPrompt || 'You are a helpful AI assistant.',
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: config.voice || 'Puck',
                            },
                        },
                    },
                },
            });

            const sessionId = randomUUID();
            const voiceSession: VoiceSession = {
                id: sessionId,
                taskId: context.taskId,
                contextId: context.contextId,
                geminiSession,
                systemPrompt: config.systemPrompt,
                agentId: config.agentId,
                createdAt: new Date(),
            };

            this.sessions.set(sessionId, voiceSession);

            // Set up response handler
            this.setupResponseHandler(sessionId, context);

            return {
                message: this.createAgentMessage(
                    [{ text: '🎤 Voice session started. I\'m listening...' }],
                    context.contextId,
                    context.taskId
                ),
                artifacts: [
                    this.createTextArtifact('Voice session started'),
                    {
                        artifactId: randomUUID(),
                        name: 'voice-session',
                        parts: [{
                            data: {
                                data: {
                                    type: 'voice-session',
                                    sessionId,
                                    state: 'ready',
                                    agentId: config.agentId,
                                },
                            } as v1.DataPart,
                        }],
                    },
                ],
                status: v1.TaskState.WORKING,
            };
        } catch (error) {
            console.error('[VoiceExecutor] Failed to start voice session:', error);
            return this.createErrorResponse(
                -32603,
                `Failed to start voice session: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * End a voice session
     */
    private async handleEndVoice(
        context: AgentExecutionContext
    ): Promise<AgentExecutionResult> {
        const session = this.getSessionByContext(context.contextId);
        if (!session) {
            return this.createTextResponse(
                'No active voice session. Say "start voice" to begin.',
                context.contextId,
                context.taskId
            );
        }

        try {
            await session.geminiSession.close();
            this.sessions.delete(session.id);

            return {
                message: this.createAgentMessage(
                    [{ text: '🔇 Voice session ended.' }],
                    context.contextId,
                    context.taskId
                ),
                artifacts: [
                    this.createTextArtifact('Voice session ended'),
                    {
                        artifactId: randomUUID(),
                        name: 'voice-session',
                        parts: [{
                            data: {
                                data: {
                                    type: 'voice-session',
                                    sessionId: session.id,
                                    state: 'closed',
                                },
                            } as v1.DataPart,
                        }],
                    },
                ],
                status: v1.TaskState.COMPLETED,
            };
        } catch (error) {
            console.error('[VoiceExecutor] Failed to end voice session:', error);
            return this.createErrorResponse(
                -32603,
                `Failed to end voice session: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Handle audio input data
     */
    private async handleAudioInput(
        audioPart: v1.DataPart,
        context: AgentExecutionContext
    ): Promise<AgentExecutionResult> {
        const session = this.getSessionByContext(context.contextId);
        if (!session) {
            return this.createErrorResponse(-32602, 'No active voice session. Say "start voice" first.');
        }

        try {
            const audioData = audioPart.data as { data?: { data?: string } };
            const base64Audio = audioData.data?.data;

            if (!base64Audio) {
                return this.createErrorResponse(-32602, 'Invalid audio data format');
            }

            // Send audio to Gemini Live
            session.geminiSession.sendRealtimeInput({
                data: base64Audio,
                mimeType: 'audio/pcm;rate=16000',
            });

            // Audio response will come through the event handler
            return {
                status: v1.TaskState.WORKING,
            };
        } catch (error) {
            console.error('[VoiceExecutor] Failed to send audio:', error);
            return this.createErrorResponse(
                -32603,
                `Failed to send audio: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Set up response handler for a session
     */
    private setupResponseHandler(sessionId: string, context: AgentExecutionContext): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.geminiSession.on('message', (message: LiveServerMessage) => {
            // Handle audio response
            if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                    if (part.inlineData) {
                        console.log('[VoiceExecutor] Received audio response:', {
                            mimeType: part.inlineData.mimeType,
                            dataLength: part.inlineData.data?.length ?? 0,
                        });

                        // Publish audio artifact via EventQueue for SSE streaming
                        if (this.eventQueue && session.taskId) {
                            const audioArtifact: v1.Artifact = {
                                artifactId: randomUUID(),
                                name: 'audio-response',
                                parts: [{
                                    data: {
                                        mimeType: part.inlineData.mimeType,
                                        data: part.inlineData.data,
                                    },
                                } as v1.DataPart],
                            };

                            this.eventQueue.publish({
                                jsonrpc: '2.0',
                                method: 'a2a.task.artifact.update',
                                params: {
                                    id: session.taskId,
                                    artifact: audioArtifact,
                                },
                            } as v1.TaskArtifactUpdateEvent);

                            console.log('[VoiceExecutor] Published audio artifact:', audioArtifact.artifactId);
                        }
                    }

                    // Handle text transcript if present
                    if (part.text) {
                        console.log('[VoiceExecutor] Received transcript:', part.text.substring(0, 100));

                        // Publish transcript artifact for real-time display
                        if (this.eventQueue && session.taskId) {
                            const transcriptArtifact: v1.Artifact = {
                                artifactId: randomUUID(),
                                name: 'transcript-chunk',
                                parts: [{ text: part.text }],
                            };

                            this.eventQueue.publish({
                                jsonrpc: '2.0',
                                method: 'a2a.task.artifact.update',
                                params: {
                                    id: session.taskId,
                                    artifact: transcriptArtifact,
                                },
                            } as v1.TaskArtifactUpdateEvent);

                            console.log('[VoiceExecutor] Published transcript artifact');
                        }
                    }
                }
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
                console.log('[VoiceExecutor] Turn complete');

                // Publish status update for turn complete
                if (this.eventQueue && session.taskId) {
                    this.eventQueue.publish({
                        jsonrpc: '2.0',
                        method: 'a2a.task.status.update',
                        params: {
                            id: session.taskId,
                            status: {
                                state: v1.TaskState.WORKING,
                                message: this.createAgentMessage(
                                    [{ text: 'Turn complete. Listening...' }],
                                    session.contextId,
                                    session.taskId
                                ),
                                timestamp: new Date().toISOString(),
                            },
                            final: false,
                        },
                    } as v1.TaskStatusUpdateEvent);
                }
            }
        });

        session.geminiSession.on('error', (error: Error) => {
            console.error('[VoiceExecutor] Session error:', error);

            // Publish error status
            if (this.eventQueue && session.taskId) {
                this.eventQueue.publish({
                    jsonrpc: '2.0',
                    method: 'a2a.task.status.update',
                    params: {
                        id: session.taskId,
                        status: {
                            state: v1.TaskState.FAILED,
                            message: this.createAgentMessage(
                                [{ text: `Voice session error: ${error.message}` }],
                                session.contextId,
                                session.taskId
                            ),
                            timestamp: new Date().toISOString(),
                        },
                        final: true,
                    },
                } as v1.TaskStatusUpdateEvent);
            }
        });

        session.geminiSession.on('close', () => {
            console.log('[VoiceExecutor] Session closed');
            this.sessions.delete(sessionId);
        });
    }

    /**
     * Get session by context ID
     */
    private getSessionByContext(contextId: string): VoiceSession | undefined {
        for (const session of this.sessions.values()) {
            if (session.contextId === contextId) {
                return session;
            }
        }
        return undefined;
    }

    /**
     * Parse voice configuration from message
     */
    private parseVoiceConfig(text: string, context: AgentExecutionContext): VoiceConfig {
        const config: VoiceConfig = {};

        // Extract agentId from metadata
        if (context.metadata?.agentId) {
            config.agentId = context.metadata.agentId as string;
        }

        // Extract systemPrompt from metadata
        if (context.metadata?.systemPrompt) {
            config.systemPrompt = context.metadata.systemPrompt as string;
        }

        // Parse voice from text (e.g., "start voice with Aoede")
        const voiceMatch = text.match(/with\s+(Aoede|Charon|Fenrir|Kore|Puck)/i);
        if (voiceMatch) {
            config.voice = voiceMatch[1];
        }

        return config;
    }

    /**
     * Cleanup all sessions (for graceful shutdown)
     */
    async cleanup(): Promise<void> {
        for (const session of this.sessions.values()) {
            try {
                await session.geminiSession.close();
            } catch (error) {
                console.error('[VoiceExecutor] Error closing session:', error);
            }
        }
        this.sessions.clear();
    }
}

// ============================================================================
// Agent Card
// ============================================================================

/**
 * Get the Voice agent card
 */
export function getVoiceAgentCard(baseUrl: string): v1.AgentCard {
    return {
        name: 'Voice Assistant',
        description: 'Realtime voice conversations powered by Gemini Live API',
        url: `${baseUrl}/a2a`,
        protocolVersion: '1.0',
        capabilities: {
            streaming: true,
            pushNotifications: false,
            stateTransitionHistory: false,
        },
        skills: [
            {
                id: 'voice-conversation',
                name: 'Voice Conversation',
                description: 'Have a realtime voice conversation with an AI assistant',
                tags: ['voice', 'audio', 'speech', 'conversation', 'realtime'],
                examples: [
                    'Start voice',
                    'Start a voice conversation',
                    'Voice on',
                    'End voice',
                    'Stop voice',
                ],
                inputModes: ['text', 'audio'],
                outputModes: ['text', 'audio'],
            },
        ],
        supportedInterfaces: [
            { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC' },
        ],
    };
}
