/**
 * LiquidCrypto Agent Executor
 *
 * Main agent executor for LiquidCrypto cryptocurrency trading assistant.
 * Supports A2UI for rich interactive responses.
 */

import { v1 } from '@liquidcrypto/a2a-sdk';
import { BaseA2UIExecutor, type ExecutorA2UIMessage, type AgentExecutionContext, type AgentExecutionResult } from './base.js';
import { TradingComponents } from './trading-components.js';

export class LiquidCryptoExecutor extends BaseA2UIExecutor {
  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const text = this.extractText(message);
    const prompt = text.toLowerCase();
    const wantsUI = this.wantsA2UI(context);

    // Route to appropriate handler based on prompt
    if (prompt.includes('portfolio') || prompt.includes('holdings')) {
      return this.handlePortfolio(context, wantsUI);
    }

    if (prompt.includes('price') || prompt.includes('quote')) {
      const symbol = this.extractSymbol(prompt);
      return this.handlePrice(symbol, context, wantsUI);
    }

    if (prompt.includes('chart') || prompt.includes('graph')) {
      const symbol = this.extractSymbol(prompt);
      return this.handleChart(symbol, context, wantsUI);
    }

    if (prompt.includes('trade') || prompt.includes('buy') || prompt.includes('sell')) {
      return this.handleTrade(prompt, context, wantsUI);
    }

    if (prompt.includes('order book') || prompt.includes('orderbook') || prompt.includes('depth')) {
      const symbol = this.extractSymbol(prompt);
      return this.handleOrderBook(symbol, context, wantsUI);
    }

    if (prompt.includes('watchlist') || prompt.includes('watch list') || prompt.includes('favorites')) {
      return this.handleWatchlist(context, wantsUI);
    }

    if (prompt.includes('dashboard') || prompt.includes('overview')) {
      const symbol = this.extractSymbol(prompt);
      return this.handleDashboard(symbol, context, wantsUI);
    }

    // Default response
    return this.createDefaultResponse(text, context, wantsUI);
  }

  private extractSymbol(prompt: string): string {
    // Common crypto symbols
    const symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'DOT', 'ADA', 'XRP', 'BNB', 'LINK'];
    const upper = prompt.toUpperCase();

    for (const symbol of symbols) {
      if (upper.includes(symbol)) {
        return symbol;
      }
    }

    // Check for common names
    if (prompt.includes('bitcoin')) return 'BTC';
    if (prompt.includes('ethereum') || prompt.includes('ether')) return 'ETH';
    if (prompt.includes('solana')) return 'SOL';

    return 'BTC'; // Default
  }

  private handlePortfolio(
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Mock portfolio data
    const portfolio = {
      totalValue: 125000,
      change24h: 2.5,
      holdings: [
        { symbol: 'BTC', amount: 1.5, value: 65000, change: 1.2 },
        { symbol: 'ETH', amount: 15.2, value: 45000, change: 3.5 },
        { symbol: 'SOL', amount: 120, value: 15000, change: -2.1 },
      ],
    };

    const textResponse = `Your portfolio is worth $${portfolio.totalValue.toLocaleString()} (${portfolio.change24h > 0 ? '+' : ''}${portfolio.change24h}% 24h).`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    // Create A2UI response
    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'portfolio',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1', fontFamily: 'Inter, system-ui' },
      },
      {
        type: 'setModel',
        surfaceId: 'portfolio',
        model: { portfolio },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'portfolio',
        components: [
          { id: 'root', component: this.Card(['header', 'divider', 'holdings']) },
          { id: 'header', component: this.Column(['title', 'value', 'change']) },
          { id: 'title', component: this.Text('Portfolio Overview', 'h2') },
          { id: 'value', component: this.Text({ path: '/portfolio/totalValue' }, 'h1') },
          { id: 'change', component: this.Text({ path: '/portfolio/change24h' }) },
          { id: 'divider', component: this.Divider() },
          { id: 'holdings', component: this.List('/portfolio/holdings', ['holding-row']) },
          { id: 'holding-row', component: this.Row(['symbol', 'amount', 'value']) },
          { id: 'symbol', component: this.Text({ path: 'symbol' }, 'label') },
          { id: 'amount', component: this.Text({ path: 'amount' }) },
          { id: 'value', component: this.Text({ path: 'value' }) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handlePrice(
    symbol: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Mock price data
    const prices: Record<string, { price: number; change: number }> = {
      BTC: { price: 43250, change: 1.2 },
      ETH: { price: 2950, change: 3.5 },
      SOL: { price: 125, change: -2.1 },
    };

    const data = prices[symbol] || { price: 0, change: 0 };
    const textResponse = `${symbol} is trading at $${data.price.toLocaleString()} (${data.change > 0 ? '+' : ''}${data.change}% 24h).`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'price',
        rootComponentId: 'root',
        styling: { primaryColor: data.change >= 0 ? '#22c55e' : '#ef4444' },
      },
      {
        type: 'setModel',
        surfaceId: 'price',
        model: { symbol, ...data },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'price',
        components: [
          { id: 'root', component: this.Card(['content']) },
          { id: 'content', component: this.Column(['symbol-text', 'price-text', 'change-text', 'actions']) },
          { id: 'symbol-text', component: this.Text({ path: '/symbol' }, 'h2') },
          { id: 'price-text', component: this.Text({ path: '/price' }, 'h1') },
          { id: 'change-text', component: this.Text({ path: '/change' }) },
          { id: 'actions', component: this.Row(['buy-btn', 'chart-btn']) },
          { id: 'buy-btn', component: this.Button(`Buy ${symbol}`, 'buy', 'primary') },
          { id: 'chart-btn', component: this.Button('View Chart', 'chart', 'secondary') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleChart(
    symbol: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const textResponse = `Here's the ${symbol} price chart for the last 24 hours.`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    // Chart would be rendered by the A2UI framework
    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'chart',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'chart',
        model: {
          symbol,
          timeframe: '24h',
          // Mock chart data would go here
          data: Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            price: 43000 + Math.random() * 1000,
          })),
        },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'chart',
        components: [
          { id: 'root', component: this.Card(['header', 'chart-placeholder']) },
          { id: 'header', component: this.Row(['title', 'timeframe-btns']) },
          { id: 'title', component: this.Text(`${symbol}/USD`, 'h2') },
          { id: 'timeframe-btns', component: this.Row(['1h-btn', '24h-btn', '7d-btn']) },
          { id: '1h-btn', component: this.Button('1H', 'timeframe-1h', 'ghost') },
          { id: '24h-btn', component: this.Button('24H', 'timeframe-24h', 'primary') },
          { id: '7d-btn', component: this.Button('7D', 'timeframe-7d', 'ghost') },
          { id: 'chart-placeholder', component: this.Text('Chart visualization would render here', 'body') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleTrade(
    prompt: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const isBuy = prompt.includes('buy');
    const symbol = this.extractSymbol(prompt);
    const action = isBuy ? 'Buy' : 'Sell';

    const textResponse = `Ready to ${action.toLowerCase()} ${symbol}. Please confirm the details.`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'trade',
        rootComponentId: 'root',
        styling: { primaryColor: isBuy ? '#22c55e' : '#ef4444' },
      },
      {
        type: 'setModel',
        surfaceId: 'trade',
        model: { action, symbol, amount: '', total: 0 },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'trade',
        components: [
          { id: 'root', component: this.Card(['form']) },
          { id: 'form', component: this.Column(['title', 'amount-input', 'preview', 'submit']) },
          { id: 'title', component: this.Text(`${action} ${symbol}`, 'h2') },
          { id: 'amount-input', component: this.TextField('amount', 'Amount', `Enter ${symbol} amount`) },
          { id: 'preview', component: this.Row(['label', 'total']) },
          { id: 'label', component: this.Text('Total:', 'label') },
          { id: 'total', component: this.Text({ path: '/total' }) },
          { id: 'submit', component: this.Button(`Confirm ${action}`, 'submit-trade', 'primary') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private createDefaultResponse(
    _prompt: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const textResponse = `I can help you with cryptocurrency trading. Try asking about:
- Your portfolio ("Show my portfolio")
- Price quotes ("What's the price of BTC?")
- Charts ("Show ETH chart")
- Trading ("Buy 0.1 BTC")
- Order book ("Show BTC order book")
- Watchlist ("Show my watchlist")
- Dashboard ("Show BTC dashboard")`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'help',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'help',
        components: [
          { id: 'root', component: this.Card(['content']) },
          { id: 'content', component: this.Column(['title', 'description', 'actions']) },
          { id: 'title', component: this.Text('LiquidCrypto AI', 'h2') },
          { id: 'description', component: this.Text(textResponse) },
          { id: 'actions', component: this.Column(['portfolio-btn', 'prices-btn', 'trade-btn']) },
          { id: 'portfolio-btn', component: this.Button('View Portfolio', 'view-portfolio', 'primary') },
          { id: 'prices-btn', component: this.Button('Get Prices', 'get-prices', 'secondary') },
          { id: 'trade-btn', component: this.Button('Start Trading', 'start-trade', 'secondary') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleOrderBook(
    symbol: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Mock order book data
    const orderBook = {
      bids: [
        { price: 43200, amount: 0.5, total: 21600 },
        { price: 43180, amount: 1.2, total: 51816 },
        { price: 43150, amount: 0.8, total: 34520 },
        { price: 43100, amount: 2.0, total: 86200 },
        { price: 43050, amount: 1.5, total: 64575 },
      ],
      asks: [
        { price: 43250, amount: 0.3, total: 12975 },
        { price: 43280, amount: 0.9, total: 38952 },
        { price: 43300, amount: 1.1, total: 47630 },
        { price: 43350, amount: 0.7, total: 30345 },
        { price: 43400, amount: 1.8, total: 78120 },
      ],
      spread: 50,
      spreadPercent: 0.12,
    };

    const textResponse = `${symbol} Order Book: Spread is $${orderBook.spread} (${orderBook.spreadPercent}%)`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orderbook',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'orderbook',
        model: { symbol, ...orderBook },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orderbook',
        components: [
          { id: 'root', component: TradingComponents.OrderBook('/bids', '/asks', { maxEntries: 5 }) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleWatchlist(
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Mock watchlist data
    const watchlist = [
      { symbol: 'BTC', name: 'Bitcoin', price: 43250, change24h: 1.2 },
      { symbol: 'ETH', name: 'Ethereum', price: 2950, change24h: 3.5 },
      { symbol: 'SOL', name: 'Solana', price: 125, change24h: -2.1 },
      { symbol: 'AVAX', name: 'Avalanche', price: 42, change24h: 0.8 },
      { symbol: 'DOT', name: 'Polkadot', price: 8.5, change24h: -1.5 },
    ];

    const textResponse = `Your watchlist has ${watchlist.length} assets. Top mover: ETH (+3.5%)`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'watchlist',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'watchlist',
        model: { watchlist },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'watchlist',
        components: [
          { id: 'root', component: TradingComponents.Watchlist('/watchlist', { maxItems: 5 }) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleDashboard(
    symbol: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Mock comprehensive dashboard data
    const dashboard = {
      ticker: { symbol, price: 43250, change24h: 1.2, volume24h: 28_500_000_000 },
      portfolio: {
        totalValue: 125000,
        change24h: 2.5,
        pnl: 12500,
        holdings: [
          { symbol: 'BTC', amount: 1.5, value: 65000, change24h: 1.2, allocation: 52 },
          { symbol: 'ETH', amount: 15.2, value: 45000, change24h: 3.5, allocation: 36 },
          { symbol: 'SOL', amount: 120, value: 15000, change24h: -2.1, allocation: 12 },
        ],
      },
    };

    const textResponse = `${symbol} Trading Dashboard: Price $${dashboard.ticker.price.toLocaleString()} | Portfolio $${dashboard.portfolio.totalValue.toLocaleString()}`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'dashboard',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1', fontFamily: 'Inter, system-ui' },
      },
      {
        type: 'setModel',
        surfaceId: 'dashboard',
        model: dashboard,
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'dashboard',
        components: [
          { id: 'root', component: this.Column(['ticker-section', 'chart-section', 'portfolio-section']) },
          { id: 'ticker-section', component: TradingComponents.MarketTicker({ path: '/ticker/symbol' }, { path: '/ticker/price' }, { path: '/ticker/change24h' }) },
          { id: 'chart-section', component: TradingComponents.ChartPlaceholder(symbol, '24h') },
          { id: 'portfolio-section', component: TradingComponents.PortfolioSummary({
            totalValuePath: '/portfolio/totalValue',
            changePath: '/portfolio/change24h',
            pnlPath: '/portfolio/pnl',
            holdingsPath: '/portfolio/holdings',
          }) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }
}

/**
 * Get the LiquidCrypto agent card
 */
export function getLiquidCryptoAgentCard(baseUrl: string): v1.AgentCard {
  return {
    name: 'LiquidCrypto AI',
    url: baseUrl,
    version: '1.0.0',
    protocolVersions: ['1.0'],
    description: 'AI-powered cryptocurrency trading assistant with rich UI generation',
    documentationUrl: `${baseUrl}/docs`,
    provider: {
      organization: 'LiquidCrypto',
      url: 'https://liquidcrypto.io',
    },
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: 'portfolio',
        name: 'Portfolio Management',
        description: 'View and manage cryptocurrency portfolios',
        tags: ['crypto', 'portfolio', 'trading'],
        examples: ['Show my portfolio', 'What are my holdings?'],
      },
      {
        id: 'trading',
        name: 'Trading Assistant',
        description: 'Execute trades and analyze market conditions',
        tags: ['crypto', 'trading', 'analysis'],
        examples: ['Buy 0.1 BTC', "What's the price of ETH?"],
      },
      {
        id: 'charts',
        name: 'Chart Generation',
        description: 'Generate interactive charts and visualizations',
        tags: ['charts', 'visualization', 'data'],
        examples: ['Show BTC price chart', 'Compare ETH and SOL'],
      },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
  };
}
