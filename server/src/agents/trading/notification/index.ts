/**
 * NotificationAgent
 * 
 * A2A Agent for sending trading alerts and notifications.
 * Supports email, Slack, Telegram, and in-app notifications.
 * 
 * Endpoints:
 * - A2A: POST /agents/notification/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Notification Types
// ============================================================================

type NotificationChannel = 'email' | 'slack' | 'telegram' | 'app' | 'all';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface Notification {
    id: string;
    channel: NotificationChannel;
    priority: NotificationPriority;
    title: string;
    message: string;
    createdAt: string;
    sentAt?: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
}

interface AlertRule {
    id: string;
    name: string;
    symbol: string;
    condition: 'above' | 'below' | 'cross_up' | 'cross_down';
    value: number;
    channel: NotificationChannel;
    active: boolean;
    triggeredCount: number;
    lastTriggered?: string;
    createdAt: string;
}

// ============================================================================
// In-Memory Stores (Mock)
// ============================================================================

const notifications: Map<string, Notification> = new Map();
const alertRules: Map<string, AlertRule> = new Map();

// Mock channel configuration
const channelConfig = {
    email: { enabled: false, address: null },
    slack: { enabled: false, webhook: null },
    telegram: { enabled: false, chatId: null },
    app: { enabled: true },
};

// ============================================================================
// Notification Functions
// ============================================================================

async function sendNotification(
    channel: NotificationChannel,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium'
): Promise<Notification> {
    const notification: Notification = {
        id: randomUUID(),
        channel,
        priority,
        title,
        message,
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 100));

    if (channel === 'app' || channel === 'all') {
        // In-app notifications always work
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
    } else if (channel === 'email' && !channelConfig.email.enabled) {
        notification.status = 'failed';
        notification.error = 'Email not configured. Use "configure email <address>" to set up.';
    } else if (channel === 'slack' && !channelConfig.slack.enabled) {
        notification.status = 'failed';
        notification.error = 'Slack not configured. Use "configure slack <webhook>" to set up.';
    } else if (channel === 'telegram' && !channelConfig.telegram.enabled) {
        notification.status = 'failed';
        notification.error = 'Telegram not configured. Use "configure telegram <chat_id>" to set up.';
    } else {
        // Simulate successful send for configured channels
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
    }

    notifications.set(notification.id, notification);
    console.log(`[NotificationAgent] ${notification.status}: ${title} via ${channel}`);

    return notification;
}

function createAlertRule(
    name: string,
    symbol: string,
    condition: AlertRule['condition'],
    value: number,
    channel: NotificationChannel = 'app'
): AlertRule {
    const rule: AlertRule = {
        id: randomUUID(),
        name,
        symbol: symbol.toUpperCase(),
        condition,
        value,
        channel,
        active: true,
        triggeredCount: 0,
        createdAt: new Date().toISOString(),
    };

    alertRules.set(rule.id, rule);
    console.log(`[NotificationAgent] Alert created: ${name} (${symbol} ${condition} ${value})`);

    return rule;
}

function getAlertRules(symbol?: string): AlertRule[] {
    const rules = Array.from(alertRules.values());
    if (symbol) {
        return rules.filter(r => r.symbol === symbol.toUpperCase());
    }
    return rules;
}

function deleteAlertRule(ruleId: string): boolean {
    return alertRules.delete(ruleId);
}

function getRecentNotifications(limit: number = 10): Notification[] {
    return Array.from(notifications.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}

// ============================================================================
// Agent Card
// ============================================================================

export const getNotificationAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Notification Agent',
    description: 'Set up price alerts and receive trading notifications via multiple channels: email, Slack, Telegram, or in-app. Get notified when your conditions are met.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/notification`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'create-alert',
            name: 'Create Price Alert',
            description: 'Set up a price alert for a symbol',
            tags: ['alert', 'price', 'notification'],
            examples: ['alert when BTC above 100000', 'notify me if ETH drops below 3000'],
        },
        {
            id: 'list-alerts',
            name: 'List Alerts',
            description: 'Show all active alerts',
            tags: ['alerts', 'list', 'show'],
            examples: ['show my alerts', 'list alerts', 'what alerts do I have?'],
        },
        {
            id: 'send-notification',
            name: 'Send Notification',
            description: 'Send a test notification',
            tags: ['send', 'test', 'notify'],
            examples: ['send test notification', 'test slack', 'test email'],
        },
        {
            id: 'configure',
            name: 'Configure Channels',
            description: 'Set up notification channels',
            tags: ['configure', 'setup', 'channel'],
            examples: ['configure email mario@example.com', 'setup slack', 'configure telegram'],
        },
        {
            id: 'history',
            name: 'Notification History',
            description: 'View recent notifications',
            tags: ['history', 'recent', 'log'],
            examples: ['notification history', 'recent alerts', 'show notifications'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column']
        },
    },
});

// ============================================================================
// Intent Detection
// ============================================================================

interface NotificationIntent {
    action: 'create-alert' | 'list-alerts' | 'delete-alert' | 'send' | 'configure' | 'history' | 'help';
    symbol?: string;
    condition?: 'above' | 'below';
    value?: number;
    channel?: NotificationChannel;
    configValue?: string;
    alertId?: string;
}

function parseNotificationIntent(text: string): NotificationIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;

    // Extract price value
    const valueMatch = lower.match(/(\d+\.?\d*)/);
    const value = valueMatch ? parseFloat(valueMatch[1]) : undefined;

    // Extract channel
    let channel: NotificationChannel | undefined;
    if (lower.includes('email')) channel = 'email';
    else if (lower.includes('slack')) channel = 'slack';
    else if (lower.includes('telegram')) channel = 'telegram';
    else if (lower.includes('all')) channel = 'all';

    // Extract email/webhook for configuration
    const emailMatch = lower.match(/[\w.-]+@[\w.-]+\.\w+/);
    const configValue = emailMatch ? emailMatch[0] : undefined;

    // Determine action
    if (lower.includes('configure') || lower.includes('setup') || lower.includes('set up')) {
        return { action: 'configure', channel, configValue };
    }
    if (lower.includes('history') || lower.includes('recent') || lower.includes('log')) {
        return { action: 'history' };
    }
    if (lower.includes('list') || lower.includes('show') && lower.includes('alert')) {
        return { action: 'list-alerts', symbol };
    }
    if (lower.includes('delete') || lower.includes('remove')) {
        return { action: 'delete-alert' };
    }
    if (lower.includes('send') || lower.includes('test')) {
        return { action: 'send', channel: channel || 'app' };
    }
    if (lower.includes('alert') || lower.includes('notify') || lower.includes('when')) {
        const condition = lower.includes('below') || lower.includes('drop') || lower.includes('under') ? 'below' : 'above';
        return { action: 'create-alert', symbol, condition, value, channel: channel || 'app' };
    }

    return { action: 'help' };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
}

function priorityEmoji(priority: NotificationPriority): string {
    switch (priority) {
        case 'critical': return '🚨';
        case 'high': return '⚠️';
        case 'medium': return '📢';
        default: return '📝';
    }
}

function channelEmoji(channel: NotificationChannel): string {
    switch (channel) {
        case 'email': return '📧';
        case 'slack': return '💬';
        case 'telegram': return '✈️';
        case 'all': return '📡';
        default: return '🔔';
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateAlertsCard(alerts: AlertRule[]): A2UIMessage[] {
    const alertComponents: Array<{ id: string; component: object }> = [];
    const alertIds: string[] = [];

    alerts.forEach((alert, idx) => {
        const id = `alert-${idx}`;
        alertIds.push(id);

        alertComponents.push({
            id,
            component: {
                Row: {
                    children: [`${id}-icon`, `${id}-name`, `${id}-condition`, `${id}-action`]
                }
            },
        });
        alertComponents.push({
            id: `${id}-icon`,
            component: { Text: { text: { literalString: alert.active ? '🔔' : '🔕' } } },
        });
        alertComponents.push({
            id: `${id}-name`,
            component: { Text: { text: { literalString: `${alert.symbol}` }, semantic: 'h4' } },
        });
        alertComponents.push({
            id: `${id}-condition`,
            component: {
                Text: {
                    text: { literalString: `${alert.condition} ${formatPrice(alert.value)}` },
                    variant: 'secondary',
                }
            },
        });
        alertComponents.push({
            id: `${id}-action`,
            component: {
                Button: {
                    label: { literalString: 'Delete' },
                    action: { input: { text: `delete alert ${alert.id}` } },
                },
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'alerts-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#3B82F6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'alerts-list',
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', ...alertIds, 'add-btn'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: `Active Alerts (${alerts.length})` }, semantic: 'h2' } },
                },
                ...alertComponents,
                {
                    id: 'add-btn',
                    component: {
                        Button: {
                            label: { literalString: '+ Create New Alert' },
                            action: { input: { text: 'alert when BTC above 100000' } },
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

export async function handleNotificationRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[NotificationAgent] Processing: "${userText}"`);

    const intent = parseNotificationIntent(userText);
    console.log(`[NotificationAgent] Intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'create-alert': {
                if (!intent.symbol) {
                    responseText = 'Please specify a symbol. Example: "alert when BTC above 100000"';
                    break;
                }
                if (!intent.value) {
                    responseText = `Please specify a price. Example: "alert when ${intent.symbol} ${intent.condition || 'above'} 50000"`;
                    break;
                }

                const alertName = `${intent.symbol} ${intent.condition} ${formatPrice(intent.value)}`;
                const rule = createAlertRule(
                    alertName,
                    intent.symbol,
                    intent.condition || 'above',
                    intent.value,
                    intent.channel
                );

                responseText = `🔔 Alert created!\n${rule.symbol} ${rule.condition} ${formatPrice(rule.value)}\nNotify via: ${channelEmoji(rule.channel)} ${rule.channel}`;
                break;
            }

            case 'list-alerts': {
                const alerts = getAlertRules(intent.symbol);
                if (alerts.length === 0) {
                    responseText = intent.symbol
                        ? `No alerts for ${intent.symbol}. Create one with "alert when ${intent.symbol} above/below <price>"`
                        : 'No alerts set. Create one with "alert when BTC above 100000"';
                } else {
                    responseText = `📋 Active Alerts (${alerts.length}):\n` +
                        alerts.map(a => `• ${a.symbol} ${a.condition} ${formatPrice(a.value)} via ${a.channel}`).join('\n');
                    a2uiMessages = generateAlertsCard(alerts);
                }
                break;
            }

            case 'delete-alert': {
                // In a real implementation, we'd extract the alert ID
                responseText = 'To delete an alert, use "list alerts" first and click the delete button next to the alert you want to remove.';
                break;
            }

            case 'send': {
                const notification = await sendNotification(
                    intent.channel || 'app',
                    '🧪 Test Notification',
                    'This is a test notification from the Trading Bot.',
                    'low'
                );

                if (notification.status === 'sent') {
                    responseText = `✅ Test notification sent via ${channelEmoji(notification.channel)} ${notification.channel}!`;
                } else {
                    responseText = `❌ Failed: ${notification.error}`;
                }
                break;
            }

            case 'configure': {
                if (!intent.channel) {
                    responseText = `📋 Channel Configuration:\n` +
                        `• ${channelEmoji('email')} Email: ${channelConfig.email.enabled ? '✅ Configured' : '❌ Not configured'}\n` +
                        `• ${channelEmoji('slack')} Slack: ${channelConfig.slack.enabled ? '✅ Configured' : '❌ Not configured'}\n` +
                        `• ${channelEmoji('telegram')} Telegram: ${channelConfig.telegram.enabled ? '✅ Configured' : '❌ Not configured'}\n` +
                        `• ${channelEmoji('app')} In-App: ✅ Always active\n\n` +
                        `To configure: "configure email your@email.com"`;
                } else if (intent.channel === 'email' && intent.configValue) {
                    channelConfig.email.enabled = true;
                    channelConfig.email.address = intent.configValue as any;
                    responseText = `✅ Email configured: ${intent.configValue}`;
                } else {
                    responseText = `To configure ${intent.channel}, provide the required value.\nExample: "configure email your@email.com"`;
                }
                break;
            }

            case 'history': {
                const recent = getRecentNotifications(5);
                if (recent.length === 0) {
                    responseText = 'No notifications yet. Send a test with "send test notification"';
                } else {
                    responseText = `📜 Recent Notifications:\n` +
                        recent.map(n => `${priorityEmoji(n.priority)} ${n.title} (${n.status})`).join('\n');
                }
                break;
            }

            default:
                responseText = `🔔 Notification Agent\n\nCommands:\n• "alert when BTC above 100000" - Create price alert\n• "list alerts" - Show all alerts\n• "send test notification" - Test notifications\n• "configure email/slack/telegram" - Set up channels\n• "notification history" - View recent alerts`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'notification-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[NotificationAgent] Error:', error);
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
