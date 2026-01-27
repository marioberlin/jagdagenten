/**
 * Price Tracker Component
 * Tracks price history and shows price trends as artifacts
 */
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';

// Price history entry
export interface PriceHistoryEntry {
  timestamp: string;
  price: string;
  currency: string;
}

// Tracked product with price history
export interface TrackedProduct {
  id: string;
  product: Product;
  priceHistory: PriceHistoryEntry[];
  alertThreshold?: number;
  alertEnabled: boolean;
  trackingSince: string;
}

interface PriceTrackerProps {
  trackedProducts: TrackedProduct[];
  onToggleAlert: (productId: string, enabled: boolean) => void;
  onSetAlertThreshold: (productId: string, threshold: number | null) => void;
  onStopTracking: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

export const PriceTracker: React.FC<PriceTrackerProps> = ({
  trackedProducts,
  onToggleAlert,
  onSetAlertThreshold,
  onStopTracking,
  onAddToCart,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">Price Tracker</h3>
        </div>
        <span className="text-sm text-white/50">
          {trackedProducts.length} products tracked
        </span>
      </div>

      {trackedProducts.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No products being tracked</p>
          <p className="text-sm text-white/30 mt-2">
            Add products to track their price changes over time
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trackedProducts.map((tracked) => (
            <TrackedProductCard
              key={tracked.id}
              tracked={tracked}
              onToggleAlert={onToggleAlert}
              onSetAlertThreshold={onSetAlertThreshold}
              onStopTracking={onStopTracking}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual tracked product card
interface TrackedProductCardProps {
  tracked: TrackedProduct;
  onToggleAlert: (productId: string, enabled: boolean) => void;
  onSetAlertThreshold: (productId: string, threshold: number | null) => void;
  onStopTracking: (productId: string) => void;
  onAddToCart: (productId: string) => void;
}

const TrackedProductCard: React.FC<TrackedProductCardProps> = ({
  tracked,
  onToggleAlert,
  onSetAlertThreshold,
  onStopTracking,
  onAddToCart,
}) => {
  const priceStats = useMemo(() => {
    if (tracked.priceHistory.length < 2) {
      return {
        current: parseFloat(tracked.product.price.amount),
        change: 0,
        changePercent: 0,
        direction: 'same' as const,
        high: parseFloat(tracked.product.price.amount),
        low: parseFloat(tracked.product.price.amount),
        average: parseFloat(tracked.product.price.amount),
      };
    }

    const prices = tracked.priceHistory.map((h) => parseFloat(h.price));
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    const direction = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'same';

    return {
      current,
      change,
      changePercent,
      direction,
      high: Math.max(...prices),
      low: Math.min(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [tracked.priceHistory, tracked.product.price.amount]);

  const sparklineData = useMemo(() => {
    if (tracked.priceHistory.length < 2) return [];
    const prices = tracked.priceHistory.slice(-20).map((h) => parseFloat(h.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    return prices.map((p) => ((p - min) / range) * 100);
  }, [tracked.priceHistory]);

  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5">
            {tracked.product.images.length > 0 ? (
              <img
                src={tracked.product.images[0]}
                alt={tracked.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <DollarSign size={20} />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{tracked.product.name}</h4>
            <p className="text-xs text-white/40">
              Tracking since {new Date(tracked.trackingSince).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Alert toggle */}
        <button
          onClick={() => onToggleAlert(tracked.id, !tracked.alertEnabled)}
          className={`p-2 rounded-lg transition-all ${
            tracked.alertEnabled
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-white/5 text-white/40 hover:text-white/60'
          }`}
          title={tracked.alertEnabled ? 'Alerts enabled' : 'Enable alerts'}
        >
          {tracked.alertEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      </div>

      {/* Price and change */}
      <div className="flex items-end gap-4 mb-3">
        <div>
          <p className="text-2xl font-semibold text-white">
            ${priceStats.current.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {priceStats.direction === 'up' ? (
              <TrendingUp size={14} className="text-red-400" />
            ) : priceStats.direction === 'down' ? (
              <TrendingDown size={14} className="text-green-400" />
            ) : (
              <Minus size={14} className="text-white/40" />
            )}
            <span
              className={`text-sm ${
                priceStats.direction === 'up'
                  ? 'text-red-400'
                  : priceStats.direction === 'down'
                  ? 'text-green-400'
                  : 'text-white/40'
              }`}
            >
              {priceStats.direction !== 'same' && (priceStats.change > 0 ? '+' : '')}
              ${Math.abs(priceStats.change).toFixed(2)} ({priceStats.changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="flex-1 h-10 flex items-end gap-px">
            {sparklineData.map((value, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all ${
                  i === sparklineData.length - 1
                    ? 'bg-indigo-400'
                    : 'bg-white/20'
                }`}
                style={{ height: `${Math.max(10, value)}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-white/5 mb-3">
        <div className="text-center">
          <p className="text-xs text-white/40">High</p>
          <p className="text-sm font-medium text-white">${priceStats.high.toFixed(2)}</p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-xs text-white/40">Low</p>
          <p className="text-sm font-medium text-green-400">${priceStats.low.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40">Avg</p>
          <p className="text-sm font-medium text-white">${priceStats.average.toFixed(2)}</p>
        </div>
      </div>

      {/* Alert threshold */}
      {tracked.alertEnabled && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-3">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="text-xs text-yellow-400">
            {tracked.alertThreshold
              ? `Alert when price drops to $${tracked.alertThreshold}`
              : 'No price threshold set'}
          </span>
          <button
            onClick={() => {
              const threshold = prompt('Enter target price:');
              if (threshold) {
                onSetAlertThreshold(tracked.id, parseFloat(threshold));
              }
            }}
            className="ml-auto text-xs text-yellow-400 hover:text-yellow-300"
          >
            {tracked.alertThreshold ? 'Change' : 'Set'}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onAddToCart(tracked.product.id)}
          className="flex-1 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-all"
        >
          Add to Cart
        </button>
        <button
          onClick={() => onStopTracking(tracked.id)}
          className="py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all"
        >
          Stop Tracking
        </button>
      </div>
    </div>
  );
};

// Price Artifact Component - for saving as artifact
export interface PriceArtifact {
  type: 'price_tracking';
  productId: string;
  productName: string;
  currentPrice: string;
  currency: string;
  priceHistory: PriceHistoryEntry[];
  trackingSince: string;
  lastUpdated: string;
  stats: {
    high: number;
    low: number;
    average: number;
    changePercent: number;
  };
}

export function createPriceArtifact(tracked: TrackedProduct): PriceArtifact {
  const prices = tracked.priceHistory.map((h) => parseFloat(h.price));
  const current = parseFloat(tracked.product.price.amount);
  const first = prices[0] || current;

  return {
    type: 'price_tracking',
    productId: tracked.product.id,
    productName: tracked.product.name,
    currentPrice: tracked.product.price.amount,
    currency: tracked.product.price.currency,
    priceHistory: tracked.priceHistory,
    trackingSince: tracked.trackingSince,
    lastUpdated: new Date().toISOString(),
    stats: {
      high: prices.length > 0 ? Math.max(...prices) : current,
      low: prices.length > 0 ? Math.min(...prices) : current,
      average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : current,
      changePercent: first > 0 ? ((current - first) / first) * 100 : 0,
    },
  };
}

export default PriceTracker;
