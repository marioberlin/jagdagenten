/**
 * Signal Adapter
 * 
 * Uses signal-cli for Signal integration.
 * Requires signal-cli to be installed and configured.
 */

import { spawn, ChildProcess } from 'child_process';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

// ============================================================================
// Signal Adapter
// ============================================================================

export class SignalAdapter extends BaseChannelAdapter {
    readonly channelType = 'signal' as const;
    readonly displayName = 'Signal';

    private process: ChildProcess | null = null;
    private phoneNumber: string = '';

    constructor(config: ChannelConfig) {
        super(config);
        this.phoneNumber = config.phoneNumber ?? '';
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;
        if (!this.phoneNumber) {
            throw new Error('Signal phone number not configured');
        }

        // Start signal-cli in JSON-RPC mode
        this.process = spawn('signal-cli', [
            '-u', this.phoneNumber,
            'jsonRpc'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle stdout (messages)
        let buffer = '';
        this.process.stdout?.on('data', (data: Buffer) => {
            buffer += data.toString();

            // Process complete JSON lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    this.handleJsonRpcMessage(json);
                } catch (e) {
                    console.error('[Signal] Failed to parse:', line);
                }
            }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
            console.error('[Signal] stderr:', data.toString());
        });

        this.process.on('close', (code) => {
            console.info(`[Signal] Process exited with code ${code}`);
            this.emit('event', {
                type: 'connection',
                channelType: this.channelType,
                data: { status: 'disconnected', code },
            } as GatewayEvent);
        });

        console.info('[Signal] Started signal-cli process');
        this.emit('event', {
            type: 'connection',
            channelType: this.channelType,
            data: { status: 'connected' },
        } as GatewayEvent);
    }

    async stop(): Promise<void> {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.process) throw new Error('Signal not running');

        const messageId = `msg-${Date.now()}`;

        const request = {
            jsonrpc: '2.0',
            method: 'send',
            params: {
                recipient: [channelId],
                message: response.text || '',
            },
            id: messageId,
        };

        this.process.stdin?.write(JSON.stringify(request) + '\n');

        return messageId;
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        return this.send(message.from.id, response);
    }

    async sendTyping(channelId: string): Promise<void> {
        if (!this.process) return;

        const request = {
            jsonrpc: '2.0',
            method: 'sendTyping',
            params: {
                recipient: [channelId],
            },
        };

        this.process.stdin?.write(JSON.stringify(request) + '\n');
    }

    async handleWebhook(request: Request): Promise<Response> {
        return new Response('Signal uses signal-cli process', { status: 200 });
    }

    getWebhookPath(): string | null {
        return null;
    }

    private handleJsonRpcMessage(json: any): void {
        // Handle incoming messages
        if (json.method === 'receive' && json.params?.envelope) {
            const envelope = json.params.envelope;

            if (envelope.dataMessage) {
                const normalized = this.normalizeIncoming(envelope);
                if (normalized) {
                    this.handleIncomingMessage(normalized);
                }
            }
        }
    }

    private normalizeIncoming(envelope: any): NormalizedMessage | null {
        try {
            const dataMessage = envelope.dataMessage;
            const source = envelope.source || envelope.sourceNumber;
            const groupId = dataMessage.groupInfo?.groupId;

            return {
                id: `${envelope.timestamp}`,
                channelType: 'signal',
                channelId: groupId || source,
                threadId: undefined,
                from: {
                    id: source,
                    username: undefined,
                    displayName: envelope.sourceName || source,
                },
                text: dataMessage.message || '',
                media: this.extractMedia(dataMessage),
                timestamp: new Date(envelope.timestamp),
                isGroup: !!groupId,
                isMention: dataMessage.mentions?.some((m: any) => m.uuid === this.phoneNumber),
                replyToId: dataMessage.quote?.id?.toString(),
                raw: envelope,
            };
        } catch (error) {
            console.error('[Signal] Failed to normalize message:', error);
            return null;
        }
    }

    private extractMedia(dataMessage: any): NormalizedMessage['media'] {
        const media: NormalizedMessage['media'] = [];

        if (dataMessage.attachments) {
            for (const att of dataMessage.attachments) {
                media.push({
                    type: att.contentType || 'application/octet-stream',
                    url: att.filename || '',
                    filename: att.filename,
                    size: att.size,
                });
            }
        }

        return media;
    }
}

// Register adapter
registerAdapter('signal', (config) => new SignalAdapter(config));

export default SignalAdapter;
