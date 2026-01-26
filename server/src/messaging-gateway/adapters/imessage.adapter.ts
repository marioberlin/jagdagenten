/**
 * iMessage Adapter
 * 
 * Uses AppleScript/osascript for iMessage integration on macOS.
 * Monitors Messages.app for incoming messages.
 * 
 * Requirements:
 * - macOS only
 * - Full Disk Access permission
 * - Accessibility permission for osascript
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

const execAsync = promisify(exec);

// ============================================================================
// iMessage Adapter
// ============================================================================

export class IMessageAdapter extends BaseChannelAdapter {
    readonly channelType = 'imessage' as const;
    readonly displayName = 'iMessage';

    private pollInterval: ReturnType<typeof setInterval> | null = null;
    private lastMessageId: string = '';
    private processedIds = new Set<string>();

    constructor(config: ChannelConfig) {
        super(config);
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;

        // Check if running on macOS
        if (process.platform !== 'darwin') {
            throw new Error('iMessage adapter only works on macOS');
        }

        // Start polling for messages
        const pollIntervalMs = this.config.pollIntervalMs ?? 2000;

        this.pollInterval = setInterval(async () => {
            try {
                await this.pollMessages();
            } catch (error) {
                console.error('[iMessage] Poll error:', error);
            }
        }, pollIntervalMs);

        console.info('[iMessage] Started message polling');
        this.emit('event', {
            type: 'connection',
            channelType: this.channelType,
            data: { status: 'connected' },
        } as GatewayEvent);
    }

    async stop(): Promise<void> {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!response.text) throw new Error('iMessage requires text content');

        // Escape text for AppleScript
        const escapedText = response.text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');

        // Determine if phone number or email
        const service = channelId.includes('@') ? 'iMessage' : 'SMS';

        const script = `
      tell application "Messages"
        set targetService to 1st service whose service type = ${service}
        set targetBuddy to buddy "${channelId}" of targetService
        send "${escapedText}" to targetBuddy
      end tell
    `;

        try {
            await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
            return `imsg-${Date.now()}`;
        } catch (error) {
            console.error('[iMessage] Send error:', error);
            throw new Error(`Failed to send iMessage: ${(error as Error).message}`);
        }
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        return this.send(message.from.id, response);
    }

    async sendTyping(channelId: string): Promise<void> {
        // iMessage doesn't support programmatic typing indicators
    }

    async handleWebhook(request: Request): Promise<Response> {
        return new Response('iMessage uses local polling', { status: 200 });
    }

    getWebhookPath(): string | null {
        return null;
    }

    private async pollMessages(): Promise<void> {
        // Query Messages database via AppleScript
        const script = `
      tell application "Messages"
        set recentMessages to {}
        repeat with aChat in chats
          set chatId to id of aChat
          set chatMessages to messages of aChat
          if (count of chatMessages) > 0 then
            set lastMsg to last item of chatMessages
            set msgId to id of lastMsg
            set msgText to text of lastMsg
            set msgSender to sender of lastMsg
            set msgDate to date sent of lastMsg
            set isFromMe to (sender of lastMsg is missing value)
            if not isFromMe then
              set end of recentMessages to {msgId, chatId, msgText, msgSender, msgDate}
            end if
          end if
        end repeat
        return recentMessages
      end tell
    `;

        try {
            const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);

            // Parse AppleScript output
            // Format: {{id, chatId, text, sender, date}, ...}
            if (!stdout.trim() || stdout.trim() === '{}') return;

            const messages = this.parseAppleScriptOutput(stdout);

            for (const msg of messages) {
                if (this.processedIds.has(msg.id)) continue;
                this.processedIds.add(msg.id);

                // Keep set size manageable
                if (this.processedIds.size > 1000) {
                    const arr = Array.from(this.processedIds);
                    this.processedIds = new Set(arr.slice(-500));
                }

                const normalized: NormalizedMessage = {
                    id: msg.id,
                    channelType: 'imessage',
                    channelId: msg.chatId,
                    from: {
                        id: msg.sender,
                        displayName: msg.sender,
                    },
                    text: msg.text,
                    media: [],
                    timestamp: msg.date,
                    isGroup: msg.chatId.includes('chat'),
                    isMention: false,
                    raw: msg,
                };

                this.handleIncomingMessage(normalized);
            }
        } catch (error) {
            // Silently fail polling errors
        }
    }

    private parseAppleScriptOutput(output: string): Array<{
        id: string;
        chatId: string;
        text: string;
        sender: string;
        date: Date;
    }> {
        // Simple parser for AppleScript list output
        // This is a simplified version - production would need more robust parsing
        const messages: Array<{
            id: string;
            chatId: string;
            text: string;
            sender: string;
            date: Date;
        }> = [];

        try {
            // Remove outer braces and split by },
            const cleaned = output.trim().replace(/^\{/, '').replace(/\}$/, '');
            if (!cleaned) return messages;

            // Very basic parsing - would need improvement for production
            const items = cleaned.split('}, {');
            for (const item of items) {
                const parts = item.replace(/^\{/, '').replace(/\}$/, '').split(', ');
                if (parts.length >= 4) {
                    messages.push({
                        id: parts[0]?.replace(/"/g, '') || '',
                        chatId: parts[1]?.replace(/"/g, '') || '',
                        text: parts[2]?.replace(/"/g, '') || '',
                        sender: parts[3]?.replace(/"/g, '') || '',
                        date: new Date(),
                    });
                }
            }
        } catch (e) {
            console.error('[iMessage] Parse error:', e);
        }

        return messages;
    }
}

// Register adapter
registerAdapter('imessage', (config) => new IMessageAdapter(config));

export default IMessageAdapter;
