/**
 * Chat Command Service
 * 
 * Handles chat commands (slash commands) in conversation context.
 * 
 * Commands:
 * - /new, /reset: Clear session and start fresh
 * - /status: Show session status and stats
 * - /think <level>: Set thinking level (low, medium, high, max)
 * - /send on|off|inherit: Control auto-send behavior
 * - /compact: Trigger context compaction (see compaction-service.ts)
 */

import type { GatewaySession, ChannelType } from '../messaging-gateway/types';
import type { SessionStore } from '../messaging-gateway/gateway';
import type { CompactionService, ConversationTurn } from './compaction-service';

// ============================================================================
// Types
// ============================================================================

export interface CommandContext {
    sessionId: string;
    session: GatewaySession;
    channelType: ChannelType;
    userId: string;
    isGroup: boolean;
}

export interface CommandResult {
    /** Response message to display */
    response: string;

    /** Updated session (if any changes) */
    updatedSession?: GatewaySession;

    /** Whether to suppress further processing */
    handled: boolean;

    /** Actions to perform */
    actions?: CommandAction[];
}

export type CommandAction =
    | { type: 'clear_history' }
    | { type: 'set_thinking'; level: ThinkingLevel }
    | { type: 'set_send_mode'; mode: SendMode }
    | { type: 'compact'; conversation: ConversationTurn[] }
    | { type: 'navigate'; target: string }
    | { type: 'canvas_mode'; mode: 'html' | 'glass' | 'auto' };

export type ThinkingLevel = 'low' | 'medium' | 'high' | 'max';
export type SendMode = 'on' | 'off' | 'inherit';

export interface CommandDefinition {
    name: string;
    aliases: string[];
    description: string;
    usage: string;
    handler: (ctx: CommandContext, args: string[], service: ChatCommandService) => Promise<CommandResult>;
}

// ============================================================================
// Chat Command Service
// ============================================================================

export class ChatCommandService {
    private sessionStore: SessionStore;
    private compactionService?: CompactionService;
    private commands = new Map<string, CommandDefinition>();

    constructor(sessionStore: SessionStore, compactionService?: CompactionService) {
        this.sessionStore = sessionStore;
        this.compactionService = compactionService;
        this.registerBuiltInCommands();
    }

    // ============================================================================
    // Command Processing
    // ============================================================================

    /**
     * Check if message is a command
     */
    isCommand(message: string): boolean {
        return message.trim().startsWith('/');
    }

    /**
     * Parse and execute a command
     */
    async execute(message: string, context: CommandContext): Promise<CommandResult | null> {
        const trimmed = message.trim();
        if (!trimmed.startsWith('/')) return null;

        const parts = trimmed.slice(1).split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Find command
        const command = this.findCommand(commandName);
        if (!command) {
            return {
                response: `Unknown command: /${commandName}. Use /help to see available commands.`,
                handled: true,
            };
        }

        try {
            return await command.handler(context, args, this);
        } catch (error) {
            return {
                response: `Error executing /${commandName}: ${(error as Error).message}`,
                handled: true,
            };
        }
    }

    /**
     * Find command by name or alias
     */
    private findCommand(name: string): CommandDefinition | undefined {
        // Direct match
        if (this.commands.has(name)) {
            return this.commands.get(name);
        }

        // Check aliases
        for (const cmd of this.commands.values()) {
            if (cmd.aliases.includes(name)) {
                return cmd;
            }
        }

        return undefined;
    }

    // ============================================================================
    // Built-in Commands
    // ============================================================================

    private registerBuiltInCommands(): void {
        // /new, /reset
        this.register({
            name: 'new',
            aliases: ['reset', 'clear'],
            description: 'Clear conversation history and start fresh',
            usage: '/new [reason]',
            handler: async (ctx, args) => {
                const reason = args.join(' ') || 'User requested';

                // Clear session state
                const updatedSession: GatewaySession = {
                    ...ctx.session,
                    inputTokens: 0,
                    outputTokens: 0,
                    contextTokens: 0,
                    createdAt: new Date(),
                    lastActiveAt: new Date(),
                };

                await this.sessionStore.set(ctx.sessionId, updatedSession);

                return {
                    response: `🔄 Session reset. ${reason ? `Reason: ${reason}` : ''}`,
                    updatedSession,
                    handled: true,
                    actions: [{ type: 'clear_history' }],
                };
            },
        });

        // /status
        this.register({
            name: 'status',
            aliases: ['info', 'stats'],
            description: 'Show current session status and statistics',
            usage: '/status',
            handler: async (ctx) => {
                const uptime = Date.now() - ctx.session.createdAt.getTime();
                const uptimeStr = this.formatDuration(uptime);

                const response = [
                    '📊 **Session Status**',
                    '',
                    `- **Session ID:** \`${ctx.session.id.slice(0, 12)}...\``,
                    `- **Channel:** ${ctx.session.channelType}${ctx.session.isGroup ? ' (group)' : ''}`,
                    `- **Thinking:** ${ctx.session.thinkingLevel}`,
                    `- **Activation:** ${ctx.session.activationMode}`,
                    '',
                    '**Token Usage:**',
                    `- Input: ${ctx.session.inputTokens.toLocaleString()}`,
                    `- Output: ${ctx.session.outputTokens.toLocaleString()}`,
                    `- Context: ${ctx.session.contextTokens.toLocaleString()}`,
                    '',
                    `**Uptime:** ${uptimeStr}`,
                ].join('\n');

                return { response, handled: true };
            },
        });

        // /think
        this.register({
            name: 'think',
            aliases: ['thinking', 'level'],
            description: 'Set thinking level for responses',
            usage: '/think <low|medium|high|max>',
            handler: async (ctx, args) => {
                const level = args[0]?.toLowerCase() as ThinkingLevel;

                if (!level || !['low', 'medium', 'high', 'max'].includes(level)) {
                    return {
                        response: `Current thinking level: **${ctx.session.thinkingLevel}**\n\nUsage: \`/think <low|medium|high|max>\`\n\n- **low**: Quick responses, minimal reasoning\n- **medium**: Balanced (default)\n- **high**: Detailed reasoning and analysis\n- **max**: Deep thinking, extended reasoning`,
                        handled: true,
                    };
                }

                const updatedSession: GatewaySession = {
                    ...ctx.session,
                    thinkingLevel: level,
                    lastActiveAt: new Date(),
                };

                await this.sessionStore.set(ctx.sessionId, updatedSession);

                const emojis: Record<ThinkingLevel, string> = {
                    low: '⚡',
                    medium: '💭',
                    high: '🧠',
                    max: '🔮',
                };

                return {
                    response: `${emojis[level]} Thinking level set to **${level}**`,
                    updatedSession,
                    handled: true,
                    actions: [{ type: 'set_thinking', level }],
                };
            },
        });

        // /send
        this.register({
            name: 'send',
            aliases: ['autosend'],
            description: 'Control auto-send behavior for responses',
            usage: '/send <on|off|inherit>',
            handler: async (ctx, args) => {
                const mode = args[0]?.toLowerCase() as SendMode;

                if (!mode || !['on', 'off', 'inherit'].includes(mode)) {
                    return {
                        response: `Current send mode: **${ctx.session.activationMode}**\n\nUsage: \`/send <on|off|inherit>\`\n\n- **on**: Always respond\n- **off**: Only respond when mentioned\n- **inherit**: Use channel default`,
                        handled: true,
                    };
                }

                const activationMode = mode === 'on' ? 'always' : mode === 'off' ? 'never' : 'mention';

                const updatedSession: GatewaySession = {
                    ...ctx.session,
                    activationMode,
                    lastActiveAt: new Date(),
                };

                await this.sessionStore.set(ctx.sessionId, updatedSession);

                return {
                    response: `📤 Send mode set to **${mode}**`,
                    updatedSession,
                    handled: true,
                    actions: [{ type: 'set_send_mode', mode }],
                };
            },
        });

        // /help
        this.register({
            name: 'help',
            aliases: ['?', 'commands'],
            description: 'Show available commands',
            usage: '/help [command]',
            handler: async (ctx, args) => {
                if (args[0]) {
                    // Show specific command help
                    const cmd = this.findCommand(args[0].toLowerCase());
                    if (!cmd) {
                        return {
                            response: `Unknown command: ${args[0]}`,
                            handled: true,
                        };
                    }

                    return {
                        response: [
                            `**/${cmd.name}**`,
                            cmd.description,
                            '',
                            `Usage: \`${cmd.usage}\``,
                            cmd.aliases.length > 0 ? `Aliases: ${cmd.aliases.map(a => `/${a}`).join(', ')}` : '',
                        ].filter(Boolean).join('\n'),
                        handled: true,
                    };
                }

                // Show all commands
                const commandList = Array.from(this.commands.values())
                    .map(cmd => `- **/${cmd.name}**: ${cmd.description}`)
                    .join('\n');

                return {
                    response: `📚 **Available Commands**\n\n${commandList}\n\nUse \`/help <command>\` for more details.`,
                    handled: true,
                };
            },
        });

        // /compact (delegates to compaction service)
        this.register({
            name: 'compact',
            aliases: ['compress'],
            description: 'Compact conversation to reduce context usage',
            usage: '/compact [status|force|config]',
            handler: async (ctx, args) => {
                if (!this.compactionService) {
                    return {
                        response: '⚠️ Compaction service not available',
                        handled: true,
                    };
                }

                // Delegate to compaction service (it needs conversation history from caller)
                return {
                    response: `Use the compaction service to handle /compact ${args.join(' ')}`,
                    handled: true,
                    actions: [{ type: 'compact', conversation: [] }],
                };
            },
        });

        // /canvas
        this.register({
            name: 'canvas',
            aliases: ['render'],
            description: 'Control canvas rendering mode and navigation',
            usage: '/canvas [mode <html|glass|auto>] | [open <file>]',
            handler: async (ctx, args) => {
                const subcommand = args[0]?.toLowerCase();

                if (subcommand === 'mode') {
                    const mode = args[1]?.toLowerCase() as 'html' | 'glass' | 'auto';
                    if (!mode || !['html', 'glass', 'auto'].includes(mode)) {
                        return {
                            response: 'Usage: `/canvas mode <html|glass|auto>`',
                            handled: true,
                        };
                    }

                    return {
                        response: `🎨 Canvas mode set to **${mode}**`,
                        handled: true,
                        actions: [{ type: 'canvas_mode', mode }],
                    };
                }

                if (subcommand === 'open') {
                    const target = args.slice(1).join(' ');
                    if (!target) {
                        return {
                            response: 'Usage: `/canvas open <file_or_url>`',
                            handled: true,
                        };
                    }

                    return {
                        response: `Opening ${target} in canvas...`,
                        handled: true,
                        actions: [{ type: 'navigate', target }],
                    };
                }

                return {
                    response: [
                        '🎨 **Canvas Commands**',
                        '',
                        '- `/canvas mode <html|glass|auto>`: Set rendering mode',
                        '- `/canvas open <file_or_url>`: Open file or URL in canvas',
                    ].join('\n'),
                    handled: true,
                };
            },
        });
    }

    // ============================================================================
    // Command Registration
    // ============================================================================

    /**
     * Register a custom command
     */
    register(command: CommandDefinition): void {
        this.commands.set(command.name, command);
    }

    /**
     * Unregister a command
     */
    unregister(name: string): boolean {
        return this.commands.delete(name);
    }

    /**
     * Get all registered commands
     */
    getCommands(): CommandDefinition[] {
        return Array.from(this.commands.values());
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createChatCommandService(
    sessionStore: SessionStore,
    compactionService?: CompactionService
): ChatCommandService {
    return new ChatCommandService(sessionStore, compactionService);
}

export default ChatCommandService;
