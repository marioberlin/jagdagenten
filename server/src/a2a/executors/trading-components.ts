/**
 * Trading A2UI Components
 *
 * Specialized A2UI component builders for cryptocurrency trading interfaces.
 * These extend the base A2UI components with trading-specific patterns.
 */

// Note: We use looser typing for component definitions since they support complex nested structures
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { v1 as _v1 } from '@liquidcrypto/a2a-sdk';

// ============================================================================
// Types
// ============================================================================

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h?: number;
  low24h?: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface PortfolioHolding {
  symbol: string;
  amount: number;
  value: number;
  change24h: number;
  allocation: number;
}

export interface PortfolioData {
  totalValue: number;
  change24h: number;
  pnl: number;
  holdings: PortfolioHolding[];
}

export interface TradeData {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface AlertData {
  id: string;
  symbol: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  active: boolean;
  triggered?: boolean;
  triggeredAt?: string;
}

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// Component Builders
// ============================================================================

/**
 * Trading A2UI Component Builders
 *
 * These are mixin methods that can be used in executor classes.
 */
export const TradingComponents = {
  /**
   * Create a Market Ticker component
   * Shows real-time price with color-coded change
   */
  MarketTicker(
    symbol: string | { path: string },
    price: number | { path: string },
    change: number | { path: string },
    _options?: {
      showVolume?: boolean;
      showHighLow?: boolean;
      compact?: boolean;
    }
  ): Record<string, unknown> {
    const symbolValue = typeof symbol === 'string' ? { literalString: symbol } : symbol;
    const priceValue = typeof price === 'number' ? { literalNumber: price } : price;
    const changeValue = typeof change === 'number' ? { literalNumber: change } : change;

    return {
      Row: {
        children: ['ticker-symbol', 'ticker-price', 'ticker-change'],
        style: { gap: '16px', alignItems: 'center', padding: '12px' },
      },
      _components: [
        {
          id: 'ticker-symbol',
          component: {
            Text: { text: symbolValue, semantic: 'h3', style: { fontWeight: 'bold' } },
          },
        },
        {
          id: 'ticker-price',
          component: {
            Text: { text: priceValue, semantic: 'h2', format: 'currency' },
          },
        },
        {
          id: 'ticker-change',
          component: {
            Text: {
              text: changeValue,
              semantic: 'body',
              format: 'percent',
              conditionalStyle: {
                positive: { color: '#22c55e' },
                negative: { color: '#ef4444' },
              },
            },
          },
        },
      ],
    };
  },

  /**
   * Create an Order Book component
   * Visualizes bid/ask depth with side-by-side layout
   */
  OrderBook(
    bidsPath: string,
    asksPath: string,
    options?: {
      maxEntries?: number;
      showSpread?: boolean;
      compact?: boolean;
    }
  ): Record<string, unknown> {
    const maxEntries = options?.maxEntries ?? 10;
    return {
      Card: {
        children: ['ob-header', 'ob-content'],
        style: { padding: '16px' },
      },
      _components: [
        {
          id: 'ob-header',
          component: {
            Row: {
              children: ['ob-title', 'ob-spread'],
              style: { justifyContent: 'space-between', marginBottom: '12px' },
            },
          },
        },
        {
          id: 'ob-title',
          component: { Text: { text: { literalString: 'Order Book' }, semantic: 'h4' } },
        },
        {
          id: 'ob-spread',
          component: {
            Text: {
              text: { path: '/spreadPercent' },
              semantic: 'caption',
              format: 'percent',
              prefix: 'Spread: ',
            },
          },
        },
        {
          id: 'ob-content',
          component: {
            Row: {
              children: ['ob-bids', 'ob-asks'],
              style: { gap: '8px' },
            },
          },
        },
        {
          id: 'ob-bids',
          component: {
            Column: {
              children: ['bids-header', 'bids-list'],
              style: { flex: 1 },
            },
          },
        },
        {
          id: 'bids-header',
          component: {
            Row: {
              children: ['bids-price-h', 'bids-amount-h'],
              style: { color: '#22c55e', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 0' },
            },
          },
        },
        {
          id: 'bids-price-h',
          component: { Text: { text: { literalString: 'Price' }, semantic: 'caption' } },
        },
        {
          id: 'bids-amount-h',
          component: { Text: { text: { literalString: 'Amount' }, semantic: 'caption' } },
        },
        {
          id: 'bids-list',
          component: {
            List: {
              items: { path: bidsPath },
              maxItems: maxEntries,
              template: ['bid-row'],
              style: { background: 'linear-gradient(90deg, rgba(34,197,94,0.1) 0%, transparent 100%)' },
            },
          },
        },
        {
          id: 'bid-row',
          component: {
            Row: {
              children: ['bid-price', 'bid-amount'],
              style: { padding: '2px 0' },
            },
          },
        },
        {
          id: 'bid-price',
          component: { Text: { text: { path: 'price' }, format: 'number', style: { color: '#22c55e' } } },
        },
        {
          id: 'bid-amount',
          component: { Text: { text: { path: 'amount' }, format: 'number' } },
        },
        {
          id: 'ob-asks',
          component: {
            Column: {
              children: ['asks-header', 'asks-list'],
              style: { flex: 1 },
            },
          },
        },
        {
          id: 'asks-header',
          component: {
            Row: {
              children: ['asks-price-h', 'asks-amount-h'],
              style: { color: '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 0' },
            },
          },
        },
        {
          id: 'asks-price-h',
          component: { Text: { text: { literalString: 'Price' }, semantic: 'caption' } },
        },
        {
          id: 'asks-amount-h',
          component: { Text: { text: { literalString: 'Amount' }, semantic: 'caption' } },
        },
        {
          id: 'asks-list',
          component: {
            List: {
              items: { path: asksPath },
              maxItems: maxEntries,
              template: ['ask-row'],
              style: { background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.1) 100%)' },
            },
          },
        },
        {
          id: 'ask-row',
          component: {
            Row: {
              children: ['ask-price', 'ask-amount'],
              style: { padding: '2px 0' },
            },
          },
        },
        {
          id: 'ask-price',
          component: { Text: { text: { path: 'price' }, format: 'number', style: { color: '#ef4444' } } },
        },
        {
          id: 'ask-amount',
          component: { Text: { text: { path: 'amount' }, format: 'number' } },
        },
      ],
    };
  },

  /**
   * Create a Trade Form component
   * Complete order entry form with amount, price, and validation
   */
  TradeForm(
    symbol: string,
    side: 'buy' | 'sell',
    _options?: {
      showLimit?: boolean;
      showMarket?: boolean;
      showStopLoss?: boolean;
      maxAmount?: number;
      minAmount?: number;
    }
  ): Record<string, unknown> {
    const isBuy = side === 'buy';
    const primaryColor = isBuy ? '#22c55e' : '#ef4444';
    const actionLabel = isBuy ? 'Buy' : 'Sell';

    return {
      Card: {
        children: ['trade-header', 'trade-tabs', 'trade-form', 'trade-submit'],
        style: {
          padding: '16px',
          borderColor: primaryColor,
          borderWidth: '1px',
        },
      },
      _components: [
        {
          id: 'trade-header',
          component: {
            Row: {
              children: ['trade-title', 'trade-balance'],
              style: { justifyContent: 'space-between', marginBottom: '12px' },
            },
          },
        },
        {
          id: 'trade-title',
          component: {
            Text: {
              text: { literalString: `${actionLabel} ${symbol}` },
              semantic: 'h3',
              style: { color: primaryColor },
            },
          },
        },
        {
          id: 'trade-balance',
          component: {
            Column: {
              children: ['balance-label', 'balance-value'],
              style: { alignItems: 'flex-end' },
            },
          },
        },
        {
          id: 'balance-label',
          component: { Text: { text: { literalString: 'Available' }, semantic: 'caption' } },
        },
        {
          id: 'balance-value',
          component: {
            Text: { text: { path: '/balance' }, format: 'currency', semantic: 'body' },
          },
        },
        {
          id: 'trade-tabs',
          component: {
            Row: {
              children: ['tab-market', 'tab-limit'],
              style: { gap: '8px', marginBottom: '16px' },
            },
          },
        },
        {
          id: 'tab-market',
          component: {
            Button: {
              label: { literalString: 'Market' },
              actionId: 'order-type-market',
              variant: 'ghost',
            },
          },
        },
        {
          id: 'tab-limit',
          component: {
            Button: {
              label: { literalString: 'Limit' },
              actionId: 'order-type-limit',
              variant: 'primary',
            },
          },
        },
        {
          id: 'trade-form',
          component: {
            Column: {
              children: ['price-input', 'amount-input', 'total-display', 'slider'],
              style: { gap: '12px' },
            },
          },
        },
        {
          id: 'price-input',
          component: {
            TextField: {
              id: 'price',
              label: { literalString: 'Price' },
              placeholder: { literalString: 'Enter limit price' },
              type: 'number',
              suffix: { literalString: 'USD' },
            },
          },
        },
        {
          id: 'amount-input',
          component: {
            TextField: {
              id: 'amount',
              label: { literalString: 'Amount' },
              placeholder: { literalString: `Enter ${symbol} amount` },
              type: 'number',
              suffix: { literalString: symbol },
            },
          },
        },
        {
          id: 'total-display',
          component: {
            Row: {
              children: ['total-label', 'total-value'],
              style: {
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              },
            },
          },
        },
        {
          id: 'total-label',
          component: { Text: { text: { literalString: 'Total' }, semantic: 'label' } },
        },
        {
          id: 'total-value',
          component: { Text: { text: { path: '/total' }, format: 'currency', semantic: 'h4' } },
        },
        {
          id: 'slider',
          component: {
            Slider: {
              id: 'percent',
              min: 0,
              max: 100,
              step: 25,
              marks: [
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ],
            },
          },
        },
        {
          id: 'trade-submit',
          component: {
            Button: {
              label: { literalString: `${actionLabel} ${symbol}` },
              actionId: `submit-${side}`,
              variant: 'primary',
              style: {
                marginTop: '16px',
                width: '100%',
                backgroundColor: primaryColor,
              },
            },
          },
        },
      ],
    };
  },

  /**
   * Create a Portfolio Summary component
   * Shows total value, P&L, and holdings breakdown
   */
  PortfolioSummary(
    data: {
      totalValuePath: string;
      changePath: string;
      pnlPath: string;
      holdingsPath: string;
    },
    options?: {
      showChart?: boolean;
      maxHoldings?: number;
    }
  ): Record<string, unknown> {
    const maxHoldings = options?.maxHoldings ?? 5;

    return {
      Card: {
        children: ['portfolio-header', 'portfolio-stats', 'portfolio-divider', 'portfolio-holdings'],
        style: { padding: '20px' },
      },
      _components: [
        {
          id: 'portfolio-header',
          component: {
            Column: {
              children: ['portfolio-label', 'portfolio-value', 'portfolio-change'],
              style: { marginBottom: '16px' },
            },
          },
        },
        {
          id: 'portfolio-label',
          component: { Text: { text: { literalString: 'Portfolio Value' }, semantic: 'caption' } },
        },
        {
          id: 'portfolio-value',
          component: {
            Text: {
              text: { path: data.totalValuePath },
              semantic: 'h1',
              format: 'currency',
            },
          },
        },
        {
          id: 'portfolio-change',
          component: {
            Text: {
              text: { path: data.changePath },
              format: 'percent',
              conditionalStyle: {
                positive: { color: '#22c55e' },
                negative: { color: '#ef4444' },
              },
              suffix: { literalString: ' (24h)' },
            },
          },
        },
        {
          id: 'portfolio-stats',
          component: {
            Row: {
              children: ['pnl-stat'],
              style: { gap: '24px', marginBottom: '16px' },
            },
          },
        },
        {
          id: 'pnl-stat',
          component: {
            Column: {
              children: ['pnl-label', 'pnl-value'],
            },
          },
        },
        {
          id: 'pnl-label',
          component: { Text: { text: { literalString: 'Unrealized P&L' }, semantic: 'caption' } },
        },
        {
          id: 'pnl-value',
          component: {
            Text: {
              text: { path: data.pnlPath },
              format: 'currency',
              conditionalStyle: {
                positive: { color: '#22c55e' },
                negative: { color: '#ef4444' },
              },
            },
          },
        },
        {
          id: 'portfolio-divider',
          component: { Divider: {} },
        },
        {
          id: 'portfolio-holdings',
          component: {
            Column: {
              children: ['holdings-title', 'holdings-list'],
            },
          },
        },
        {
          id: 'holdings-title',
          component: {
            Text: {
              text: { literalString: 'Holdings' },
              semantic: 'h4',
              style: { marginBottom: '12px' },
            },
          },
        },
        {
          id: 'holdings-list',
          component: {
            List: {
              items: { path: data.holdingsPath },
              maxItems: maxHoldings,
              template: ['holding-row'],
            },
          },
        },
        {
          id: 'holding-row',
          component: {
            Row: {
              children: ['holding-symbol', 'holding-amount', 'holding-value', 'holding-change'],
              style: {
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              },
            },
          },
        },
        {
          id: 'holding-symbol',
          component: {
            Column: {
              children: ['holding-symbol-text', 'holding-amount-text'],
              style: { flex: 1 },
            },
          },
        },
        {
          id: 'holding-symbol-text',
          component: { Text: { text: { path: 'symbol' }, semantic: 'body', style: { fontWeight: 'bold' } } },
        },
        {
          id: 'holding-amount-text',
          component: { Text: { text: { path: 'amount' }, semantic: 'caption' } },
        },
        {
          id: 'holding-value',
          component: { Text: { text: { path: 'value' }, format: 'currency', semantic: 'body' } },
        },
        {
          id: 'holding-change',
          component: {
            Text: {
              text: { path: 'change24h' },
              format: 'percent',
              conditionalStyle: {
                positive: { color: '#22c55e' },
                negative: { color: '#ef4444' },
              },
            },
          },
        },
      ],
    };
  },

  /**
   * Create a Transaction/Trade History list
   */
  TransactionList(
    tradesPath: string,
    options?: {
      maxItems?: number;
      showFilters?: boolean;
    }
  ): Record<string, unknown> {
    const maxItems = options?.maxItems ?? 10;

    return {
      Card: {
        children: ['txn-header', 'txn-list'],
        style: { padding: '16px' },
      },
      _components: [
        {
          id: 'txn-header',
          component: {
            Row: {
              children: ['txn-title', 'txn-filters'],
              style: { justifyContent: 'space-between', marginBottom: '16px' },
            },
          },
        },
        {
          id: 'txn-title',
          component: { Text: { text: { literalString: 'Recent Trades' }, semantic: 'h4' } },
        },
        {
          id: 'txn-filters',
          component: {
            Row: {
              children: ['filter-all', 'filter-buy', 'filter-sell'],
              style: { gap: '8px' },
            },
          },
        },
        {
          id: 'filter-all',
          component: {
            Button: { label: { literalString: 'All' }, actionId: 'filter-all', variant: 'ghost', size: 'sm' },
          },
        },
        {
          id: 'filter-buy',
          component: {
            Button: { label: { literalString: 'Buy' }, actionId: 'filter-buy', variant: 'ghost', size: 'sm' },
          },
        },
        {
          id: 'filter-sell',
          component: {
            Button: { label: { literalString: 'Sell' }, actionId: 'filter-sell', variant: 'ghost', size: 'sm' },
          },
        },
        {
          id: 'txn-list',
          component: {
            List: {
              items: { path: tradesPath },
              maxItems,
              template: ['txn-row'],
            },
          },
        },
        {
          id: 'txn-row',
          component: {
            Row: {
              children: ['txn-type-symbol', 'txn-amount-price', 'txn-total-time'],
              style: {
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              },
            },
          },
        },
        {
          id: 'txn-type-symbol',
          component: {
            Column: {
              children: ['txn-type', 'txn-symbol'],
            },
          },
        },
        {
          id: 'txn-type',
          component: {
            Text: {
              text: { path: 'type' },
              semantic: 'caption',
              style: { textTransform: 'uppercase' },
              conditionalStyle: {
                buy: { color: '#22c55e' },
                sell: { color: '#ef4444' },
              },
            },
          },
        },
        {
          id: 'txn-symbol',
          component: { Text: { text: { path: 'symbol' }, semantic: 'body', style: { fontWeight: 'bold' } } },
        },
        {
          id: 'txn-amount-price',
          component: {
            Column: {
              children: ['txn-amount', 'txn-price'],
              style: { alignItems: 'flex-end' },
            },
          },
        },
        {
          id: 'txn-amount',
          component: { Text: { text: { path: 'amount' }, format: 'number', semantic: 'body' } },
        },
        {
          id: 'txn-price',
          component: { Text: { text: { path: 'price' }, format: 'currency', semantic: 'caption' } },
        },
        {
          id: 'txn-total-time',
          component: {
            Column: {
              children: ['txn-total', 'txn-time'],
              style: { alignItems: 'flex-end' },
            },
          },
        },
        {
          id: 'txn-total',
          component: { Text: { text: { path: 'total' }, format: 'currency', semantic: 'body' } },
        },
        {
          id: 'txn-time',
          component: { Text: { text: { path: 'timestamp' }, format: 'relative', semantic: 'caption' } },
        },
      ],
    };
  },

  /**
   * Create a Price Alert card
   */
  PriceAlert(
    alertsPath: string,
    options?: {
      maxAlerts?: number;
      showCreate?: boolean;
    }
  ): Record<string, unknown> {
    const maxAlerts = options?.maxAlerts ?? 5;

    return {
      Card: {
        children: ['alert-header', 'alert-list', 'alert-create'],
        style: { padding: '16px' },
      },
      _components: [
        {
          id: 'alert-header',
          component: {
            Row: {
              children: ['alert-title', 'alert-count'],
              style: { justifyContent: 'space-between', marginBottom: '12px' },
            },
          },
        },
        {
          id: 'alert-title',
          component: { Text: { text: { literalString: 'Price Alerts' }, semantic: 'h4' } },
        },
        {
          id: 'alert-count',
          component: {
            Text: {
              text: { path: '/activeAlertCount' },
              semantic: 'caption',
              suffix: { literalString: ' active' },
            },
          },
        },
        {
          id: 'alert-list',
          component: {
            List: {
              items: { path: alertsPath },
              maxItems: maxAlerts,
              template: ['alert-row'],
            },
          },
        },
        {
          id: 'alert-row',
          component: {
            Row: {
              children: ['alert-info', 'alert-toggle'],
              style: {
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              },
            },
          },
        },
        {
          id: 'alert-info',
          component: {
            Column: {
              children: ['alert-symbol', 'alert-condition'],
            },
          },
        },
        {
          id: 'alert-symbol',
          component: { Text: { text: { path: 'symbol' }, semantic: 'body', style: { fontWeight: 'bold' } } },
        },
        {
          id: 'alert-condition',
          component: {
            Text: {
              text: { path: 'condition' },
              semantic: 'caption',
              // Example: "Above $50,000" or "Below $40,000"
            },
          },
        },
        {
          id: 'alert-toggle',
          component: {
            Checkbox: {
              id: { path: 'id' },
              checked: { path: 'active' },
              actionId: 'toggle-alert',
            },
          },
        },
        {
          id: 'alert-create',
          component: {
            Button: {
              label: { literalString: '+ New Alert' },
              actionId: 'create-alert',
              variant: 'secondary',
              style: { marginTop: '12px', width: '100%' },
            },
          },
        },
      ],
    };
  },

  /**
   * Create a Watchlist component
   */
  Watchlist(
    watchlistPath: string,
    options?: {
      maxItems?: number;
      sortable?: boolean;
    }
  ): Record<string, unknown> {
    const maxItems = options?.maxItems ?? 10;

    return {
      Card: {
        children: ['watchlist-header', 'watchlist-items'],
        style: { padding: '16px' },
      },
      _components: [
        {
          id: 'watchlist-header',
          component: {
            Row: {
              children: ['watchlist-title', 'watchlist-add'],
              style: { justifyContent: 'space-between', marginBottom: '12px' },
            },
          },
        },
        {
          id: 'watchlist-title',
          component: { Text: { text: { literalString: 'Watchlist' }, semantic: 'h4' } },
        },
        {
          id: 'watchlist-add',
          component: {
            Button: {
              label: { literalString: '+' },
              actionId: 'add-to-watchlist',
              variant: 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'watchlist-items',
          component: {
            List: {
              items: { path: watchlistPath },
              maxItems,
              template: ['watchlist-row'],
            },
          },
        },
        {
          id: 'watchlist-row',
          component: {
            Row: {
              children: ['watch-symbol', 'watch-price', 'watch-change', 'watch-actions'],
              style: {
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              },
              onClick: 'view-asset',
            },
          },
        },
        {
          id: 'watch-symbol',
          component: {
            Column: {
              children: ['watch-symbol-text', 'watch-name'],
              style: { minWidth: '80px' },
            },
          },
        },
        {
          id: 'watch-symbol-text',
          component: { Text: { text: { path: 'symbol' }, semantic: 'body', style: { fontWeight: 'bold' } } },
        },
        {
          id: 'watch-name',
          component: { Text: { text: { path: 'name' }, semantic: 'caption' } },
        },
        {
          id: 'watch-price',
          component: { Text: { text: { path: 'price' }, format: 'currency', semantic: 'body' } },
        },
        {
          id: 'watch-change',
          component: {
            Text: {
              text: { path: 'change24h' },
              format: 'percent',
              conditionalStyle: {
                positive: { color: '#22c55e' },
                negative: { color: '#ef4444' },
              },
            },
          },
        },
        {
          id: 'watch-actions',
          component: {
            Row: {
              children: ['watch-trade', 'watch-remove'],
              style: { gap: '4px' },
            },
          },
        },
        {
          id: 'watch-trade',
          component: {
            Button: {
              label: { literalString: 'Trade' },
              actionId: 'quick-trade',
              variant: 'primary',
              size: 'sm',
            },
          },
        },
        {
          id: 'watch-remove',
          component: {
            Button: {
              label: { literalString: 'x' },
              actionId: 'remove-from-watchlist',
              variant: 'ghost',
              size: 'sm',
            },
          },
        },
      ],
    };
  },

  /**
   * Create a simple Chart placeholder component
   * Note: Actual charting would need client-side rendering
   */
  ChartPlaceholder(
    symbol: string,
    timeframe: '1h' | '24h' | '7d' | '30d' | '1y' = '24h',
    _options?: {
      showVolume?: boolean;
      showIndicators?: boolean;
    }
  ): Record<string, unknown> {
    return {
      Card: {
        children: ['chart-header', 'chart-timeframes', 'chart-area', 'chart-legend'],
        style: { padding: '16px' },
      },
      _components: [
        {
          id: 'chart-header',
          component: {
            Row: {
              children: ['chart-title', 'chart-type-toggle'],
              style: { justifyContent: 'space-between', marginBottom: '12px' },
            },
          },
        },
        {
          id: 'chart-title',
          component: { Text: { text: { literalString: `${symbol} Price Chart` }, semantic: 'h4' } },
        },
        {
          id: 'chart-type-toggle',
          component: {
            Row: {
              children: ['chart-line', 'chart-candle'],
              style: { gap: '4px' },
            },
          },
        },
        {
          id: 'chart-line',
          component: {
            Button: { label: { literalString: 'Line' }, actionId: 'chart-type-line', variant: 'ghost', size: 'sm' },
          },
        },
        {
          id: 'chart-candle',
          component: {
            Button: { label: { literalString: 'Candle' }, actionId: 'chart-type-candle', variant: 'primary', size: 'sm' },
          },
        },
        {
          id: 'chart-timeframes',
          component: {
            Row: {
              children: ['tf-1h', 'tf-24h', 'tf-7d', 'tf-30d', 'tf-1y'],
              style: { gap: '8px', marginBottom: '16px' },
            },
          },
        },
        {
          id: 'tf-1h',
          component: {
            Button: {
              label: { literalString: '1H' },
              actionId: 'timeframe-1h',
              variant: timeframe === '1h' ? 'primary' : 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'tf-24h',
          component: {
            Button: {
              label: { literalString: '24H' },
              actionId: 'timeframe-24h',
              variant: timeframe === '24h' ? 'primary' : 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'tf-7d',
          component: {
            Button: {
              label: { literalString: '7D' },
              actionId: 'timeframe-7d',
              variant: timeframe === '7d' ? 'primary' : 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'tf-30d',
          component: {
            Button: {
              label: { literalString: '30D' },
              actionId: 'timeframe-30d',
              variant: timeframe === '30d' ? 'primary' : 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'tf-1y',
          component: {
            Button: {
              label: { literalString: '1Y' },
              actionId: 'timeframe-1y',
              variant: timeframe === '1y' ? 'primary' : 'ghost',
              size: 'sm',
            },
          },
        },
        {
          id: 'chart-area',
          component: {
            Image: {
              src: { path: '/chartImageUrl' },
              alt: { literalString: `${symbol} price chart` },
              style: {
                width: '100%',
                height: '300px',
                background: 'linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%)',
                borderRadius: '8px',
              },
            },
          },
        },
        {
          id: 'chart-legend',
          component: {
            Row: {
              children: ['legend-high', 'legend-low', 'legend-volume'],
              style: {
                justifyContent: 'space-around',
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
              },
            },
          },
        },
        {
          id: 'legend-high',
          component: {
            Column: {
              children: ['legend-high-label', 'legend-high-value'],
              style: { alignItems: 'center' },
            },
          },
        },
        {
          id: 'legend-high-label',
          component: { Text: { text: { literalString: 'High' }, semantic: 'caption' } },
        },
        {
          id: 'legend-high-value',
          component: { Text: { text: { path: '/high24h' }, format: 'currency', style: { color: '#22c55e' } } },
        },
        {
          id: 'legend-low',
          component: {
            Column: {
              children: ['legend-low-label', 'legend-low-value'],
              style: { alignItems: 'center' },
            },
          },
        },
        {
          id: 'legend-low-label',
          component: { Text: { text: { literalString: 'Low' }, semantic: 'caption' } },
        },
        {
          id: 'legend-low-value',
          component: { Text: { text: { path: '/low24h' }, format: 'currency', style: { color: '#ef4444' } } },
        },
        {
          id: 'legend-volume',
          component: {
            Column: {
              children: ['legend-volume-label', 'legend-volume-value'],
              style: { alignItems: 'center' },
            },
          },
        },
        {
          id: 'legend-volume-label',
          component: { Text: { text: { literalString: 'Volume' }, semantic: 'caption' } },
        },
        {
          id: 'legend-volume-value',
          component: { Text: { text: { path: '/volume24h' }, format: 'compact' } },
        },
      ],
    };
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a complete trading dashboard layout
 * Returns A2UI messages that can be used as artifact data
 */
export function createTradingDashboard(
  symbol: string,
  data: {
    ticker: PriceData;
    orderBook: OrderBookData;
    portfolio: PortfolioData;
    trades: TradeData[];
    watchlist: PriceData[];
    alerts: AlertData[];
  }
): Record<string, unknown>[] {
  return [
    {
      type: 'beginRendering',
      surfaceId: 'trading-dashboard',
      rootComponentId: 'dashboard-root',
      styling: {
        primaryColor: '#6366f1',
        fontFamily: 'Inter, system-ui',
        theme: 'dark',
      },
    },
    {
      type: 'setModel',
      surfaceId: 'trading-dashboard',
      model: {
        currentSymbol: symbol,
        ...data.ticker,
        orderBook: data.orderBook,
        portfolio: data.portfolio,
        trades: data.trades,
        watchlist: data.watchlist,
        alerts: data.alerts,
        activeAlertCount: data.alerts.filter(a => a.active).length,
      },
    },
    {
      type: 'surfaceUpdate',
      surfaceId: 'trading-dashboard',
      components: [
        { id: 'dashboard-root', component: { Column: { children: ['header-row', 'main-row', 'bottom-row'], style: { gap: '16px' } } } },
        { id: 'header-row', component: { Row: { children: ['ticker', 'portfolio-summary'], style: { gap: '16px' } } } },
        { id: 'ticker', component: TradingComponents.MarketTicker({ path: '/symbol' }, { path: '/price' }, { path: '/change24h' }) },
        { id: 'portfolio-summary', component: TradingComponents.PortfolioSummary({
          totalValuePath: '/portfolio/totalValue',
          changePath: '/portfolio/change24h',
          pnlPath: '/portfolio/pnl',
          holdingsPath: '/portfolio/holdings',
        }, { maxHoldings: 3 }) },
        { id: 'main-row', component: { Row: { children: ['chart', 'order-book', 'trade-form'], style: { gap: '16px' } } } },
        { id: 'chart', component: TradingComponents.ChartPlaceholder(symbol, '24h') },
        { id: 'order-book', component: TradingComponents.OrderBook('/orderBook/bids', '/orderBook/asks', { maxEntries: 8 }) },
        { id: 'trade-form', component: TradingComponents.TradeForm(symbol, 'buy') },
        { id: 'bottom-row', component: { Row: { children: ['trades', 'watchlist', 'alerts'], style: { gap: '16px' } } } },
        { id: 'trades', component: TradingComponents.TransactionList('/trades', { maxItems: 5 }) },
        { id: 'watchlist', component: TradingComponents.Watchlist('/watchlist', { maxItems: 5 }) },
        { id: 'alerts', component: TradingComponents.PriceAlert('/alerts', { maxAlerts: 3 }) },
      ],
    },
  ];
}

export default TradingComponents;
