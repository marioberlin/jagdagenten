/**
 * Trading Agents - Shared Types
 * 
 * Core type definitions for the Trading Agent fleet.
 */

// ============================================================================
// Market Data Types
// ============================================================================

export interface CryptoAsset {
    symbol: string;
    name: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    lastUpdated: string;
}

export interface KlineData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

export interface OrderBookLevel {
    price: number;
    quantity: number;
}

export interface OrderBook {
    symbol: string;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    lastUpdateId: number;
}

// ============================================================================
// Trading Types
// ============================================================================

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderStatus = 'pending' | 'open' | 'filled' | 'cancelled' | 'failed';

export interface Order {
    id: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    stopPrice?: number;
    status: OrderStatus;
    filledQuantity?: number;
    filledPrice?: number;
    createdAt: string;
    updatedAt?: string;
    testMode: boolean;
}

export interface Position {
    id: string;
    botId: string;
    symbol: string;
    side: OrderSide;
    entryPrice: number;
    quantity: number;
    currentPrice?: number;
    unrealizedPnl?: number;
    unrealizedPnlPercent?: number;
    stopLoss?: number;
    takeProfit?: number;
    createdAt: string;
    closedAt?: string;
    status: 'open' | 'closed';
}

// ============================================================================
// Signal Types
// ============================================================================

export type SignalDirection = 'buy' | 'sell' | 'hold';

export interface TradingSignal {
    id: string;
    symbol: string;
    type: SignalDirection;
    confidence: number;
    entryPrice: number;
    targetPrice?: number;
    stopLoss?: number;
    reasoning: string;
    indicators: Record<string, number | string>;
    timestamp: string;
    source: string;  // Which tool generated this
}

// ============================================================================
// Risk Types
// ============================================================================

export interface RiskAssessment {
    symbol: string;
    riskScore: number;  // 0-100
    maxPositionSize: number;
    suggestedStopLoss: number;
    suggestedTakeProfit: number;
    warnings: string[];
    passesRules: boolean;
}

export interface RiskLimits {
    maxOpenPositions: number;
    maxExposurePercent: number;
    maxPositionSizeUsd: number;
    maxDailyLossPercent: number;
}

// ============================================================================
// Bot Configuration Types
// ============================================================================

export interface BotConfig {
    id: string;
    name: string;
    type: 'buy' | 'sell' | 'both';
    symbols: string[];  // or '*USDT' for all
    blacklist: string[];
    skillId: string;  // e.g., 'skill:ai_strategy_trading'
    parameters: Record<string, unknown>;
    logicLayers: LogicLayerConfig[];
    testMode: boolean;
    active: boolean;
}

export interface LogicLayerConfig {
    id: string;
    executionOrder: number;
    active: boolean;
    tags: string[];
    config: Record<string, unknown>;
}

// ============================================================================
// Agent Communication Types
// ============================================================================

export interface AgentRequest {
    agentId: string;
    method: string;
    params: Record<string, unknown>;
    correlationId?: string;
}

export interface AgentResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    correlationId?: string;
    timestamp: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationChannel = 'email' | 'slack' | 'telegram';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Notification {
    id: string;
    type: 'trade' | 'error' | 'performance' | 'threshold';
    channel: NotificationChannel;
    severity: NotificationSeverity;
    subject: string;
    message: string;
    data?: Record<string, unknown>;
    timestamp: string;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface ToolResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    executionTimeMs: number;
}

export interface IndicatorResult {
    name: string;
    value: number;
    signal?: SignalDirection;
    confidence?: number;
    metadata?: Record<string, unknown>;
}
