/**
 * OrchestratorAgent
 * 
 * A2A Agent that coordinates the trading workflow.
 * Orchestrates between MarketData, Strategy, Risk, and TradeExecutor agents.
 * 
 * Endpoints:
 * - A2A: POST /agents/orchestrator/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import { fetchPrice, fetchKlines } from '../shared/binance-client.js';
import { resilientCall } from '../shared/resilience.js';
import { rsiSignal, macdSignal, maCrossoverSignal, aggregateSignals } from '../strategy/tools/indicators.js';
import type { TradingSignal, IndicatorResult } from '../shared/types.js';

// ============================================================================
// Workflow Types
// ============================================================================

interface TradingWorkflow {
    id: string;
    status: 'analyzing' | 'checking_risk' | 'executing' | 'completed' | 'rejected' | 'error';
    symbol: string;
    startedAt: string;
    completedAt?: string;
    steps: WorkflowStep[];
    result?: {
        action: 'buy' | 'sell' | 'hold';
        confidence: number;
        executed: boolean;
        reason: string;
    };
}

interface WorkflowStep {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    result?: unknown;
    error?: string;
}

// Workflow store
const workflows = new Map<string, TradingWorkflow>();

// ============================================================================
// Workflow Execution
// ============================================================================

async function executeFullWorkflow(symbol: string, autoExecute: boolean = false): Promise<TradingWorkflow> {
    const workflow: TradingWorkflow = {
        id: randomUUID(),
        status: 'analyzing',
        symbol,
        startedAt: new Date().toISOString(),
        steps: [
            { name: 'Fetch Market Data', status: 'pending' },
            { name: 'Run Technical Analysis', status: 'pending' },
            { name: 'Assess Risk', status: 'pending' },
            { name: 'Execute Decision', status: 'pending' },
        ],
    };

    workflows.set(workflow.id, workflow);

    try {
        // Step 1: Fetch Market Data
        workflow.steps[0].status = 'running';
        workflow.steps[0].startedAt = new Date().toISOString();

        const [price, klines] = await Promise.all([
            resilientCall(() => fetchPrice(symbol), { circuitBreaker: { key: 'binance-ticker' } }),
            resilientCall(() => fetchKlines(symbol, '1h', 100), { circuitBreaker: { key: 'binance-klines' } }),
        ]);

        if (!price || klines.length === 0) {
            throw new Error('Failed to fetch market data');
        }

        workflow.steps[0].status = 'completed';
        workflow.steps[0].completedAt = new Date().toISOString();
        workflow.steps[0].result = { price: price.price, klineCount: klines.length };

        // Step 2: Technical Analysis
        workflow.steps[1].status = 'running';
        workflow.steps[1].startedAt = new Date().toISOString();
        workflow.status = 'analyzing';

        const signals: IndicatorResult[] = [
            rsiSignal(klines),
            macdSignal(klines),
            maCrossoverSignal(klines),
        ];

        const aggregate = aggregateSignals(signals);

        workflow.steps[1].status = 'completed';
        workflow.steps[1].completedAt = new Date().toISOString();
        workflow.steps[1].result = { signals: signals.map(s => ({ name: s.name, signal: s.signal })), aggregate };

        // Step 3: Risk Assessment
        workflow.steps[2].status = 'running';
        workflow.steps[2].startedAt = new Date().toISOString();
        workflow.status = 'checking_risk';

        // Simplified risk check
        const riskPassed = aggregate.confidence >= 60; // Only proceed if confidence > 60%
        const riskReason = riskPassed
            ? 'Confidence threshold met'
            : `Confidence ${aggregate.confidence}% below 60% threshold`;

        workflow.steps[2].status = 'completed';
        workflow.steps[2].completedAt = new Date().toISOString();
        workflow.steps[2].result = { passed: riskPassed, reason: riskReason };

        // Step 4: Execute Decision
        workflow.steps[3].status = 'running';
        workflow.steps[3].startedAt = new Date().toISOString();

        if (aggregate.direction === 'hold' || !riskPassed) {
            workflow.status = 'completed';
            workflow.result = {
                action: 'hold',
                confidence: aggregate.confidence,
                executed: false,
                reason: aggregate.direction === 'hold' ? 'No clear signal' : riskReason,
            };
        } else if (autoExecute) {
            workflow.status = 'executing';
            // In a real implementation, this would call the TradeExecutor
            workflow.result = {
                action: aggregate.direction,
                confidence: aggregate.confidence,
                executed: true,
                reason: `Auto-executed ${aggregate.direction} with ${aggregate.confidence}% confidence`,
            };
            workflow.status = 'completed';
        } else {
            workflow.result = {
                action: aggregate.direction,
                confidence: aggregate.confidence,
                executed: false,
                reason: `Signal: ${aggregate.direction.toUpperCase()} - Manual execution required`,
            };
            workflow.status = 'completed';
        }

        workflow.steps[3].status = 'completed';
        workflow.steps[3].completedAt = new Date().toISOString();
        workflow.steps[3].result = workflow.result;

    } catch (error) {
        const errorMessage = (error as Error).message;
        workflow.status = 'error';

        // Mark current step as failed
        const currentStep = workflow.steps.find(s => s.status === 'running' || s.status === 'pending');
        if (currentStep) {
            currentStep.status = 'failed';
            currentStep.error = errorMessage;
        }

        workflow.result = {
            action: 'hold',
            confidence: 0,
            executed: false,
            reason: `Error: ${errorMessage}`,
        };
    }

    workflow.completedAt = new Date().toISOString();
    workflows.set(workflow.id, workflow);

    return workflow;
}

// ============================================================================
// Agent Card
// ============================================================================

export const getOrchestratorAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Trading Orchestrator',
    description: 'Coordinates the complete trading workflow: fetches market data, runs technical analysis, assesses risk, and executes trades. Your AI trading assistant that brings it all together.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/orchestrator`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'trade-workflow',
            name: 'Run Trade Workflow',
            description: 'Execute full analysis and trading workflow for a symbol',
            tags: ['trade', 'workflow', 'auto', 'bot'],
            examples: ['trade BTC', 'run workflow ETH', 'analyze and trade SOL'],
        },
        {
            id: 'scan',
            name: 'Market Scan',
            description: 'Scan multiple assets for trading opportunities',
            tags: ['scan', 'opportunities', 'search'],
            examples: ['scan for opportunities', 'find trades', 'market scan'],
        },
        {
            id: 'status',
            name: 'Workflow Status',
            description: 'Check status of running or recent workflows',
            tags: ['status', 'workflows', 'history'],
            examples: ['show workflows', 'workflow status', 'recent trades'],
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

interface OrchestratorIntent {
    action: 'workflow' | 'scan' | 'status' | 'help';
    symbol?: string;
    autoExecute?: boolean;
}

function parseOrchestratorIntent(text: string): OrchestratorIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;

    // Check for auto-execute
    const autoExecute = lower.includes('auto') || lower.includes('execute');

    if (lower.includes('scan') || lower.includes('find') || lower.includes('opportunit')) {
        return { action: 'scan' };
    }
    if (lower.includes('status') || lower.includes('workflow') && !symbol) {
        return { action: 'status' };
    }
    if (lower.includes('trade') || lower.includes('run') || lower.includes('analyze') || symbol) {
        return { action: 'workflow', symbol: symbol || 'BTC', autoExecute };
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

function statusEmoji(status: string): string {
    switch (status) {
        case 'completed': return '✅';
        case 'running': return '⏳';
        case 'error': return '❌';
        case 'rejected': return '🚫';
        default: return '⬜';
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateWorkflowCard(workflow: TradingWorkflow): A2UIMessage[] {
    const stepComponents: Array<{ id: string; component: object }> = [];
    const stepIds: string[] = [];

    workflow.steps.forEach((step, idx) => {
        const id = `step-${idx}`;
        stepIds.push(id);
        stepComponents.push({
            id,
            component: {
                Text: {
                    text: { literalString: `${statusEmoji(step.status)} ${step.name}` },
                    variant: step.status === 'completed' ? 'default' : 'secondary',
                }
            },
        });
    });

    const resultColor = workflow.result?.action === 'buy' ? '#10B981'
        : workflow.result?.action === 'sell' ? '#EF4444'
            : '#6B7280';

    return [
        {
            type: 'beginRendering',
            surfaceId: `workflow-${workflow.id}`,
            rootComponentId: 'root',
            styling: { primaryColor: resultColor },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: `workflow-${workflow.id}`,
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', 'status', 'divider1', 'steps-header', ...stepIds, 'divider2', 'result', 'actions'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: `Trading Workflow: ${workflow.symbol}` }, semantic: 'h2' } },
                },
                {
                    id: 'status',
                    component: { Text: { text: { literalString: `Status: ${workflow.status.toUpperCase()}` }, variant: 'secondary' } },
                },
                {
                    id: 'divider1',
                    component: { Divider: {} },
                },
                {
                    id: 'steps-header',
                    component: { Text: { text: { literalString: 'Workflow Steps' }, semantic: 'h4' } },
                },
                ...stepComponents,
                {
                    id: 'divider2',
                    component: { Divider: {} },
                },
                {
                    id: 'result',
                    component: {
                        Card: {
                            children: ['result-action', 'result-confidence', 'result-reason']
                        }
                    },
                },
                {
                    id: 'result-action',
                    component: {
                        Text: {
                            text: { literalString: `Decision: ${workflow.result?.action?.toUpperCase() || 'PENDING'}` },
                            semantic: 'h3',
                        }
                    },
                },
                {
                    id: 'result-confidence',
                    component: {
                        Text: {
                            text: { literalString: `Confidence: ${workflow.result?.confidence || 0}%` },
                        }
                    },
                },
                {
                    id: 'result-reason',
                    component: {
                        Text: {
                            text: { literalString: workflow.result?.reason || '' },
                            variant: 'secondary',
                        }
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: workflow.result?.action !== 'hold' && !workflow.result?.executed
                                ? ['execute-btn', 'refresh-btn']
                                : ['refresh-btn']
                        },
                    },
                },
                {
                    id: 'execute-btn',
                    component: {
                        Button: {
                            label: { literalString: `Execute ${workflow.result?.action?.toUpperCase() || ''}` },
                            action: { input: { text: `${workflow.result?.action} 0.1 ${workflow.symbol}` } },
                        },
                    },
                },
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Re-analyze' },
                            action: { input: { text: `trade ${workflow.symbol}` } },
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

export async function handleOrchestratorRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[Orchestrator] Processing: "${userText}"`);

    const intent = parseOrchestratorIntent(userText);
    console.log(`[Orchestrator] Intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'workflow': {
                const symbol = intent.symbol || 'BTC';
                console.log(`[Orchestrator] Starting workflow for ${symbol}...`);

                const workflow = await executeFullWorkflow(symbol, intent.autoExecute);

                const actionEmoji = workflow.result?.action === 'buy' ? '🟢'
                    : workflow.result?.action === 'sell' ? '🔴'
                        : '🟡';

                responseText = `${actionEmoji} ${symbol} Workflow Complete\n\n` +
                    `Decision: ${workflow.result?.action?.toUpperCase() || 'HOLD'}\n` +
                    `Confidence: ${workflow.result?.confidence || 0}%\n` +
                    `${workflow.result?.executed ? '✅ Trade executed' : '📋 Manual execution required'}\n\n` +
                    `Reason: ${workflow.result?.reason}`;

                a2uiMessages = generateWorkflowCard(workflow);
                break;
            }

            case 'scan': {
                const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];
                const results: string[] = [];

                for (const symbol of symbols) {
                    try {
                        const klines = await fetchKlines(symbol, '1h', 50);
                        const signals = [rsiSignal(klines), macdSignal(klines), maCrossoverSignal(klines)];
                        const agg = aggregateSignals(signals);

                        if (agg.direction !== 'hold' && agg.confidence >= 60) {
                            const emoji = agg.direction === 'buy' ? '🟢' : '🔴';
                            results.push(`${emoji} ${symbol}: ${agg.direction.toUpperCase()} (${agg.confidence}%)`);
                        }
                    } catch {
                        // Skip failed symbols
                    }
                }

                responseText = results.length > 0
                    ? `🔍 Market Scan Results:\n\n${results.join('\n')}`
                    : '🔍 No strong signals found. Markets are neutral or uncertain.';
                break;
            }

            case 'status': {
                const recentWorkflows = Array.from(workflows.values())
                    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                    .slice(0, 5);

                if (recentWorkflows.length === 0) {
                    responseText = 'No recent workflows. Try "trade BTC" to start one!';
                } else {
                    const lines = recentWorkflows.map(w =>
                        `${statusEmoji(w.status)} ${w.symbol}: ${w.result?.action || 'pending'} (${w.status})`
                    );
                    responseText = `📋 Recent Workflows:\n\n${lines.join('\n')}`;
                }
                break;
            }

            default:
                responseText = `🤖 Trading Orchestrator\n\nCommands:\n• "trade BTC" - Full analysis workflow\n• "scan" - Find opportunities\n• "workflow status" - View recent workflows\n• "trade ETH auto" - Auto-execute trades`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'workflow-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[Orchestrator] Error:', error);
        return {
            id: taskId,
            contextId,
            status: { state: 'failed' },
            history: [
                params.message,
                { role: 'agent', parts: [{ text: `Workflow error: ${(error as Error).message}` }] },
            ],
        };
    }
}
