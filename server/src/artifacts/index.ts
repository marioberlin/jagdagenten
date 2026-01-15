/**
 * Artifact Management System Exports
 */

// Types
export type {
  StoredArtifact,
  ArtifactReference,
  ArtifactVersion,
  ArtifactTemplate,
  ArtifactCategory,
  TemplatePart,
  ArtifactFilters,
  ArtifactSearchResult,
  ArtifactRegistry,
  ArtifactStats,
  ArtifactEvent,
  ArtifactEventListener,
  ArtifactRegistryConfig,
  ReferenceType,
} from './types.js';

// PostgreSQL Store
export {
  PostgresArtifactStore,
  createArtifactStore,
  createArtifactStoreFromEnv,
} from './postgres-store.js';

// API Routes
export { createArtifactRoutes } from './routes.js';

// Trading-specific templates
export const TRADING_TEMPLATES = [
  {
    id: 'portfolio-snapshot',
    name: 'Portfolio Snapshot',
    category: 'portfolio' as const,
    description: 'Snapshot of current portfolio holdings',
    template: {
      parts: [
        { type: 'data' as const, data: { holdings: '{{holdings}}', timestamp: '{{timestamp}}', totalValue: '{{totalValue}}' } },
      ],
      metadata: { category: 'portfolio' },
    },
  },
  {
    id: 'trade-confirmation',
    name: 'Trade Confirmation',
    category: 'trading' as const,
    description: 'Confirmation of an executed trade',
    template: {
      parts: [
        { type: 'text' as const, text: 'Trade executed: {{side}} {{quantity}} {{symbol}} @ {{price}}' },
        { type: 'data' as const, data: { orderId: '{{orderId}}', status: '{{status}}', fee: '{{fee}}' } },
      ],
      metadata: { category: 'trading' },
    },
  },
  {
    id: 'price-alert',
    name: 'Price Alert',
    category: 'alert' as const,
    description: 'Triggered price alert notification',
    template: {
      parts: [
        { type: 'text' as const, text: '{{symbol}} reached {{price}} ({{direction}} threshold)' },
        { type: 'data' as const, data: { symbol: '{{symbol}}', price: '{{price}}', threshold: '{{threshold}}' } },
      ],
      metadata: { category: 'alert' },
    },
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    category: 'analysis' as const,
    description: 'AI-generated market analysis report',
    template: {
      parts: [
        { type: 'text' as const, text: '{{analysis}}' },
        { type: 'data' as const, data: { symbol: '{{symbol}}', sentiment: '{{sentiment}}', confidence: '{{confidence}}' } },
      ],
      metadata: { category: 'analysis' },
    },
  },
  {
    id: 'performance-report',
    name: 'Performance Report',
    category: 'report' as const,
    description: 'Period performance summary',
    template: {
      parts: [
        { type: 'text' as const, text: 'Performance Report: {{period}}' },
        { type: 'data' as const, data: {
          period: '{{period}}',
          pnl: '{{pnl}}',
          pnlPercent: '{{pnlPercent}}',
          trades: '{{trades}}',
          winRate: '{{winRate}}',
        }},
      ],
      metadata: { category: 'report' },
    },
  },
];
