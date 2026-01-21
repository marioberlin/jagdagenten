/**
 * RiskAgent
 * 
 * A2A Agent for risk management and position limits.
 * Enforces stop-loss, take-profit, position limits, and exposure limits.
 * 
 * Endpoints:
 * - A2A: POST /agents/risk/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import type { RiskAssessment, RiskLimits, Position } from '../shared/types.js';
import { fetchPrice } from '../shared/binance-client.js';
import { calculateATR } from '../strategy/tools/indicators.js';
import { fetchKlines } from '../shared/binance-client.js';

// ============================================================================
// Risk Configuration
// ============================================================================

const DEFAULT_RISK_LIMITS: RiskLimits = {
    maxOpenPositions: 8,
    maxExposurePercent: 50, // Max % of portfolio in any single asset
    maxPositionSizeUsd: 1000,
    maxDailyLossPercent: 5,
};

// Mock portfolio state
interface PortfolioState {
    totalValueUsd: number;
    positions: Position[];
    dailyPnl: number;
    dailyLossLimit: number;
}

const portfolio: PortfolioState = {
    totalValueUsd: 10000, // Default test portfolio
    positions: [],
    dailyPnl: 0,
    dailyLossLimit: -500, // 5% of 10000
};

// ============================================================================
// Risk Assessment Functions
// ============================================================================

async function assessTradeRisk(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    limits: RiskLimits = DEFAULT_RISK_LIMITS
): Promise<RiskAssessment> {
    const warnings: string[] = [];
    let passesRules = true;

    // Get current price
    const asset = await fetchPrice(symbol);
    if (!asset) {
        return {
            symbol,
            riskScore: 100,
            maxPositionSize: 0,
            suggestedStopLoss: 0,
            suggestedTakeProfit: 0,
            warnings: ['Cannot fetch price data'],
            passesRules: false,
        };
    }

    const positionValueUsd = quantity * asset.price;

    // Check position size limit
    if (positionValueUsd > limits.maxPositionSizeUsd) {
        warnings.push(`Position size $${positionValueUsd.toFixed(2)} exceeds max $${limits.maxPositionSizeUsd}`);
        passesRules = false;
    }

    // Check exposure limit
    const exposurePercent = (positionValueUsd / portfolio.totalValueUsd) * 100;
    if (exposurePercent > limits.maxExposurePercent) {
        warnings.push(`Exposure ${exposurePercent.toFixed(1)}% exceeds max ${limits.maxExposurePercent}%`);
        passesRules = false;
    }

    // Check position count
    const openPositions = portfolio.positions.filter(p => p.status === 'open');
    if (side === 'BUY' && openPositions.length >= limits.maxOpenPositions) {
        warnings.push(`Already at max ${limits.maxOpenPositions} open positions`);
        passesRules = false;
    }

    // Check daily loss limit
    if (portfolio.dailyPnl < portfolio.dailyLossLimit) {
        warnings.push(`Daily loss limit reached: ${portfolio.dailyPnl.toFixed(2)} < ${portfolio.dailyLossLimit}`);
        passesRules = false;
    }

    // Calculate risk-based stop-loss using ATR
    let suggestedStopLoss = asset.price * 0.95; // Default 5%
    let suggestedTakeProfit = asset.price * 1.10; // Default 10%

    try {
        const klines = await fetchKlines(symbol, '1h', 50);
        const atr = calculateATR(klines);
        if (atr > 0) {
            // 2x ATR stop-loss, 3x ATR take-profit
            suggestedStopLoss = side === 'BUY'
                ? asset.price - (atr * 2)
                : asset.price + (atr * 2);
            suggestedTakeProfit = side === 'BUY'
                ? asset.price + (atr * 3)
                : asset.price - (atr * 3);
        }
    } catch {
        warnings.push('Could not calculate ATR-based levels, using defaults');
    }

    // Calculate risk score (0-100, higher = more risky)
    let riskScore = 0;
    riskScore += Math.min(30, (positionValueUsd / limits.maxPositionSizeUsd) * 30);
    riskScore += Math.min(30, (exposurePercent / limits.maxExposurePercent) * 30);
    riskScore += Math.min(20, (openPositions.length / limits.maxOpenPositions) * 20);
    riskScore += asset.priceChangePercent < -5 ? 20 : Math.abs(asset.priceChangePercent) > 10 ? 10 : 0;

    return {
        symbol,
        riskScore: Math.round(riskScore),
        maxPositionSize: limits.maxPositionSizeUsd / asset.price,
        suggestedStopLoss,
        suggestedTakeProfit,
        warnings,
        passesRules,
    };
}

function checkStopLoss(position: Position, currentPrice: number): { triggered: boolean; reason: string } {
    if (!position.stopLoss) {
        return { triggered: false, reason: 'No stop-loss set' };
    }

    if (position.side === 'BUY' && currentPrice <= position.stopLoss) {
        return { triggered: true, reason: `Price ${currentPrice} <= Stop-loss ${position.stopLoss}` };
    }

    if (position.side === 'SELL' && currentPrice >= position.stopLoss) {
        return { triggered: true, reason: `Price ${currentPrice} >= Stop-loss ${position.stopLoss}` };
    }

    return { triggered: false, reason: 'Stop-loss not triggered' };
}

function checkTakeProfit(position: Position, currentPrice: number): { triggered: boolean; reason: string } {
    if (!position.takeProfit) {
        return { triggered: false, reason: 'No take-profit set' };
    }

    if (position.side === 'BUY' && currentPrice >= position.takeProfit) {
        return { triggered: true, reason: `Price ${currentPrice} >= Take-profit ${position.takeProfit}` };
    }

    if (position.side === 'SELL' && currentPrice <= position.takeProfit) {
        return { triggered: true, reason: `Price ${currentPrice} <= Take-profit ${position.takeProfit}` };
    }

    return { triggered: false, reason: 'Take-profit not triggered' };
}

// ============================================================================
// Agent Card
// ============================================================================

export const getRiskAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Risk Agent',
    description: 'Manage trading risk with position limits, stop-loss/take-profit levels, and portfolio exposure monitoring. Helps protect your capital with rule-based risk controls.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/risk`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'assess-risk',
            name: 'Assess Trade Risk',
            description: 'Evaluate risk for a potential trade',
            tags: ['risk', 'assess', 'check', 'trade'],
            examples: ['check risk for 0.1 BTC buy', 'assess risk ETH'],
        },
        {
            id: 'stop-loss',
            name: 'Stop-Loss Levels',
            description: 'Calculate recommended stop-loss levels',
            tags: ['stop-loss', 'sl', 'protection'],
            examples: ['stop-loss for BTC', 'calculate SL for ETH'],
        },
        {
            id: 'take-profit',
            name: 'Take-Profit Levels',
            description: 'Calculate recommended take-profit levels',
            tags: ['take-profit', 'tp', 'target'],
            examples: ['take-profit for BTC', 'TP levels for SOL'],
        },
        {
            id: 'limits',
            name: 'View Risk Limits',
            description: 'View current risk limit configuration',
            tags: ['limits', 'config', 'settings'],
            examples: ['show limits', 'what are my risk limits?'],
        },
        {
            id: 'portfolio-risk',
            name: 'Portfolio Risk',
            description: 'Overall portfolio risk assessment',
            tags: ['portfolio', 'exposure', 'overview'],
            examples: ['portfolio risk', 'show exposure', 'risk overview'],
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

interface RiskIntent {
    action: 'assess' | 'stop-loss' | 'take-profit' | 'limits' | 'portfolio' | 'help';
    symbol?: string;
    side?: 'BUY' | 'SELL';
    quantity?: number;
}

function parseRiskIntent(text: string): RiskIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;

    // Extract quantity
    const qtyMatch = lower.match(/(\d+\.?\d*)/);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : undefined;

    // Extract side
    const side = lower.includes('buy') || lower.includes('long') ? 'BUY'
        : lower.includes('sell') || lower.includes('short') ? 'SELL'
            : undefined;

    if (lower.includes('limit') || lower.includes('config') || lower.includes('setting')) {
        return { action: 'limits' };
    }
    if (lower.includes('portfolio') || lower.includes('exposure') || lower.includes('overview')) {
        return { action: 'portfolio' };
    }
    if (lower.includes('stop') || lower.includes('sl')) {
        return { action: 'stop-loss', symbol };
    }
    if (lower.includes('take') || lower.includes('tp') || lower.includes('target')) {
        return { action: 'take-profit', symbol };
    }
    if (lower.includes('risk') || lower.includes('assess') || lower.includes('check') || symbol) {
        return { action: 'assess', symbol, side, quantity };
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

function riskScoreEmoji(score: number): string {
    if (score < 30) return '🟢';
    if (score < 60) return '🟡';
    return '🔴';
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateRiskCard(assessment: RiskAssessment): A2UIMessage[] {
    const warningComponents: Array<{ id: string; component: object }> = [];
    const warningIds: string[] = [];

    assessment.warnings.forEach((warning, idx) => {
        const id = `warn-${idx}`;
        warningIds.push(id);
        warningComponents.push({
            id,
            component: { Text: { text: { literalString: `⚠️ ${warning}` }, variant: 'secondary' } },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: `risk-${assessment.symbol}`,
            rootComponentId: 'root',
            styling: { primaryColor: assessment.passesRules ? '#10B981' : '#EF4444' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: `risk-${assessment.symbol}`,
            components: [
                {
                    id: 'root',
                    component: { Card: { children: ['header', 'score', 'levels', ...warningIds, 'verdict'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: `Risk Assessment: ${assessment.symbol}` }, semantic: 'h3' } },
                },
                {
                    id: 'score',
                    component: {
                        Text: {
                            text: { literalString: `${riskScoreEmoji(assessment.riskScore)} Risk Score: ${assessment.riskScore}/100` },
                            semantic: 'h4',
                        }
                    },
                },
                {
                    id: 'levels',
                    component: { Row: { children: ['sl-col', 'tp-col'] } },
                },
                {
                    id: 'sl-col',
                    component: { Column: { children: ['sl-label', 'sl-value'] } },
                },
                {
                    id: 'sl-label',
                    component: { Text: { text: { literalString: 'Stop-Loss' }, variant: 'secondary' } },
                },
                {
                    id: 'sl-value',
                    component: { Text: { text: { literalString: formatPrice(assessment.suggestedStopLoss) } } },
                },
                {
                    id: 'tp-col',
                    component: { Column: { children: ['tp-label', 'tp-value'] } },
                },
                {
                    id: 'tp-label',
                    component: { Text: { text: { literalString: 'Take-Profit' }, variant: 'secondary' } },
                },
                {
                    id: 'tp-value',
                    component: { Text: { text: { literalString: formatPrice(assessment.suggestedTakeProfit) } } },
                },
                ...warningComponents,
                {
                    id: 'verdict',
                    component: {
                        Text: {
                            text: { literalString: assessment.passesRules ? '✅ Trade APPROVED' : '❌ Trade BLOCKED' },
                            semantic: 'h4',
                        }
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleRiskRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[RiskAgent] Processing: "${userText}"`);

    const intent = parseRiskIntent(userText);
    console.log(`[RiskAgent] Intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'assess': {
                const symbol = intent.symbol || 'BTC';
                const quantity = intent.quantity || 0.1;
                const side = intent.side || 'BUY';

                const assessment = await assessTradeRisk(symbol, side, quantity);

                responseText = `${riskScoreEmoji(assessment.riskScore)} ${symbol} Risk Assessment:\n` +
                    `Score: ${assessment.riskScore}/100\n` +
                    `Stop-Loss: ${formatPrice(assessment.suggestedStopLoss)}\n` +
                    `Take-Profit: ${formatPrice(assessment.suggestedTakeProfit)}\n` +
                    (assessment.warnings.length > 0 ? `Warnings: ${assessment.warnings.join(', ')}\n` : '') +
                    `Verdict: ${assessment.passesRules ? '✅ APPROVED' : '❌ BLOCKED'}`;

                a2uiMessages = generateRiskCard(assessment);
                break;
            }

            case 'stop-loss': {
                const symbol = intent.symbol || 'BTC';
                const assessment = await assessTradeRisk(symbol, 'BUY', 0.1);
                responseText = `${symbol} Stop-Loss Recommendations:\n` +
                    `Long Entry: ${formatPrice(assessment.suggestedStopLoss)} (ATR-based 2x)\n` +
                    `Short Entry: ${formatPrice(assessment.suggestedTakeProfit)}`;
                break;
            }

            case 'take-profit': {
                const symbol = intent.symbol || 'BTC';
                const assessment = await assessTradeRisk(symbol, 'BUY', 0.1);
                responseText = `${symbol} Take-Profit Recommendations:\n` +
                    `Long Entry: ${formatPrice(assessment.suggestedTakeProfit)} (ATR-based 3x)\n` +
                    `Short Entry: ${formatPrice(assessment.suggestedStopLoss)}`;
                break;
            }

            case 'limits': {
                const limits = DEFAULT_RISK_LIMITS;
                responseText = `📋 Current Risk Limits:\n` +
                    `• Max Open Positions: ${limits.maxOpenPositions}\n` +
                    `• Max Exposure per Asset: ${limits.maxExposurePercent}%\n` +
                    `• Max Position Size: $${limits.maxPositionSizeUsd}\n` +
                    `• Max Daily Loss: ${limits.maxDailyLossPercent}%`;
                break;
            }

            case 'portfolio': {
                const openCount = portfolio.positions.filter(p => p.status === 'open').length;
                const usedCapital = portfolio.positions
                    .filter(p => p.status === 'open')
                    .reduce((sum, p) => sum + (p.entryPrice * p.quantity), 0);
                const exposure = (usedCapital / portfolio.totalValueUsd) * 100;

                responseText = `📊 Portfolio Risk Overview:\n` +
                    `Total Value: $${portfolio.totalValueUsd.toLocaleString()}\n` +
                    `Open Positions: ${openCount}/${DEFAULT_RISK_LIMITS.maxOpenPositions}\n` +
                    `Capital Deployed: ${formatPrice(usedCapital)} (${exposure.toFixed(1)}%)\n` +
                    `Daily P&L: ${portfolio.dailyPnl >= 0 ? '+' : ''}$${portfolio.dailyPnl.toFixed(2)}`;
                break;
            }

            default:
                responseText = `🛡️ Risk Agent\n\nCommands:\n• "check risk 0.1 BTC buy" - Assess trade risk\n• "stop-loss BTC" - Get stop-loss levels\n• "take-profit ETH" - Get take-profit levels\n• "show limits" - View risk limits\n• "portfolio risk" - Portfolio overview`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'risk-assessment',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[RiskAgent] Error:', error);
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
