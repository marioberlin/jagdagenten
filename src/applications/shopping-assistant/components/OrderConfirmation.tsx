/**
 * Order Confirmation
 * Success page after checkout completion
 */
import React from 'react';
import { CheckCircle, Package, Truck, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { Checkout, Order } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface OrderConfirmationProps {
  order: Order;
  checkout: Checkout;
  onNewOrder: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  checkout,
  onNewOrder
}) => {
  const { formatPrice } = useCurrency();

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Order Confirmed!</h1>
          <p className="text-white/60">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        {/* Order details card */}
        <div className="bg-glass-elevated rounded-2xl border border-white/10 p-6 mb-6 text-left">
          {/* Order number */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
            <div>
              <p className="text-xs text-white/40 mb-1">Order Number</p>
              <p className="text-lg font-mono font-semibold text-white">{order.order_number}</p>
            </div>
            <button
              onClick={copyOrderNumber}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
              title="Copy order number"
            >
              <Copy size={18} />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 mb-4">
            <StatusBadge
              icon={<Package size={16} />}
              label={order.status}
              color="indigo"
            />
            <StatusBadge
              icon={<Truck size={16} />}
              label={order.fulfillment_status}
              color="purple"
            />
          </div>

          {/* Items summary */}
          <div className="mb-4">
            <p className="text-sm text-white/60 mb-2">{checkout.item_count} items ordered</p>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {checkout.line_items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <Package size={16} />
                    </div>
                  )}
                </div>
              ))}
              {checkout.line_items.length > 4 && (
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-xs flex-shrink-0">
                  +{checkout.line_items.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <span className="text-white/60">Total Paid</span>
            <span className="text-xl font-semibold text-white">{formatPrice(checkout.total.amount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all"
            >
              <Truck size={18} />
              <span>Track Order</span>
              <ExternalLink size={14} />
            </a>
          )}

          <a
            href={order.permalink_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
          >
            <Package size={18} />
            <span>View Order Details</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={onNewOrder}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium transition-all"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-white/40 mt-6">
          A confirmation email has been sent to your email address.
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'indigo' | 'purple' | 'yellow';
}> = ({ icon, label, color }) => {
  const colors = {
    green: 'bg-green-500/20 text-green-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors[color]}`}>
      {icon}
      <span className="text-xs font-medium capitalize">{label.replace(/_/g, ' ')}</span>
    </div>
  );
};
