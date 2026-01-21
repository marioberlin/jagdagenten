/**
 * MaintenanceAgent
 * 
 * A2A Agent for system health, cleanup, and maintenance tasks.
 * Monitors agent status, cleans up old data, and performs diagnostics.
 * 
 * Endpoints:
 * - A2A: POST /agents/maintenance/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    message?: string;
    checkedAt: string;
}

interface SystemStats {
    uptime: number;
    memoryUsage: number;
    activeAgents: number;
    totalRequests: number;
    errorRate: number;
}

interface MaintenanceTask {
    id: string;
    name: string;
    type: 'cleanup' | 'backup' | 'optimize' | 'check';
    status: 'pending' | 'running' | 'completed' | 'failed';
    scheduledAt?: string;
    startedAt?: string;
    completedAt?: string;
    result?: string;
}

// ============================================================================
// Mock System State
// ============================================================================

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

const agentStatus: Record<string, HealthCheck> = {
    'market-data': { service: 'MarketDataAgent', status: 'healthy', latency: 45, checkedAt: new Date().toISOString() },
    'trade-executor': { service: 'TradeExecutorAgent', status: 'healthy', latency: 12, checkedAt: new Date().toISOString() },
    'strategy': { service: 'StrategyAgent', status: 'healthy', latency: 89, checkedAt: new Date().toISOString() },
    'risk': { service: 'RiskAgent', status: 'healthy', latency: 23, checkedAt: new Date().toISOString() },
    'orchestrator': { service: 'OrchestratorAgent', status: 'healthy', latency: 156, checkedAt: new Date().toISOString() },
    'notification': { service: 'NotificationAgent', status: 'healthy', latency: 34, checkedAt: new Date().toISOString() },
    'symbol-manager': { service: 'SymbolManagerAgent', status: 'healthy', latency: 8, checkedAt: new Date().toISOString() },
    'webhook-gateway': { service: 'WebhookGatewayAgent', status: 'healthy', latency: 15, checkedAt: new Date().toISOString() },
};

const externalServices: Record<string, HealthCheck> = {
    'binance-api': { service: 'Binance API', status: 'healthy', latency: 120, checkedAt: new Date().toISOString() },
    'database': { service: 'PostgreSQL', status: 'healthy', latency: 5, checkedAt: new Date().toISOString() },
    'redis': { service: 'Redis Cache', status: 'healthy', latency: 2, checkedAt: new Date().toISOString() },
};

const recentTasks: MaintenanceTask[] = [];

// ============================================================================
// Health & Maintenance Functions
// ============================================================================

function getSystemStats(): SystemStats {
    const uptimeMs = Date.now() - startTime;
    const memUsage = process.memoryUsage?.()?.heapUsed || 50000000;

    return {
        uptime: Math.floor(uptimeMs / 1000),
        memoryUsage: Math.round(memUsage / 1024 / 1024),
        activeAgents: Object.keys(agentStatus).length,
        totalRequests: requestCount,
        errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
    };
}

async function runHealthCheck(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check all agents
    for (const [id, check] of Object.entries(agentStatus)) {
        // Simulate health check
        const latency = Math.floor(Math.random() * 100) + 10;
        const status = latency < 200 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy';

        agentStatus[id] = {
            ...check,
            latency,
            status,
            checkedAt: new Date().toISOString(),
        };
        checks.push(agentStatus[id]);
    }

    // Check external services
    for (const [id, check] of Object.entries(externalServices)) {
        const latency = Math.floor(Math.random() * 150) + 5;
        const status = latency < 300 ? 'healthy' : 'degraded';

        externalServices[id] = {
            ...check,
            latency,
            status,
            checkedAt: new Date().toISOString(),
        };
        checks.push(externalServices[id]);
    }

    return checks;
}

async function runCleanup(): Promise<MaintenanceTask> {
    const task: MaintenanceTask = {
        id: randomUUID(),
        name: 'Data Cleanup',
        type: 'cleanup',
        status: 'running',
        startedAt: new Date().toISOString(),
    };

    recentTasks.unshift(task);

    // Simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 500));

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = 'Cleaned up 142 old records, freed 12MB';

    return task;
}

async function runOptimization(): Promise<MaintenanceTask> {
    const task: MaintenanceTask = {
        id: randomUUID(),
        name: 'Cache Optimization',
        type: 'optimize',
        status: 'running',
        startedAt: new Date().toISOString(),
    };

    recentTasks.unshift(task);

    await new Promise(resolve => setTimeout(resolve, 300));

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = 'Optimized cache, hit rate improved by 8%';

    return task;
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// ============================================================================
// Agent Card
// ============================================================================

export const getMaintenanceAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Maintenance Agent',
    description: 'Monitor system health, run diagnostics, and perform maintenance tasks. Keep your trading infrastructure running smoothly.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/maintenance`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'health-check',
            name: 'Health Check',
            description: 'Check system health and agent status',
            tags: ['health', 'status', 'check', 'diagnostics'],
            examples: ['health check', 'system status', 'are agents healthy?'],
        },
        {
            id: 'stats',
            name: 'System Stats',
            description: 'View system statistics',
            tags: ['stats', 'metrics', 'performance'],
            examples: ['system stats', 'show metrics', 'performance report'],
        },
        {
            id: 'cleanup',
            name: 'Run Cleanup',
            description: 'Clean up old data and temporary files',
            tags: ['cleanup', 'clean', 'garbage'],
            examples: ['run cleanup', 'clean old data', 'garbage collection'],
        },
        {
            id: 'optimize',
            name: 'Optimize',
            description: 'Optimize caches and performance',
            tags: ['optimize', 'cache', 'performance'],
            examples: ['optimize cache', 'run optimization', 'improve performance'],
        },
        {
            id: 'task-history',
            name: 'Task History',
            description: 'View maintenance task history',
            tags: ['history', 'tasks', 'log'],
            examples: ['maintenance history', 'recent tasks', 'task log'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column', 'Divider']
        },
    },
});

// ============================================================================
// Intent Detection
// ============================================================================

interface MaintenanceIntent {
    action: 'health' | 'stats' | 'cleanup' | 'optimize' | 'history' | 'help';
}

function parseMaintenanceIntent(text: string): MaintenanceIntent {
    const lower = text.toLowerCase().trim();

    if (lower.includes('health') || lower.includes('status') || lower.includes('check') || lower.includes('diagnos')) {
        return { action: 'health' };
    }
    if (lower.includes('stat') || lower.includes('metric') || lower.includes('performance') || lower.includes('report')) {
        return { action: 'stats' };
    }
    if (lower.includes('clean') || lower.includes('garbage') || lower.includes('purge')) {
        return { action: 'cleanup' };
    }
    if (lower.includes('optim') || lower.includes('cache')) {
        return { action: 'optimize' };
    }
    if (lower.includes('history') || lower.includes('task') || lower.includes('log')) {
        return { action: 'history' };
    }

    return { action: 'help' };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function statusEmoji(status: string): string {
    switch (status) {
        case 'healthy': return '🟢';
        case 'degraded': return '🟡';
        case 'unhealthy': return '🔴';
        case 'completed': return '✅';
        case 'running': return '⏳';
        case 'failed': return '❌';
        default: return '⬜';
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateHealthCard(checks: HealthCheck[]): A2UIMessage[] {
    const checkComponents: Array<{ id: string; component: object }> = [];
    const checkIds: string[] = [];

    checks.forEach((check, idx) => {
        const id = `check-${idx}`;
        checkIds.push(id);

        checkComponents.push({
            id,
            component: { Row: { children: [`${id}-status`, `${id}-name`, `${id}-latency`] } },
        });
        checkComponents.push({
            id: `${id}-status`,
            component: { Text: { text: { literalString: statusEmoji(check.status) } } },
        });
        checkComponents.push({
            id: `${id}-name`,
            component: { Text: { text: { literalString: check.service } } },
        });
        checkComponents.push({
            id: `${id}-latency`,
            component: {
                Text: {
                    text: { literalString: check.latency ? `${check.latency}ms` : '-' },
                    variant: 'secondary',
                }
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'health-check',
            rootComponentId: 'root',
            styling: { primaryColor: '#10B981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'health-check',
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', ...checkIds, 'refresh-btn'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: '🏥 System Health' }, semantic: 'h2' } },
                },
                ...checkComponents,
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh Health Check' },
                            action: { input: { text: 'health check' } },
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

export async function handleMaintenanceRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();
    requestCount++;

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[MaintenanceAgent] Processing: "${userText}"`);

    const intent = parseMaintenanceIntent(userText);
    console.log(`[MaintenanceAgent] Intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'health': {
                const checks = await runHealthCheck();
                const healthy = checks.filter(c => c.status === 'healthy').length;
                const total = checks.length;
                const overallStatus = healthy === total ? 'Healthy' : healthy >= total * 0.8 ? 'Degraded' : 'Unhealthy';

                responseText = `🏥 System Health: ${statusEmoji(overallStatus.toLowerCase())} ${overallStatus}\n\n` +
                    `**Agents (${Object.keys(agentStatus).length}):**\n` +
                    Object.values(agentStatus)
                        .map(c => `${statusEmoji(c.status)} ${c.service}: ${c.latency}ms`)
                        .join('\n') +
                    `\n\n**External Services:**\n` +
                    Object.values(externalServices)
                        .map(c => `${statusEmoji(c.status)} ${c.service}: ${c.latency}ms`)
                        .join('\n');

                a2uiMessages = generateHealthCard(checks);
                break;
            }

            case 'stats': {
                const stats = getSystemStats();
                responseText = `📊 System Statistics\n\n` +
                    `**Uptime:** ${formatUptime(stats.uptime)}\n` +
                    `**Memory:** ${stats.memoryUsage} MB\n` +
                    `**Active Agents:** ${stats.activeAgents}\n` +
                    `**Total Requests:** ${stats.totalRequests}\n` +
                    `**Error Rate:** ${stats.errorRate.toFixed(2)}%`;
                break;
            }

            case 'cleanup': {
                const task = await runCleanup();
                responseText = `🧹 Cleanup Complete!\n\n` +
                    `**Task:** ${task.name}\n` +
                    `**Status:** ${statusEmoji(task.status)} ${task.status}\n` +
                    `**Result:** ${task.result}`;
                break;
            }

            case 'optimize': {
                const task = await runOptimization();
                responseText = `⚡ Optimization Complete!\n\n` +
                    `**Task:** ${task.name}\n` +
                    `**Status:** ${statusEmoji(task.status)} ${task.status}\n` +
                    `**Result:** ${task.result}`;
                break;
            }

            case 'history': {
                if (recentTasks.length === 0) {
                    responseText = 'No maintenance tasks yet. Try "run cleanup" or "optimize cache"';
                } else {
                    responseText = `📜 Recent Maintenance Tasks:\n\n` +
                        recentTasks.slice(0, 5).map(t =>
                            `${statusEmoji(t.status)} **${t.name}**\n` +
                            `${t.result || t.status}`
                        ).join('\n\n');
                }
                break;
            }

            default:
                responseText = `🔧 Maintenance Agent\n\nCommands:\n• "health check" - System health status\n• "system stats" - Performance metrics\n• "run cleanup" - Clean old data\n• "optimize cache" - Performance optimization\n• "maintenance history" - View task log`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'maintenance-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        errorCount++;
        console.error('[MaintenanceAgent] Error:', error);
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
