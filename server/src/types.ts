/**
 * Shared TypeScript Types for LiquidCrypto Server
 */

// API Response Types
export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

// Chat Types
export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    content: string;
}

export interface ChatRequest {
    provider?: 'gemini' | 'claude';
    messages: ChatMessage[];
}

export interface ChatResponse {
    response: string;
}

export interface ParallelChatResponse {
    responses: {
        gemini: string;
        claude: string;
    };
    timestamp: string;
}

// Rate Limiting Types
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

export interface RateLimitConfig {
    max: number;
    windowMs: number;
}

// Cache Types
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    memorySize: number;
    redisConnected: boolean;
}

// Security Audit Types
export interface SecurityAudit {
    score: number;
    checks: {
        headers: 'PASS' | 'FAIL';
        cors: 'PASS' | 'FAIL';
        rateLimit: 'PASS' | 'FAIL';
        validation: 'PASS' | 'FAIL';
        apiKeys: 'PASS' | 'FAIL';
    };
    recommendations: string[];
}

// Redis Sentinel Types
export interface SentinelMaster {
    name: string;
    ip: string;
    port: number;
    status: 'ok' | 'down' | 'sdown' | 'odown';
    slaves: number;
    flags: string[];
    lastFailover: string | null;
}

export interface SentinelStatus {
    connected: boolean;
    masters: SentinelMaster[];
    error?: string;
}

// Portfolio Types
export interface PortfolioHolding {
    symbol: string;
    amount: number;
    value: number;
    avgBuyPrice: number;
}

export interface Portfolio {
    totalValue: number;
    holdings: PortfolioHolding[];
}

// Market Types
export interface MarketStats {
    totalMarketCap: number;
    volume24h: number;
    btcDominance: number;
    FearGreedIndex: number;
    topGainers?: Array<{ symbol: string; change: number }>;
    topLosers?: Array<{ symbol: string; change: number }>;
}

// Price Types
export interface PriceUpdate {
    type: 'price';
    symbol: string;
    price: number;
    timestamp: string;
}

// GraphQL Types
export interface GraphQLQuery {
    query: string;
    variables?: Record<string, unknown>;
}

export interface GraphQLPriceArgs {
    symbol: string;
}

export interface GraphQLChatArgs {
    prompt: string;
}
