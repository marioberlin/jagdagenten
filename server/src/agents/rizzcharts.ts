import type { AgentCard, A2AMessage, A2UIMessage, Task, SendMessageParams } from '../a2a/types';
import { randomUUID } from 'crypto';

// Simple chart example
const cryptoPortfolioChart: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'portfolio-chart',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'portfolio-chart',
        components: [
            {
                id: 'root',
                component: {
                    Card: {
                        children: ['title', 'chart-placeholder', 'metrics'],
                    },
                },
            },
            {
                id: 'title',
                component: {
                    Text: {
                        text: { literalString: 'Portfolio Allocation' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'chart-placeholder',
                component: {
                    Text: {
                        text: { literalString: '[Chart Visualization Would Go Here]' },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: 'metrics',
                component: {
                    Row: {
                        children: ['btc-metric', 'eth-metric'],
                    },
                },
            },
            {
                id: 'btc-metric',
                component: {
                    Column: {
                        children: ['btc-label', 'btc-value'],
                    },
                },
            },
            {
                id: 'btc-label',
                component: { Text: { text: { literalString: 'Bitcoin' }, variant: 'secondary' } },
            },
            {
                id: 'btc-value',
                component: { Text: { text: { literalString: '45%' }, semantic: 'h4' } },
            },
            {
                id: 'eth-metric',
                component: {
                    Column: {
                        children: ['eth-label', 'eth-value'],
                    },
                },
            },
            {
                id: 'eth-label',
                component: { Text: { text: { literalString: 'Ethereum' }, variant: 'secondary' } },
            },
            {
                id: 'eth-value',
                component: { Text: { text: { literalString: '30%' }, semantic: 'h4' } },
            },
        ],
    },
];

export const getRizzChartsAgentCard = (baseUrl: string): AgentCard => ({
    name: 'RizzCharts Analytics',
    description: 'Data visualization and analytics agent',
    url: `${baseUrl}/agents/rizzcharts`,
    version: '1.5.0',
    provider: { name: 'LiquidCrypto Agents' },
    capabilities: { streaming: false, a2ui: true, pushNotifications: false },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'Text', 'Row', 'Column'] }
    }
});

export async function handleRizzChartsRequest(params: SendMessageParams): Promise<any> {
    const prompt = params.message.parts
        // @ts-ignore
        .filter(p => p.type === 'text').map(p => p.text).join(' ').toLowerCase();

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const textResponse = "I've generated the visualization based on the latest market data.";
    const a2uiMessages = cryptoPortfolioChart;

    const taskId = randomUUID();
    return {
        id: taskId,
        contextId: 'chart-context',
        status: { state: 'completed', timestamp: new Date().toISOString() },
        artifacts: [
            {
                name: 'chart',
                parts: [
                    { type: 'text', text: textResponse },
                    { type: 'a2ui', a2ui: a2uiMessages }
                ]
            }
        ],
        history: []
    };
}
