// @ts-nocheck
/**
 * RizzCharts A2UI Examples
 *
 * @deprecated These examples use legacy A2UI type structure.
 * They need to be updated to use the new SDK-based A2UI types.
 *
 * These examples are adapted from Google's A2UI rizzcharts sample
 * and demonstrate chart/dashboard generation using A2UI format
 * that transforms to LiquidCrypto's Glass components.
 *
 * @see https://github.com/google/A2UI/tree/main/samples/agent/adk/rizzcharts
 */

import type { A2UIMessage } from '../types';

/**
 * Sales dashboard with category breakdown chart
 */
export const salesDashboard: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'sales-dashboard',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#00BFFF', // DeepSkyBlue
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'sales-dashboard',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'metrics-row', 'chart-section'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Row: {
                        children: ['title', 'date-range'],
                        distribution: 'spaceBetween',
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'title',
                component: {
                    Text: {
                        text: { literalString: 'Sales by Category' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'date-range',
                component: {
                    Text: {
                        text: { path: '/chart.dateRange' },
                    },
                },
            },
            {
                id: 'metrics-row',
                component: {
                    Row: {
                        children: ['metric-total', 'metric-growth', 'metric-orders'],
                        distribution: 'spaceEvenly',
                    },
                },
            },
            {
                id: 'metric-total',
                component: {
                    Card: {
                        children: ['metric-total-content'],
                    },
                },
            },
            {
                id: 'metric-total-content',
                component: {
                    Column: {
                        children: ['metric-total-label', 'metric-total-value'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'metric-total-label',
                component: {
                    Text: {
                        text: { literalString: 'Total Sales' },
                    },
                },
            },
            {
                id: 'metric-total-value',
                component: {
                    Text: {
                        text: { path: '/metrics.totalSales' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'metric-growth',
                component: {
                    Card: {
                        children: ['metric-growth-content'],
                    },
                },
            },
            {
                id: 'metric-growth-content',
                component: {
                    Column: {
                        children: ['metric-growth-label', 'metric-growth-value'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'metric-growth-label',
                component: {
                    Text: {
                        text: { literalString: 'Growth' },
                    },
                },
            },
            {
                id: 'metric-growth-value',
                component: {
                    Text: {
                        text: { path: '/metrics.growth' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'metric-orders',
                component: {
                    Card: {
                        children: ['metric-orders-content'],
                    },
                },
            },
            {
                id: 'metric-orders-content',
                component: {
                    Column: {
                        children: ['metric-orders-label', 'metric-orders-value'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'metric-orders-label',
                component: {
                    Text: {
                        text: { literalString: 'Total Orders' },
                    },
                },
            },
            {
                id: 'metric-orders-value',
                component: {
                    Text: {
                        text: { path: '/metrics.totalOrders' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'chart-section',
                component: {
                    Card: {
                        children: ['category-list'],
                    },
                },
            },
            {
                id: 'category-list',
                component: {
                    List: {
                        items: { path: '/chart.items' },
                        template: 'category-row',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'category-row',
                component: {
                    Row: {
                        children: ['category-name', 'category-value'],
                        distribution: 'spaceBetween',
                    },
                },
            },
            {
                id: 'category-name',
                component: {
                    Text: {
                        text: { path: 'label' },
                    },
                },
            },
            {
                id: 'category-value',
                component: {
                    Text: {
                        text: { path: 'value' },
                        semantic: 'h3',
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'sales-dashboard',
        data: {
            chart: {
                title: 'Sales by Category',
                dateRange: 'Jan 1 - Jan 12, 2026',
                items: [
                    { label: 'Apparel', value: '41' },
                    { label: 'Home Goods', value: '15' },
                    { label: 'Electronics', value: '28' },
                    { label: 'Health & Beauty', value: '10' },
                    { label: 'Other', value: '6' },
                ],
            },
            metrics: {
                totalSales: '$1,234,567',
                growth: '+12.5%',
                totalOrders: '8,432',
            },
        },
    },
];

/**
 * Map view with points of interest
 */
export const locationMap: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'la-map-view',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#4285F4', // Google Blue
            fontFamily: 'Roboto, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'la-map-view',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'map-placeholder', 'locations-list'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Text: {
                        text: { literalString: 'Points of Interest in Los Angeles' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'map-placeholder',
                component: {
                    Card: {
                        children: ['map-image'],
                    },
                },
            },
            {
                id: 'map-image',
                component: {
                    Image: {
                        src: { literalString: '/images/maps/la-map.png' },
                        alt: { literalString: 'Map of Los Angeles' },
                        height: 300,
                    },
                },
            },
            {
                id: 'locations-list',
                component: {
                    List: {
                        items: { path: '/mapConfig.locations' },
                        template: 'location-card',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'location-card',
                component: {
                    Card: {
                        children: ['location-content'],
                    },
                },
            },
            {
                id: 'location-content',
                component: {
                    Row: {
                        children: ['location-icon', 'location-info'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'location-icon',
                component: {
                    Icon: {
                        name: { literalString: 'place' },
                        size: 24,
                    },
                },
            },
            {
                id: 'location-info',
                component: {
                    Column: {
                        children: ['location-name', 'location-description'],
                    },
                },
            },
            {
                id: 'location-name',
                component: {
                    Text: {
                        text: { path: 'name' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'location-description',
                component: {
                    Text: {
                        text: { path: 'description' },
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'la-map-view',
        data: {
            mapConfig: {
                center: { lat: 34.0522, lng: -118.2437 },
                zoom: 11,
                locations: [
                    {
                        name: 'Google Store Santa Monica',
                        description: 'Official Google merchandise store',
                    },
                    {
                        name: 'Griffith Observatory',
                        description: 'Iconic observatory with city views',
                    },
                    {
                        name: 'Hollywood Sign Viewpoint',
                        description: 'Best views of the famous sign',
                    },
                    {
                        name: 'Crypto.com Arena',
                        description: 'Home of the Lakers and Clippers',
                    },
                    {
                        name: 'LACMA',
                        description: 'Los Angeles County Museum of Art',
                    },
                    {
                        name: 'Venice Beach Boardwalk',
                        description: 'Famous beachfront promenade',
                    },
                ],
            },
        },
    },
];

/**
 * Crypto portfolio dashboard
 * (LiquidCrypto-specific example)
 */
export const cryptoPortfolio: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'crypto-portfolio',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#8b5cf6', // Violet to match LiquidCrypto
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'crypto-portfolio',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'portfolio-value', 'holdings-section', 'actions-row'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Row: {
                        children: ['title', 'refresh-button'],
                        distribution: 'spaceBetween',
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'title',
                component: {
                    Text: {
                        text: { literalString: 'Your Portfolio' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'refresh-button',
                component: {
                    Button: {
                        label: { literalString: 'Refresh' },
                        action: {
                            custom: {
                                actionId: 'refresh_portfolio',
                            },
                        },
                    },
                },
            },
            {
                id: 'portfolio-value',
                component: {
                    Card: {
                        children: ['value-content'],
                    },
                },
            },
            {
                id: 'value-content',
                component: {
                    Column: {
                        children: ['total-label', 'total-value', 'change-row'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'total-label',
                component: {
                    Text: {
                        text: { literalString: 'Total Value' },
                    },
                },
            },
            {
                id: 'total-value',
                component: {
                    Text: {
                        text: { path: '/portfolio.totalValue' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'change-row',
                component: {
                    Row: {
                        children: ['change-value', 'change-percent'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'change-value',
                component: {
                    Text: {
                        text: { path: '/portfolio.change24h' },
                    },
                },
            },
            {
                id: 'change-percent',
                component: {
                    Text: {
                        text: { path: '/portfolio.changePercent' },
                    },
                },
            },
            {
                id: 'holdings-section',
                component: {
                    Column: {
                        children: ['holdings-header', 'holdings-list'],
                    },
                },
            },
            {
                id: 'holdings-header',
                component: {
                    Text: {
                        text: { literalString: 'Holdings' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'holdings-list',
                component: {
                    List: {
                        items: { path: '/portfolio.holdings' },
                        template: 'holding-card',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'holding-card',
                component: {
                    Card: {
                        children: ['holding-content'],
                    },
                },
            },
            {
                id: 'holding-content',
                component: {
                    Row: {
                        children: ['holding-info', 'holding-value'],
                        distribution: 'spaceBetween',
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'holding-info',
                component: {
                    Row: {
                        children: ['coin-icon', 'coin-details'],
                        alignment: 'center',
                    },
                },
            },
            {
                id: 'coin-icon',
                component: {
                    Image: {
                        src: { path: 'icon' },
                        width: 40,
                        height: 40,
                    },
                },
            },
            {
                id: 'coin-details',
                component: {
                    Column: {
                        children: ['coin-name', 'coin-amount'],
                    },
                },
            },
            {
                id: 'coin-name',
                component: {
                    Text: {
                        text: { path: 'name' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'coin-amount',
                component: {
                    Text: {
                        text: { path: 'amount' },
                    },
                },
            },
            {
                id: 'holding-value',
                component: {
                    Column: {
                        children: ['value-usd', 'value-change'],
                        alignment: 'end',
                    },
                },
            },
            {
                id: 'value-usd',
                component: {
                    Text: {
                        text: { path: 'valueUsd' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'value-change',
                component: {
                    Text: {
                        text: { path: 'change24h' },
                    },
                },
            },
            {
                id: 'actions-row',
                component: {
                    Row: {
                        children: ['buy-button', 'sell-button', 'swap-button'],
                        distribution: 'spaceEvenly',
                    },
                },
            },
            {
                id: 'buy-button',
                component: {
                    Button: {
                        label: { literalString: 'Buy' },
                        primary: true,
                        action: {
                            custom: {
                                actionId: 'open_buy',
                            },
                        },
                    },
                },
            },
            {
                id: 'sell-button',
                component: {
                    Button: {
                        label: { literalString: 'Sell' },
                        action: {
                            custom: {
                                actionId: 'open_sell',
                            },
                        },
                    },
                },
            },
            {
                id: 'swap-button',
                component: {
                    Button: {
                        label: { literalString: 'Swap' },
                        action: {
                            custom: {
                                actionId: 'open_swap',
                            },
                        },
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'crypto-portfolio',
        data: {
            portfolio: {
                totalValue: '$45,231.89',
                change24h: '+$1,234.56',
                changePercent: '+2.8%',
                holdings: [
                    {
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        icon: '/images/crypto/btc.svg',
                        amount: '0.5 BTC',
                        valueUsd: '$23,456.78',
                        change24h: '+3.2%',
                    },
                    {
                        symbol: 'ETH',
                        name: 'Ethereum',
                        icon: '/images/crypto/eth.svg',
                        amount: '4.2 ETH',
                        valueUsd: '$15,234.11',
                        change24h: '+1.8%',
                    },
                    {
                        symbol: 'SOL',
                        name: 'Solana',
                        icon: '/images/crypto/sol.svg',
                        amount: '25 SOL',
                        valueUsd: '$4,567.00',
                        change24h: '+5.4%',
                    },
                    {
                        symbol: 'USDC',
                        name: 'USD Coin',
                        icon: '/images/crypto/usdc.svg',
                        amount: '1,974.00 USDC',
                        valueUsd: '$1,974.00',
                        change24h: '0.0%',
                    },
                ],
            },
        },
    },
];

/**
 * Trading interface
 * (LiquidCrypto-specific example)
 */
export const tradingInterface: A2UIMessage[] = [
    {
        type: 'beginRendering',
        surfaceId: 'trading-ui',
        rootComponentId: 'root',
        styling: {
            primaryColor: '#6366f1',
            fontFamily: 'Inter, system-ui, sans-serif',
        },
    },
    {
        type: 'surfaceUpdate',
        surfaceId: 'trading-ui',
        components: [
            {
                id: 'root',
                component: {
                    Column: {
                        children: ['header', 'price-display', 'trade-form', 'order-book-preview'],
                    },
                },
            },
            {
                id: 'header',
                component: {
                    Row: {
                        children: ['pair-name', 'pair-price'],
                        distribution: 'spaceBetween',
                    },
                },
            },
            {
                id: 'pair-name',
                component: {
                    Text: {
                        text: { path: '/trade.pair' },
                        semantic: 'h1',
                    },
                },
            },
            {
                id: 'pair-price',
                component: {
                    Column: {
                        children: ['current-price', 'price-change'],
                        alignment: 'end',
                    },
                },
            },
            {
                id: 'current-price',
                component: {
                    Text: {
                        text: { path: '/trade.price' },
                        semantic: 'h2',
                    },
                },
            },
            {
                id: 'price-change',
                component: {
                    Text: {
                        text: { path: '/trade.change24h' },
                    },
                },
            },
            {
                id: 'price-display',
                component: {
                    Card: {
                        children: ['chart-placeholder'],
                    },
                },
            },
            {
                id: 'chart-placeholder',
                component: {
                    Image: {
                        src: { literalString: '/images/charts/btc-chart.png' },
                        height: 200,
                    },
                },
            },
            {
                id: 'trade-form',
                component: {
                    Card: {
                        children: ['form-content'],
                    },
                },
            },
            {
                id: 'form-content',
                component: {
                    Column: {
                        children: [
                            'order-type-selector',
                            'amount-field',
                            'price-field',
                            'total-display',
                            'submit-row',
                        ],
                    },
                },
            },
            {
                id: 'order-type-selector',
                component: {
                    Row: {
                        children: ['buy-tab', 'sell-tab'],
                    },
                },
            },
            {
                id: 'buy-tab',
                component: {
                    Button: {
                        label: { literalString: 'Buy' },
                        primary: true,
                        action: {
                            custom: {
                                actionId: 'set_order_type',
                                data: { type: 'buy' },
                            },
                        },
                    },
                },
                weight: 1,
            },
            {
                id: 'sell-tab',
                component: {
                    Button: {
                        label: { literalString: 'Sell' },
                        action: {
                            custom: {
                                actionId: 'set_order_type',
                                data: { type: 'sell' },
                            },
                        },
                    },
                },
                weight: 1,
            },
            {
                id: 'amount-field',
                component: {
                    TextField: {
                        label: { literalString: 'Amount (BTC)' },
                        placeholder: { literalString: '0.00' },
                        inputType: 'number',
                        binding: 'amount',
                    },
                },
            },
            {
                id: 'price-field',
                component: {
                    TextField: {
                        label: { literalString: 'Price (USD)' },
                        placeholder: { literalString: 'Market price' },
                        inputType: 'number',
                        binding: 'price',
                    },
                },
            },
            {
                id: 'total-display',
                component: {
                    Row: {
                        children: ['total-label', 'total-value'],
                        distribution: 'spaceBetween',
                    },
                },
            },
            {
                id: 'total-label',
                component: {
                    Text: {
                        text: { literalString: 'Total' },
                    },
                },
            },
            {
                id: 'total-value',
                component: {
                    Text: {
                        text: { path: '/trade.total' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'submit-row',
                component: {
                    Button: {
                        label: { literalString: 'Place Order' },
                        primary: true,
                        action: {
                            submit: {
                                data: {},
                            },
                        },
                    },
                },
            },
            {
                id: 'order-book-preview',
                component: {
                    Card: {
                        children: ['orderbook-header', 'orderbook-content'],
                    },
                },
            },
            {
                id: 'orderbook-header',
                component: {
                    Text: {
                        text: { literalString: 'Order Book' },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: 'orderbook-content',
                component: {
                    Row: {
                        children: ['bids-column', 'asks-column'],
                    },
                },
            },
            {
                id: 'bids-column',
                component: {
                    Column: {
                        children: ['bids-header', 'bids-list'],
                    },
                },
                weight: 1,
            },
            {
                id: 'bids-header',
                component: {
                    Text: {
                        text: { literalString: 'Bids' },
                    },
                },
            },
            {
                id: 'bids-list',
                component: {
                    List: {
                        items: { path: '/orderbook.bids' },
                        template: 'order-row',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'asks-column',
                component: {
                    Column: {
                        children: ['asks-header', 'asks-list'],
                    },
                },
                weight: 1,
            },
            {
                id: 'asks-header',
                component: {
                    Text: {
                        text: { literalString: 'Asks' },
                    },
                },
            },
            {
                id: 'asks-list',
                component: {
                    List: {
                        items: { path: '/orderbook.asks' },
                        template: 'order-row',
                        direction: 'vertical',
                    },
                },
            },
            {
                id: 'order-row',
                component: {
                    Row: {
                        children: ['order-price', 'order-amount'],
                        distribution: 'spaceBetween',
                    },
                },
            },
            {
                id: 'order-price',
                component: {
                    Text: {
                        text: { path: 'price' },
                    },
                },
            },
            {
                id: 'order-amount',
                component: {
                    Text: {
                        text: { path: 'amount' },
                    },
                },
            },
        ],
    },
    {
        type: 'dataModelUpdate',
        surfaceId: 'trading-ui',
        data: {
            trade: {
                pair: 'BTC/USD',
                price: '$46,892.34',
                change24h: '+2.3%',
                total: '$0.00',
            },
            orderbook: {
                bids: [
                    { price: '$46,890', amount: '0.5' },
                    { price: '$46,885', amount: '1.2' },
                    { price: '$46,880', amount: '0.8' },
                ],
                asks: [
                    { price: '$46,895', amount: '0.3' },
                    { price: '$46,900', amount: '0.9' },
                    { price: '$46,910', amount: '1.5' },
                ],
            },
        },
    },
];

/**
 * All RizzCharts examples
 */
export const rizzchartsExamples = {
    salesDashboard,
    locationMap,
    cryptoPortfolio,
    tradingInterface,
};

export default rizzchartsExamples;
