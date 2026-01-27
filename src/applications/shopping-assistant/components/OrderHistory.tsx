/**
 * Order History Component
 *
 * Displays customer's past orders with details, tracking, and reorder functionality.
 */
import React, { useState } from 'react';
import {
  Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp,
  ExternalLink, RefreshCw, Copy, MapPin, Calendar, CreditCard, Receipt,
  AlertCircle,
} from 'lucide-react';
import type { Order, LineItem, Money, Address } from '@/services/a2a/CommerceService';

// ============================================================================
// Types
// ============================================================================

export interface OrderHistoryItem extends Order {
  line_items: LineItem[];
  total: Money;
  subtotal: Money;
  shipping_total: Money;
  tax_total: Money;
  shipping_address?: Address;
  created_at: string;
}

interface OrderHistoryProps {
  orders: OrderHistoryItem[];
  isLoading?: boolean;
  onReorder?: (order: OrderHistoryItem) => void;
  onTrack?: (order: OrderHistoryItem) => void;
  emptyMessage?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  isLoading = false,
  onReorder,
  onTrack,
  emptyMessage = 'No orders yet',
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-glass-elevated rounded-xl border border-white/5 p-4 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-4 bg-white/10 rounded w-32" />
              <div className="h-4 bg-white/10 rounded w-20" />
            </div>
            <div className="h-3 bg-white/5 rounded w-48 mb-2" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <Package size={48} className="text-white/20" />
        </div>
        <p className="text-white/50 mb-2">{emptyMessage}</p>
        <p className="text-sm text-white/30">Your orders will appear here after you make a purchase</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isExpanded={expandedOrders.has(order.id)}
          onToggle={() => toggleOrder(order.id)}
          onReorder={onReorder}
          onTrack={onTrack}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Order Card
// ============================================================================

const OrderCard: React.FC<{
  order: OrderHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onReorder?: (order: OrderHistoryItem) => void;
  onTrack?: (order: OrderHistoryItem) => void;
}> = ({ order, isExpanded, onToggle, onReorder, onTrack }) => {
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = async () => {
    await navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const itemCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <OrderStatusIcon status={order.status} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white">{order.order_number}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyOrderNumber();
                }}
                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
                title="Copy order number"
              >
                {copied ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar size={12} />
              <span>{formatDate(order.created_at)}</span>
              <span>•</span>
              <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-lg font-medium text-white">{formatMoney(order.total)}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          {isExpanded ? (
            <ChevronUp size={20} className="text-white/40" />
          ) : (
            <ChevronDown size={20} className="text-white/40" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {/* Timeline */}
          <OrderTimeline order={order} />

          {/* Line Items */}
          <div className="p-4 border-t border-white/5">
            <h4 className="text-sm font-medium text-white/60 mb-3">Items</h4>
            <div className="space-y-3">
              {order.line_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Package size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/40">
                      Qty: {item.quantity} × {formatMoney(item.unit_price)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {formatMoney(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 border-t border-white/5 bg-white/5">
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Shipping Address */}
              {order.shipping_address && (
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                    <MapPin size={14} />
                    Shipping Address
                  </h4>
                  <p className="text-sm text-white/80">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className="text-xs text-white/40">
                    {order.shipping_address.address_line_1}
                    {order.shipping_address.address_line_2 && `, ${order.shipping_address.address_line_2}`}
                  </p>
                  <p className="text-xs text-white/40">
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                </div>
              )}

              {/* Right: Order Total */}
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                  <Receipt size={14} />
                  Order Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>{formatMoney(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>{formatMoney(order.shipping_total)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax</span>
                    <span>{formatMoney(order.tax_total)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-white pt-1 border-t border-white/10">
                    <span>Total</span>
                    <span>{formatMoney(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-white/5 flex items-center gap-3">
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-all"
              >
                <Truck size={14} />
                <span>Track Package</span>
                <ExternalLink size={12} />
              </a>
            )}
            {onTrack && !order.tracking_url && (order.status === 'shipped' || order.status === 'processing') && (
              <button
                onClick={() => onTrack(order)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-all"
              >
                <Truck size={14} />
                <span>Track Order</span>
              </button>
            )}
            {onReorder && (
              <button
                onClick={() => onReorder(order)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all"
              >
                <RefreshCw size={14} />
                <span>Reorder</span>
              </button>
            )}
            {order.permalink_url && (
              <a
                href={order.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all"
              >
                <ExternalLink size={14} />
                <span>View Details</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Order Timeline
// ============================================================================

const OrderTimeline: React.FC<{ order: OrderHistoryItem }> = ({ order }) => {
  const steps = [
    { status: 'pending', label: 'Order Placed', icon: Receipt },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { status: 'processing', label: 'Processing', icon: Clock },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: Package },
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isRefunded = order.status === 'refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="p-4 bg-red-500/10 border-b border-red-500/20">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">
            Order {isCancelled ? 'Cancelled' : 'Refunded'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.status}>
              {/* Step */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/40'
                  } ${isCurrent ? 'ring-2 ring-green-500/30' : ''}`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isCompleted ? 'text-white/80' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Status Components
// ============================================================================

const OrderStatusIcon: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const icons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    pending: { icon: <Clock size={20} />, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    confirmed: { icon: <CheckCircle size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    processing: { icon: <RefreshCw size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    shipped: { icon: <Truck size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    delivered: { icon: <Package size={20} />, color: 'text-green-400', bg: 'bg-green-500/20' },
    cancelled: { icon: <XCircle size={20} />, color: 'text-red-400', bg: 'bg-red-500/20' },
    refunded: { icon: <CreditCard size={20} />, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  };

  const config = icons[status] || icons.pending;

  return (
    <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
      {config.icon}
    </div>
  );
};

const OrderStatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-blue-500/20 text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    refunded: 'bg-orange-500/20 text-orange-400',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function formatMoney(money: Money): string {
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default OrderHistory;
