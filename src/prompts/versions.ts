/**
 * AI Prompt Versioning System
 * 
 * Centralized prompt management with versioning support.
 * Enables A/B testing, analytics, and easy prompt updates.
 */

export type PromptVersion = 'v1' | 'v2' | 'v3';

export interface PromptDefinition {
    version: PromptVersion;
    template: string;
    description: string;
    lastUpdated: string;
}

export interface PromptCollection {
    [key: string]: {
        current: PromptVersion;
        versions: {
            v1: PromptDefinition;
            v2?: PromptDefinition;
            v3?: PromptDefinition;
        };
    };
}

// ============ PROMPT COLLECTION ============

export const PROMPTS: PromptCollection = {
    // Trading Analysis Prompt
    'trading-analysis': {
        current: 'v2',
        versions: {
            v1: {
                version: 'v1',
                template: `Analyze the following market data and provide trading insights:

{marketData}

Provide:
1. Technical analysis summary
2. Key support/resistance levels
3. Potential entry points
4. Risk assessment`,
                description: 'Original trading analysis prompt',
                lastUpdated: '2025-01-01'
            },
            v2: {
                version: 'v2',
                template: `You are an expert cryptocurrency analyst. Given the following market data:

{marketData}

Provide a comprehensive analysis including:
1. Market sentiment and trend direction
2. Technical indicators (RSI, MACD, Moving Averages)
3. Support and resistance levels with price targets
4. Risk management recommendations
5. Specific entry, stop loss, and take profit levels

Format your response clearly with headers and bullet points.`,
                description: 'Enhanced prompt with structured output requirements',
                lastUpdated: '2025-06-15'
            }
        }
    },

    // Portfolio Advice Prompt
    'portfolio-advice': {
        current: 'v1',
        versions: {
            v1: {
                version: 'v1',
                template: `Review the following crypto portfolio and provide recommendations:

Portfolio: {portfolio}

Current market conditions: {marketConditions}

Consider:
1. Diversification status
2. Risk exposure
3. Rebalancing opportunities
4. Potential opportunities based on market trends`,
                description: 'Portfolio review and advice',
                lastUpdated: '2025-01-01'
            }
        }
    },

    // Market Summary Prompt
    'market-summary': {
        current: 'v1',
        versions: {
            v1: {
                version: 'v1',
                template: `Provide a concise summary of the current cryptocurrency market:

Top movers: {topMovers}
Market cap: {marketCap}
Sentiment: {sentiment}

Keep the summary under 200 words and focus on the most important developments.`,
                description: 'Brief market overview',
                lastUpdated: '2025-01-01'
            }
        }
    },

    // Trading Signal Analysis
    'trading-signal': {
        current: 'v2',
        versions: {
            v1: {
                version: 'v1',
                template: `Analyze this potential trading signal:

Symbol: {symbol}
Timeframe: {timeframe}
Entry price: {entryPrice}
Stop loss: {stopLoss}
Take profit: {takeProfit}

Is this a good risk/reward setup?`,
                description: 'Basic trading signal analysis',
                lastUpdated: '2025-01-01'
            },
            v2: {
                version: 'v2',
                template: `You are a professional crypto trader. Analyze this potential trade:

SYMBOL: {symbol}
TIMEFRAME: {timeframe}
ENTRY: {entryPrice}
STOP LOSS: {stopLoss}
TAKE PROFIT: {takeProfit}
POSITION SIZE: {positionSize}

Provide:
1. Risk/Reward ratio calculation
2. Probability assessment based on current market structure
3. Optimal position sizing recommendation
4. Contingency plans if trade moves against you
5. Entry timing suggestions

Be thorough and professional in your analysis.`,
                description: 'Professional trading signal analysis',
                lastUpdated: '2025-08-01'
            }
        }
    },

    // News Sentiment Analysis
    'news-sentiment': {
        current: 'v1',
        versions: {
            v1: {
                version: 'v1',
                template: `Analyze the sentiment of this crypto-related news:

Headline: {headline}
Content: {content}

Provide:
1. Overall sentiment (bullish/bearish/neutral)
2. Impact on mentioned assets (high/medium/low)
3. Key takeaways for traders`,
                description: 'News sentiment analysis',
                lastUpdated: '2025-01-01'
            }
        }
    },

    // Chart Analysis
    'chart-analysis': {
        current: 'v1',
        versions: {
            v1: {
                version: 'v1',
                template: `Analyze this cryptocurrency chart:

Symbol: {symbol}
Timeframe: {timeframe}
Recent price action: {priceAction}

Provide technical analysis including:
1. Current trend direction
2. Key chart patterns identified
3. Support and resistance levels
4. Potential price targets
5. Risk factors`,
                description: 'Technical chart analysis',
                lastUpdated: '2025-01-01'
            }
        }
    },

    // AI Chat Response
    'ai-chat': {
        current: 'v1',
        versions: {
            v1: {
                version: 'v1',
                template: `You are LiquidCrypto, an AI assistant for cryptocurrency trading and analysis.

The user asks: {userMessage}

Provide a helpful, accurate response about cryptocurrencies, trading, or blockchain technology. If you're unsure about something, acknowledge it rather than making up information.`,
                description: 'General AI chat assistant',
                lastUpdated: '2025-01-01'
            }
        }
    }
};

// ============ PROMPT FACTORY ============

export function getPrompt<K extends keyof typeof PROMPTS>(
    promptKey: K,
    variables: Record<string, string>
): string {
    const promptGroup = PROMPTS[promptKey];
    if (!promptGroup) {
        throw new Error(`Unknown prompt key: ${promptKey}`);
    }

    const version = promptGroup.current;
    const promptDef = promptGroup.versions[version];

    if (!promptDef) {
        throw new Error(`Prompt ${promptKey} has no version ${version}`);
    }

    // Replace variables in template
    let template = promptDef.template;
    for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return template;
}

export function getPromptInfo<K extends keyof typeof PROMPTS>(
    promptKey: K
): { currentVersion: string; description: string; lastUpdated: string } {
    const promptGroup = PROMPTS[promptKey];
    if (!promptGroup) {
        throw new Error(`Unknown prompt key: ${promptKey}`);
    }

    const version = promptGroup.current;
    const promptDef = promptGroup.versions[version];

    if (!promptDef) {
        throw new Error(`Prompt ${promptKey} has no version ${version}`);
    }

    return {
        currentVersion: version,
        description: promptDef.description,
        lastUpdated: promptDef.lastUpdated
    };
}

export function getAllPromptKeys(): string[] {
    return Object.keys(PROMPTS);
}

export function switchPromptVersion<K extends keyof typeof PROMPTS>(
    promptKey: K,
    version: PromptVersion
): boolean {
    const promptGroup = PROMPTS[promptKey];
    if (!promptGroup || !promptGroup.versions[version]) {
        return false;
    }

    promptGroup.current = version;
    return true;
}

// ============ PROMPT ANALYTICS ============

export interface PromptAnalytics {
    promptKey: string;
    version: string;
    usageCount: number;
    avgResponseTime: number;
    lastUsed: string;
}

export const promptAnalytics: Map<string, PromptAnalytics> = new Map();

export function trackPromptUsage(
    promptKey: string,
    responseTime: number
): void {
    const group = PROMPTS[promptKey];
    if (!group) return;

    const version = group.current;
    const key = `${promptKey}:${version}`;

    const existing = promptAnalytics.get(key);
    if (existing) {
        existing.usageCount++;
        existing.avgResponseTime = (existing.avgResponseTime * (existing.usageCount - 1) + responseTime) / existing.usageCount;
        existing.lastUsed = new Date().toISOString();
    } else {
        promptAnalytics.set(key, {
            promptKey,
            version,
            usageCount: 1,
            avgResponseTime: responseTime,
            lastUsed: new Date().toISOString()
        });
    }
}

export function getPromptAnalytics(): PromptAnalytics[] {
    return Array.from(promptAnalytics.values());
}
