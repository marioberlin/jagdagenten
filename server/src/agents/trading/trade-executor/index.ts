/**
 * TradeExecutorAgent
 * 
 * A2A Agent for executing trades on Binance Testnet.
 * Uses real API calls to Binance testnet for order execution.
 * 
 * Endpoints:
 * - A2A: POST /agents/trade-executor/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import type { Order, OrderSide, OrderType, OrderStatus, Position } from '../shared/types.js';
import {
    fetchPrice,
    placeMarketOrder,
    placeLimitOrder,
    cancelOrder as binanceCancelOrder,
    getOpenOrders as binanceGetOpenOrders,
    getBalances,
    isTestnetMode,
    hasApiCredentials,
} from '../shared/binance-client.js';

// ============================================================================
// Local Order/Position Tracking (mirrors Binance state)
// ============================================================================

interface LocalOrder extends Order {
    binanceOrderId?: number;
}

interface OrderStore {
    orders: Map<string, LocalOrder>;
    positions: Map<string, Position>;
}

const store: OrderStore = {
    orders: new Map(),
    positions: new Map(),
};

// ============================================================================
// Order Execution (Binance Testnet)
// ============================================================================

interface PlaceOrderParams {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    botId?: string;
}

async function placeOrder(params: PlaceOrderParams): Promise<LocalOrder> {
    const { symbol, side, type, quantity, price, botId } = params;

    // Check if we have API credentials
    if (!hasApiCredentials()) {
        throw new Error('Binance API credentials not configured. Please add BINANCE_API_KEY and BINANCE_SECRET_KEY to .env');
    }

    console.log(`[TradeExecutor] Placing ${type} ${side} order: ${quantity} ${symbol}`);

    let binanceOrder;
    let fillPrice: number | undefined;

    try {
        if (type === 'MARKET') {
            binanceOrder = await placeMarketOrder(symbol, side, quantity);
            // Calculate average fill price from fills
            if (binanceOrder.fills && binanceOrder.fills.length > 0) {
                const totalQty = binanceOrder.fills.reduce((sum, f) => sum + parseFloat(f.qty), 0);
                const totalValue = binanceOrder.fills.reduce((sum, f) => sum + parseFloat(f.price) * parseFloat(f.qty), 0);
                fillPrice = totalValue / totalQty;
            } else {
                fillPrice = parseFloat(binanceOrder.price) || undefined;
            }
        } else if (type === 'LIMIT' && price) {
            binanceOrder = await placeLimitOrder(symbol, side, quantity, price);
            fillPrice = price;
        } else {
            throw new Error('LIMIT orders require a price');
        }
    } catch (error) {
        console.error('[TradeExecutor] Binance order error:', error);
        throw error;
    }

    // Map Binance status to our status
    const statusMap: Record<string, OrderStatus> = {
        NEW: 'open',
        PARTIALLY_FILLED: 'open',
        FILLED: 'filled',
        CANCELED: 'cancelled',
        REJECTED: 'failed',
        EXPIRED: 'cancelled',
    };

    const order: LocalOrder = {
        id: randomUUID(),
        binanceOrderId: binanceOrder.orderId,
        symbol: binanceOrder.symbol,
        side,
        type,
        quantity: parseFloat(binanceOrder.origQty),
        price: parseFloat(binanceOrder.price) || price,
        status: statusMap[binanceOrder.status] || 'pending',
        filledQuantity: parseFloat(binanceOrder.executedQty),
        filledPrice: fillPrice,
        createdAt: new Date(binanceOrder.transactTime).toISOString(),
        updatedAt: new Date().toISOString(),
        testMode: isTestnetMode(),
    };

    store.orders.set(order.id, order);

    // Update position tracking for filled orders
    if (order.status === 'filled' && fillPrice) {
        const positionKey = `${botId || 'default'}-${order.symbol}`;
        const existingPosition = store.positions.get(positionKey);

        if (side === 'BUY') {
            if (existingPosition && existingPosition.status === 'open') {
                const newQuantity = existingPosition.quantity + order.filledQuantity!;
                const newAvgPrice = (existingPosition.entryPrice * existingPosition.quantity + fillPrice * order.filledQuantity!) / newQuantity;
                existingPosition.quantity = newQuantity;
                existingPosition.entryPrice = newAvgPrice;
            } else {
                const position: Position = {
                    id: randomUUID(),
                    botId: botId || 'default',
                    symbol: order.symbol,
                    side: 'BUY',
                    entryPrice: fillPrice,
                    quantity: order.filledQuantity!,
                    currentPrice: fillPrice,
                    unrealizedPnl: 0,
                    unrealizedPnlPercent: 0,
                    createdAt: new Date().toISOString(),
                    status: 'open',
                };
                store.positions.set(positionKey, position);
            }
        } else if (side === 'SELL' && existingPosition) {
            existingPosition.quantity -= order.filledQuantity!;
            if (existingPosition.quantity <= 0) {
                existingPosition.status = 'closed';
                existingPosition.closedAt = new Date().toISOString();
            }
        }
    }

    console.log(`[TradeExecutor] Order executed: ${binanceOrder.orderId} - ${binanceOrder.status}`);
    return order;
}

async function cancelOrder(orderId: string): Promise<LocalOrder | null> {
    const order = store.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'filled' || order.status === 'cancelled') {
        throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    if (order.binanceOrderId) {
        try {
            await binanceCancelOrder(order.symbol, order.binanceOrderId);
        } catch (error) {
            console.error('[TradeExecutor] Cancel error:', error);
            throw error;
        }
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    store.orders.set(orderId, order);

    console.log(`[TradeExecutor] Order cancelled: ${orderId}`);
    return order;
}

function getOrder(orderId: string): LocalOrder | null {
    return store.orders.get(orderId) || null;
}

function getOrders(status?: OrderStatus): LocalOrder[] {
    const orders = Array.from(store.orders.values());
    if (status) {
        return orders.filter(o => o.status === status);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function getPositions(botId?: string): Position[] {
    const positions = Array.from(store.positions.values());
    if (botId) {
        return positions.filter(p => p.botId === botId);
    }
    return positions;
}

// ============================================================================
// Agent Card
// ============================================================================

export const getTradeExecutorAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Trade Executor Agent',
    description: `Execute cryptocurrency trades on Binance ${isTestnetMode() ? 'TESTNET' : 'LIVE'}. Supports market and limit orders with position tracking. ${isTestnetMode() ? '🧪 TESTNET MODE - Using test funds.' : '⚠️ LIVE MODE - Real funds at risk!'}`,
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/trade-executor`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'place-order',
            name: 'Place Order',
            description: 'Place a buy or sell order on Binance',
            tags: ['trade', 'order', 'buy', 'sell'],
            examples: ['buy 0.001 BTC', 'sell 0.01 ETH', 'buy 0.1 BNB'],
        },
        {
            id: 'cancel-order',
            name: 'Cancel Order',
            description: 'Cancel a pending order',
            tags: ['cancel', 'order'],
            examples: ['cancel order abc123', 'cancel my last order'],
        },
        {
            id: 'order-status',
            name: 'Order Status',
            description: 'Check status of orders',
            tags: ['status', 'order', 'check'],
            examples: ['show my orders', 'order history'],
        },
        {
            id: 'positions',
            name: 'View Positions',
            description: 'View open positions and balances',
            tags: ['positions', 'portfolio', 'holdings', 'balance'],
            examples: ['show positions', 'my holdings', 'show balances'],
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

interface TradeIntent {
    action: 'buy' | 'sell' | 'cancel' | 'status' | 'positions' | 'balances' | 'help';
    symbol?: string;
    quantity?: number;
    orderId?: string;
    orderType?: OrderType;
    price?: number;
}

function parseTradeIntent(text: string): TradeIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;

    // Extract quantity
    const qtyMatch = lower.match(/(\d+\.?\d*)\s*(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)?/i);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : undefined;

    // Extract order ID (UUID pattern)
    const orderIdMatch = lower.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    const orderId = orderIdMatch ? orderIdMatch[1] : undefined;

    // Extract price for limit orders
    const priceMatch = lower.match(/@\s*(\d+\.?\d*)|at\s*(\d+\.?\d*)|price\s*(\d+\.?\d*)/i);
    const price = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3]) : undefined;

    // Determine order type
    const orderType: OrderType = (lower.includes('limit') || price) ? 'LIMIT' : 'MARKET';

    // Determine action
    if (lower.includes('balance')) {
        return { action: 'balances' };
    }
    if (lower.includes('cancel')) {
        return { action: 'cancel', orderId };
    }
    if (lower.includes('status') || lower.includes('orders') || lower.includes('order') || lower.includes('history')) {
        return { action: 'status', orderId };
    }
    if (lower.includes('position') || lower.includes('holding') || lower.includes('portfolio') || lower.includes('own')) {
        return { action: 'positions' };
    }
    if (lower.includes('buy') || lower.includes('long')) {
        return { action: 'buy', symbol, quantity, orderType, price };
    }
    if (lower.includes('sell') || lower.includes('short')) {
        return { action: 'sell', symbol, quantity, orderType, price };
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

function formatOrderStatus(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
        pending: '⏳',
        open: '📋',
        filled: '✅',
        cancelled: '❌',
        failed: '⚠️',
    };
    return `${icons[status]} ${status.toUpperCase()}`;
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateOrderCard(order: LocalOrder): A2UIMessage[] {
    const modeLabel = isTestnetMode() ? '🧪 TESTNET' : '⚠️ LIVE';

    return [
        {
            type: 'beginRendering',
            surfaceId: `order-${order.id}`,
            rootComponentId: 'root',
            styling: { primaryColor: order.side === 'BUY' ? '#10B981' : '#EF4444' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: `order-${order.id}`,
            components: [
                {
                    id: 'root',
                    component: { Card: { children: ['mode', 'header', 'details', 'status', 'binance-id', 'actions'] } },
                },
                {
                    id: 'mode',
                    component: { Text: { text: { literalString: modeLabel }, variant: 'secondary' } },
                },
                {
                    id: 'header',
                    component: { Row: { children: ['side', 'symbol'] } },
                },
                {
                    id: 'side',
                    component: {
                        Text: {
                            text: { literalString: order.side === 'BUY' ? '🟢 BUY' : '🔴 SELL' },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'symbol',
                    component: { Text: { text: { literalString: order.symbol }, semantic: 'h3' } },
                },
                {
                    id: 'details',
                    component: { Row: { children: ['qty', 'price'] } },
                },
                {
                    id: 'qty',
                    component: { Column: { children: ['qty-label', 'qty-value'] } },
                },
                {
                    id: 'qty-label',
                    component: { Text: { text: { literalString: 'Quantity' }, variant: 'secondary' } },
                },
                {
                    id: 'qty-value',
                    component: { Text: { text: { literalString: `${order.filledQuantity || order.quantity}` } } },
                },
                {
                    id: 'price',
                    component: { Column: { children: ['price-label', 'price-value'] } },
                },
                {
                    id: 'price-label',
                    component: { Text: { text: { literalString: 'Price' }, variant: 'secondary' } },
                },
                {
                    id: 'price-value',
                    component: { Text: { text: { literalString: formatPrice(order.filledPrice || order.price || 0) } } },
                },
                {
                    id: 'status',
                    component: { Text: { text: { literalString: formatOrderStatus(order.status) } } },
                },
                {
                    id: 'binance-id',
                    component: { Text: { text: { literalString: `Binance Order: ${order.binanceOrderId || 'N/A'}` }, variant: 'secondary' } },
                },
                {
                    id: 'actions',
                    component: { Row: { children: order.status === 'open' ? ['cancel-btn'] : [] } },
                },
                {
                    id: 'cancel-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Cancel Order' },
                            action: { input: { text: `cancel order ${order.id}` } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateBalancesCard(balances: Array<{ asset: string; free: number; locked: number }>): A2UIMessage[] {
    const balanceComponents: Array<{ id: string; component: object }> = [];
    const balanceIds: string[] = [];

    balances.slice(0, 10).forEach((bal, idx) => {
        const id = `bal-${idx}`;
        balanceIds.push(id);

        balanceComponents.push({
            id,
            component: { Row: { children: [`${id}-asset`, `${id}-free`, `${id}-locked`] } },
        });
        balanceComponents.push({
            id: `${id}-asset`,
            component: { Text: { text: { literalString: bal.asset }, semantic: 'h4' } },
        });
        balanceComponents.push({
            id: `${id}-free`,
            component: { Text: { text: { literalString: `${bal.free.toFixed(8)}` } } },
        });
        balanceComponents.push({
            id: `${id}-locked`,
            component: { Text: { text: { literalString: bal.locked > 0 ? `(${bal.locked.toFixed(8)} locked)` : '' }, variant: 'secondary' } },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'balances-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#3B82F6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'balances-list',
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', 'mode', ...balanceIds] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: '💰 Account Balances' }, semantic: 'h2' } },
                },
                {
                    id: 'mode',
                    component: { Text: { text: { literalString: isTestnetMode() ? '🧪 TESTNET - Test funds only' : '⚠️ LIVE - Real funds' }, variant: 'secondary' } },
                },
                ...balanceComponents,
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleTradeExecutorRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[TradeExecutor] Processing: "${userText}"`);

    const intent = parseTradeIntent(userText);
    console.log(`[TradeExecutor] Parsed intent:`, intent);

    const modeLabel = isTestnetMode() ? '[TESTNET]' : '[LIVE]';

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'buy':
            case 'sell': {
                if (!intent.symbol) {
                    responseText = 'Please specify a symbol. Example: "buy 0.001 BTC" or "sell 0.01 ETH"';
                    break;
                }
                if (!intent.quantity) {
                    responseText = `Please specify a quantity. Example: "${intent.action} 0.001 ${intent.symbol}"`;
                    break;
                }

                const order = await placeOrder({
                    symbol: intent.symbol,
                    side: intent.action === 'buy' ? 'BUY' : 'SELL',
                    type: intent.orderType || 'MARKET',
                    quantity: intent.quantity,
                    price: intent.price,
                });

                responseText = `✅ Order executed! ${modeLabel}\n${order.side} ${order.filledQuantity || order.quantity} ${order.symbol} @ ${formatPrice(order.filledPrice || order.price || 0)}\nBinance Order ID: ${order.binanceOrderId}`;
                a2uiMessages = generateOrderCard(order);
                break;
            }

            case 'cancel': {
                if (!intent.orderId) {
                    const openOrders = getOrders('open');
                    if (openOrders.length === 0) {
                        responseText = 'No open orders to cancel.';
                    } else {
                        responseText = `You have ${openOrders.length} open order(s). Specify an order ID to cancel.`;
                    }
                    break;
                }

                const cancelled = await cancelOrder(intent.orderId);
                if (cancelled) {
                    responseText = `✅ Order cancelled ${modeLabel}\nOrder: ${intent.orderId.slice(0, 8)}...\nBinance ID: ${cancelled.binanceOrderId}`;
                } else {
                    responseText = `Order ${intent.orderId.slice(0, 8)}... not found.`;
                }
                break;
            }

            case 'status': {
                if (intent.orderId) {
                    const order = getOrder(intent.orderId);
                    if (order) {
                        responseText = `Order ${intent.orderId.slice(0, 8)}...: ${formatOrderStatus(order.status)}\nBinance ID: ${order.binanceOrderId}`;
                        a2uiMessages = generateOrderCard(order);
                    } else {
                        responseText = `Order ${intent.orderId.slice(0, 8)}... not found.`;
                    }
                } else {
                    const orders = getOrders();
                    if (orders.length === 0) {
                        responseText = `No orders found ${modeLabel}. Try placing a trade!`;
                    } else {
                        const summary = orders.slice(0, 5).map(o =>
                            `${o.side} ${o.quantity} ${o.symbol} - ${formatOrderStatus(o.status)}`
                        ).join('\n');
                        responseText = `Recent orders ${modeLabel}:\n${summary}`;
                    }
                }
                break;
            }

            case 'balances': {
                try {
                    const balances = await getBalances();
                    if (balances.length === 0) {
                        responseText = `No balances found ${modeLabel}. Make sure your testnet account has funds.`;
                    } else {
                        responseText = `💰 Account Balances ${modeLabel}:\n` +
                            balances.slice(0, 10).map(b => `${b.asset}: ${b.free.toFixed(8)}${b.locked > 0 ? ` (${b.locked.toFixed(8)} locked)` : ''}`).join('\n');
                        a2uiMessages = generateBalancesCard(balances);
                    }
                } catch (error) {
                    responseText = `Error fetching balances: ${(error as Error).message}`;
                }
                break;
            }

            case 'positions': {
                const positions = getPositions();
                const openPositions = positions.filter(p => p.status === 'open');

                if (openPositions.length === 0) {
                    responseText = `No open positions ${modeLabel}. Place a BUY order to open a position!`;
                } else {
                    responseText = `You have ${openPositions.length} open position(s) ${modeLabel}`;
                }
                break;
            }

            default:
                responseText = `🤖 Trade Executor ${modeLabel}\n\nCommands:\n• "buy 0.001 BTC" - Market buy\n• "sell 0.01 ETH" - Market sell\n• "buy 0.001 BTC @ 95000" - Limit order\n• "show balances" - Account balances\n• "show positions" - View holdings\n• "show orders" - Order history\n• "cancel order <id>" - Cancel order`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'trade-result',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[TradeExecutor] Error:', error);
        return {
            id: taskId,
            contextId,
            status: { state: 'failed' },
            history: [
                params.message,
                { role: 'agent', parts: [{ text: `Error ${modeLabel}: ${(error as Error).message}` }] },
            ],
        };
    }
}
