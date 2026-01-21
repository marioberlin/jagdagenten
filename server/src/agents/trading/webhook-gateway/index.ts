/**
 * WebhookGatewayAgent
 * 
 * A2A Agent for receiving and processing external webhooks.
 * Integrates with TradingView, external signals, and custom triggers.
 * 
 * Endpoints:
 * - A2A: POST /agents/webhook-gateway/a2a
 * - Webhook: POST /agents/webhook-gateway/hook/:source
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface WebhookConfig {
    id: string;
    name: string;
    source: 'tradingview' | 'custom' | 'api';
    secret?: string;
    enabled: boolean;
    createdAt: string;
    lastTriggered?: string;
    triggerCount: number;
}

interface WebhookEvent {
    id: string;
    configId: string;
    source: string;
    payload: Record<string, unknown>;
    action?: string;
    symbol?: string;
    receivedAt: string;
    processed: boolean;
    result?: string;
}

// ============================================================================
// In-Memory Stores
// ============================================================================

const webhookConfigs: Map<string, WebhookConfig> = new Map();
const webhookEvents: WebhookEvent[] = [];

// Default TradingView webhook
const tradingViewConfig: WebhookConfig = {
    id: 'tradingview',
    name: 'TradingView Alerts',
    source: 'tradingview',
    enabled: true,
    createdAt: new Date().toISOString(),
    triggerCount: 0,
};
webhookConfigs.set('tradingview', tradingViewConfig);

// ============================================================================
// Webhook Processing
// ============================================================================

function processWebhook(configId: string, payload: Record<string, unknown>): WebhookEvent {
    const config = webhookConfigs.get(configId);

    const event: WebhookEvent = {
        id: randomUUID(),
        configId,
        source: config?.source || 'custom',
        payload,
        receivedAt: new Date().toISOString(),
        processed: false,
    };

    // Parse TradingView format
    if (config?.source === 'tradingview') {
        // TradingView alerts typically send: {"action": "buy", "symbol": "BTCUSDT", ...}
        event.action = payload.action as string;
        event.symbol = (payload.symbol as string || payload.ticker as string)?.replace('USDT', '');
    }

    // Parse custom format
    if (payload.signal) {
        event.action = payload.signal as string;
    }
    if (payload.coin || payload.crypto) {
        event.symbol = (payload.coin || payload.crypto) as string;
    }

    // Update config stats
    if (config) {
        config.triggerCount++;
        config.lastTriggered = new Date().toISOString();
    }

    event.processed = true;
    event.result = event.action && event.symbol
        ? `Signal received: ${event.action.toUpperCase()} ${event.symbol}`
        : 'Webhook received but no action taken';

    webhookEvents.unshift(event); // Add to front
    if (webhookEvents.length > 100) webhookEvents.pop(); // Limit history

    console.log(`[WebhookGateway] Processed: ${event.result}`);

    return event;
}

function createWebhookConfig(name: string, source: WebhookConfig['source']): WebhookConfig {
    const config: WebhookConfig = {
        id: randomUUID().slice(0, 8),
        name,
        source,
        secret: randomUUID().slice(0, 16),
        enabled: true,
        createdAt: new Date().toISOString(),
        triggerCount: 0,
    };

    webhookConfigs.set(config.id, config);
    return config;
}

function getWebhookUrl(configId: string, baseUrl: string = 'http://localhost:3000'): string {
    return `${baseUrl}/agents/webhook-gateway/hook/${configId}`;
}

function getRecentEvents(limit: number = 10): WebhookEvent[] {
    return webhookEvents.slice(0, limit);
}

// ============================================================================
// Agent Card
// ============================================================================

export const getWebhookGatewayAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Webhook Gateway',
    description: 'Receive trading signals from TradingView, external APIs, and custom webhooks. Automatically process incoming alerts and trigger trading actions.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/webhook-gateway`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'create-webhook',
            name: 'Create Webhook',
            description: 'Create a new webhook endpoint',
            tags: ['create', 'webhook', 'endpoint'],
            examples: ['create tradingview webhook', 'new webhook for signals', 'create custom hook'],
        },
        {
            id: 'list-webhooks',
            name: 'List Webhooks',
            description: 'Show all webhook configurations',
            tags: ['list', 'show', 'webhooks'],
            examples: ['show webhooks', 'list my hooks', 'webhook status'],
        },
        {
            id: 'webhook-history',
            name: 'Webhook History',
            description: 'View recent webhook events',
            tags: ['history', 'events', 'log'],
            examples: ['webhook history', 'recent events', 'show triggers'],
        },
        {
            id: 'test-webhook',
            name: 'Test Webhook',
            description: 'Send a test webhook event',
            tags: ['test', 'simulate', 'trigger'],
            examples: ['test tradingview webhook', 'simulate buy signal', 'test hook'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column', 'Code']
        },
    },
});

// ============================================================================
// Intent Detection
// ============================================================================

interface WebhookIntent {
    action: 'create' | 'list' | 'history' | 'test' | 'delete' | 'help';
    source?: 'tradingview' | 'custom' | 'api';
    webhookId?: string;
    testPayload?: Record<string, unknown>;
}

function parseWebhookIntent(text: string): WebhookIntent {
    const lower = text.toLowerCase().trim();

    // Extract source
    let source: WebhookIntent['source'];
    if (lower.includes('tradingview') || lower.includes('tv')) source = 'tradingview';
    else if (lower.includes('api')) source = 'api';
    else if (lower.includes('custom')) source = 'custom';

    // Determine action
    if (lower.includes('create') || lower.includes('new') || lower.includes('add')) {
        return { action: 'create', source: source || 'custom' };
    }
    if (lower.includes('history') || lower.includes('event') || lower.includes('log') || lower.includes('trigger')) {
        return { action: 'history' };
    }
    if (lower.includes('test') || lower.includes('simulate')) {
        const testPayload: Record<string, unknown> = { action: 'buy', symbol: 'BTCUSDT', price: 100000 };
        if (lower.includes('sell')) testPayload.action = 'sell';
        if (lower.includes('eth')) testPayload.symbol = 'ETHUSDT';
        return { action: 'test', source, testPayload };
    }
    if (lower.includes('delete') || lower.includes('remove')) {
        return { action: 'delete' };
    }
    if (lower.includes('list') || lower.includes('show') || lower.includes('webhook')) {
        return { action: 'list' };
    }

    return { action: 'help' };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function sourceEmoji(source: string): string {
    switch (source) {
        case 'tradingview': return '📺';
        case 'api': return '🔌';
        default: return '🪝';
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateWebhookListCard(configs: WebhookConfig[], baseUrl: string): A2UIMessage[] {
    const configComponents: Array<{ id: string; component: object }> = [];
    const configIds: string[] = [];

    configs.forEach((config, idx) => {
        const id = `hook-${idx}`;
        configIds.push(id);

        configComponents.push({
            id,
            component: { Card: { children: [`${id}-header`, `${id}-url`, `${id}-stats`] } },
        });
        configComponents.push({
            id: `${id}-header`,
            component: {
                Text: {
                    text: { literalString: `${sourceEmoji(config.source)} ${config.name}` },
                    semantic: 'h4',
                }
            },
        });
        configComponents.push({
            id: `${id}-url`,
            component: {
                Text: {
                    text: { literalString: getWebhookUrl(config.id, baseUrl) },
                    variant: 'secondary',
                }
            },
        });
        configComponents.push({
            id: `${id}-stats`,
            component: {
                Text: {
                    text: { literalString: `Triggers: ${config.triggerCount} | ${config.enabled ? '✅ Active' : '❌ Disabled'}` },
                }
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'webhook-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#8B5CF6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'webhook-list',
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', ...configIds, 'create-btn'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: '🪝 Webhook Endpoints' }, semantic: 'h2' } },
                },
                ...configComponents,
                {
                    id: 'create-btn',
                    component: {
                        Button: {
                            label: { literalString: '+ Create New Webhook' },
                            action: { input: { text: 'create custom webhook' } },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleWebhookGatewayRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[WebhookGateway] Processing: "${userText}"`);

    const intent = parseWebhookIntent(userText);
    console.log(`[WebhookGateway] Intent:`, intent);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'create': {
                const name = intent.source === 'tradingview'
                    ? 'TradingView Alert'
                    : `Custom Webhook ${webhookConfigs.size}`;

                const config = createWebhookConfig(name, intent.source || 'custom');
                const url = getWebhookUrl(config.id, baseUrl);

                responseText = `✅ Webhook Created!\n\n` +
                    `**Name:** ${config.name}\n` +
                    `**URL:** ${url}\n` +
                    `**Secret:** ${config.secret}\n\n` +
                    `Send POST requests to this URL with your trading signals.`;

                if (intent.source === 'tradingview') {
                    responseText += `\n\n**TradingView Alert Setup:**\n` +
                        `1. Go to TradingView → Alerts\n` +
                        `2. Create alert with Webhook URL\n` +
                        `3. Use message format: {"action": "buy", "symbol": "{{ticker}}", "price": {{close}}}`;
                }
                break;
            }

            case 'list': {
                const configs = Array.from(webhookConfigs.values());
                if (configs.length === 0) {
                    responseText = 'No webhooks configured. Create one with "create webhook"';
                } else {
                    responseText = `🪝 Webhook Endpoints (${configs.length}):\n\n` +
                        configs.map(c =>
                            `${sourceEmoji(c.source)} **${c.name}**\n` +
                            `URL: ${getWebhookUrl(c.id, baseUrl)}\n` +
                            `Triggers: ${c.triggerCount}`
                        ).join('\n\n');
                    a2uiMessages = generateWebhookListCard(configs, baseUrl);
                }
                break;
            }

            case 'history': {
                const events = getRecentEvents(5);
                if (events.length === 0) {
                    responseText = 'No webhook events yet. Test with "test webhook"';
                } else {
                    responseText = `📜 Recent Webhook Events:\n\n` +
                        events.map(e =>
                            `${sourceEmoji(e.source)} ${e.action?.toUpperCase() || 'EVENT'} ${e.symbol || ''}\n` +
                            `${new Date(e.receivedAt).toLocaleTimeString()} | ${e.result}`
                        ).join('\n\n');
                }
                break;
            }

            case 'test': {
                const config = webhookConfigs.get('tradingview') || Array.from(webhookConfigs.values())[0];
                if (!config) {
                    responseText = 'No webhooks configured. Create one first with "create webhook"';
                    break;
                }

                const event = processWebhook(config.id, intent.testPayload || { action: 'buy', symbol: 'BTCUSDT' });

                responseText = `✅ Test Webhook Processed!\n\n` +
                    `**Source:** ${event.source}\n` +
                    `**Action:** ${event.action?.toUpperCase()}\n` +
                    `**Symbol:** ${event.symbol}\n` +
                    `**Result:** ${event.result}`;
                break;
            }

            default:
                responseText = `🪝 Webhook Gateway\n\nCommands:\n• "create tradingview webhook" - Set up TradingView alerts\n• "create custom webhook" - Custom signal endpoint\n• "show webhooks" - List all endpoints\n• "webhook history" - View recent events\n• "test webhook" - Simulate a signal`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'webhook-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[WebhookGateway] Error:', error);
        return {
            id: taskId,
            contextId,
            status: { state: 'failed' },
            history: [
                params.message,
                { role: 'agent', parts: [{ text: `Error: ${(error as Error).message}` }] },
            ],
        };
    }
}

// Export for direct webhook processing
export { processWebhook };
