import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Portfolio Data Service
// ============================================================================

interface PortfolioHolding {
    symbol: string;
    amount: number;
    value: number;
    avgBuyPrice?: number;
}

interface PortfolioData {
    totalValue: number;
    holdings: PortfolioHolding[];
}

interface MarketStats {
    totalMarketCap: number;
    volume24h: number;
    btcDominance: number;
    FearGreedIndex: number;
    topGainers?: Array<{ symbol: string; change: number }>;
    topLosers?: Array<{ symbol: string; change: number }>;
}

// Fetch portfolio data from the internal API
async function getPortfolioData(): Promise<PortfolioData> {
    try {
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/v1/portfolio`);
        if (response.ok) {
            const result = await response.json() as { data: { portfolio: PortfolioData } };
            return result.data.portfolio;
        }
    } catch {
        // Fall back to sample data
    }
    return {
        totalValue: 125000.50,
        holdings: [
            { symbol: 'BTC', amount: 1.5, value: 67500 },
            { symbol: 'ETH', amount: 10, value: 35000 },
            { symbol: 'SOL', amount: 50, value: 22500.50 },
        ],
    };
}

// Fetch market stats from the internal API
async function getMarketStats(): Promise<MarketStats> {
    try {
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/v1/market`);
        if (response.ok) {
            const result = await response.json() as { data: { marketStats: MarketStats } };
            return result.data.marketStats;
        }
    } catch {
        // Fall back to sample data
    }
    return {
        totalMarketCap: 2500000000000,
        volume24h: 95000000000,
        btcDominance: 52.5,
        FearGreedIndex: 65,
    };
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generatePortfolioChart(portfolio: PortfolioData): A2UIMessage[] {
    // Calculate percentages
    const holdingsWithPct = portfolio.holdings.map(h => ({
        ...h,
        percentage: ((h.value / portfolio.totalValue) * 100).toFixed(1),
    }));

    // Build dynamic metric components
    const metricChildren: string[] = [];
    const metricComponents: Array<{ id: string; component: object }> = [];

    holdingsWithPct.forEach((h, idx) => {
        const metricId = `metric-${idx}`;
        const labelId = `label-${idx}`;
        const valueId = `value-${idx}`;
        const amountId = `amount-${idx}`;

        metricChildren.push(metricId);

        metricComponents.push(
            {
                id: metricId,
                component: {
                    Column: {
                        children: [labelId, valueId, amountId],
                    },
                },
            },
            {
                id: labelId,
                component: { Text: { text: { literalString: h.symbol }, variant: 'secondary' } },
            },
            {
                id: valueId,
                component: { Text: { text: { literalString: `${h.percentage}%` }, semantic: 'h4' } },
            },
            {
                id: amountId,
                component: { Text: { text: { literalString: `$${h.value.toLocaleString()}` }, variant: 'secondary' } },
            }
        );
    });

    return [
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
                            children: ['title', 'total-value', 'divider', 'metrics', 'refresh-btn'],
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
                    id: 'total-value',
                    component: {
                        Text: {
                            text: { literalString: `Total: $${portfolio.totalValue.toLocaleString()}` },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'divider',
                    component: { Divider: {} },
                },
                {
                    id: 'metrics',
                    component: {
                        Row: {
                            children: metricChildren,
                        },
                    },
                },
                ...metricComponents,
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh Data' },
                            action: {
                                input: { text: 'Show my portfolio' },
                            },
                        },
                    },
                },
            ],
        },
    ];
}

function generateMarketOverview(stats: MarketStats): A2UIMessage[] {
    const formatBillion = (n: number) => `$${(n / 1e9).toFixed(1)}B`;

    return [
        {
            type: 'beginRendering',
            surfaceId: 'market-overview',
            rootComponentId: 'root',
            styling: { primaryColor: '#10b981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'market-overview',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['title', 'stats-row', 'sentiment-row'],
                        },
                    },
                },
                {
                    id: 'title',
                    component: {
                        Text: {
                            text: { literalString: 'Market Overview' },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'stats-row',
                    component: {
                        Row: {
                            children: ['mcap-col', 'vol-col', 'btc-dom-col'],
                        },
                    },
                },
                {
                    id: 'mcap-col',
                    component: {
                        Column: {
                            children: ['mcap-label', 'mcap-value'],
                        },
                    },
                },
                {
                    id: 'mcap-label',
                    component: { Text: { text: { literalString: 'Market Cap' }, variant: 'secondary' } },
                },
                {
                    id: 'mcap-value',
                    component: { Text: { text: { literalString: formatBillion(stats.totalMarketCap) }, semantic: 'h4' } },
                },
                {
                    id: 'vol-col',
                    component: {
                        Column: {
                            children: ['vol-label', 'vol-value'],
                        },
                    },
                },
                {
                    id: 'vol-label',
                    component: { Text: { text: { literalString: '24h Volume' }, variant: 'secondary' } },
                },
                {
                    id: 'vol-value',
                    component: { Text: { text: { literalString: formatBillion(stats.volume24h) }, semantic: 'h4' } },
                },
                {
                    id: 'btc-dom-col',
                    component: {
                        Column: {
                            children: ['btc-dom-label', 'btc-dom-value'],
                        },
                    },
                },
                {
                    id: 'btc-dom-label',
                    component: { Text: { text: { literalString: 'BTC Dominance' }, variant: 'secondary' } },
                },
                {
                    id: 'btc-dom-value',
                    component: { Text: { text: { literalString: `${stats.btcDominance}%` }, semantic: 'h4' } },
                },
                {
                    id: 'sentiment-row',
                    component: {
                        Row: {
                            children: ['fear-greed-label', 'fear-greed-value'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'fear-greed-label',
                    component: { Text: { text: { literalString: 'Fear & Greed Index:' }, variant: 'secondary' } },
                },
                {
                    id: 'fear-greed-value',
                    component: {
                        Text: {
                            text: { literalString: `${stats.FearGreedIndex} (${stats.FearGreedIndex >= 50 ? 'Greed' : 'Fear'})` },
                            semantic: 'h4',
                        },
                    },
                },
            ],
        },
    ];
}

export const getRizzChartsAgentCard = (baseUrl: string): AgentCard => ({
    name: 'RizzCharts Analytics',
    description: 'Data visualization and analytics agent with real-time market data',
    url: `${baseUrl}/agents/rizzcharts`,
    version: '1.6.0',
    protocolVersion: '1.0',
    supportedVersions: ['1.0', '0.3.0'],
    provider: { organization: 'LiquidCrypto Agents' },
    capabilities: { streaming: false, pushNotifications: false },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'Text', 'Row', 'Column', 'Button', 'Divider'] }
    }
});

export async function handleRizzChartsRequest(params: SendMessageParams): Promise<any> {
    const prompt = params.message.parts
        // @ts-ignore
        .filter(p => p.type === 'text').map(p => p.text).join(' ').toLowerCase();

    // Determine what type of visualization to show based on intent
    let a2uiMessages: A2UIMessage[];
    let textResponse: string;

    if (prompt.includes('market') || prompt.includes('overview') || prompt.includes('stats')) {
        // Market overview request
        const stats = await getMarketStats();
        a2uiMessages = generateMarketOverview(stats);
        textResponse = `Here's the current market overview. Total market cap is $${(stats.totalMarketCap / 1e12).toFixed(2)} trillion with ${stats.btcDominance}% BTC dominance.`;
    } else {
        // Default to portfolio view
        const portfolio = await getPortfolioData();
        a2uiMessages = generatePortfolioChart(portfolio);
        textResponse = `Here's your portfolio allocation. Total value: $${portfolio.totalValue.toLocaleString()} across ${portfolio.holdings.length} assets.`;
    }

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
