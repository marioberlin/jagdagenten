/**
 * Cart Sidebar
 * Sliding cart panel with item management
 */
import React, { useState } from 'react';
import { X, ShoppingCart, Minus, Plus, Trash2, Tag, ArrowRight, Package } from 'lucide-react';
import { Checkout, LineItem } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface CartSidebarProps {
  checkout: Checkout | null;
  isOpen: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onApplyDiscount: (code: string) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  checkout,
  isOpen,
  isLoading = false,
  onToggle,
  onRemoveItem,
  onUpdateQuantity,
  onApplyDiscount,
  onCheckout
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const { formatPrice } = useCurrency();

  const itemCount = checkout?.item_count || 0;

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      onApplyDiscount(discountCode.trim());
      setDiscountCode('');
    }
  };

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={onToggle}
        className={`fixed right-4 bottom-20 z-40 p-3 rounded-full shadow-lg transition-all ${
          isOpen ? 'bg-white/10' : 'bg-indigo-500 hover:bg-indigo-600'
        }`}
      >
        <ShoppingCart size={24} className="text-white" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-glass-elevated border-l border-white/10 transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Your Cart</h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">
                {itemCount} items
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          {/* Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {!checkout || checkout.line_items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package size={48} className="text-white/20 mb-4" />
                <p className="text-white/50 mb-2">Your cart is empty</p>
                <p className="text-sm text-white/30">Start shopping to add items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkout.line_items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={() => onRemoveItem(item.product_id)}
                    onUpdateQuantity={(qty) => onUpdateQuantity(item.product_id, qty)}
                    disabled={isLoading}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with totals */}
          {checkout && checkout.line_items.length > 0 && (
            <div className="border-t border-white/5 p-4 space-y-4">
              {/* Discount code input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Discount code"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyDiscount}
                  disabled={!discountCode.trim() || isLoading}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm disabled:opacity-50 transition-all"
                >
                  Apply
                </button>
              </div>

              {/* Applied discounts */}
              {checkout.discounts.length > 0 && (
                <div className="space-y-1">
                  {checkout.discounts.map((discount, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-green-400">{discount.code}</span>
                      <span className="text-green-400">-{formatPrice(discount.amount.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>{formatPrice(checkout.subtotal.amount)}</span>
                </div>
                {parseFloat(checkout.discount_total.amount) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{formatPrice(checkout.discount_total.amount)}</span>
                  </div>
                )}
                {checkout.shipping && (
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>
                      {parseFloat(checkout.shipping_total.amount) === 0
                        ? 'Free'
                        : formatPrice(checkout.shipping_total.amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span>Tax</span>
                  <span>{formatPrice(checkout.tax_total.amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/5">
                  <span>Total</span>
                  <span>{formatPrice(checkout.total.amount)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={onCheckout}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-50 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

interface CartItemProps {
  item: LineItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  disabled?: boolean;
  formatPrice: (amount: number | string) => string;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity, disabled, formatPrice }) => (
  <div className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
    {/* Image */}
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/20">
          <Package size={24} />
        </div>
      )}
    </div>

    {/* Details */}
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
      {item.attributes && Object.keys(item.attributes).length > 0 && (
        <p className="text-xs text-white/40 truncate">
          {Object.values(item.attributes).join(', ')}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-medium text-white">
          {formatPrice(item.total_price.amount)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(Math.max(0, item.quantity - 1))}
            disabled={disabled}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-50 transition-all"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            disabled={disabled}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-50 transition-all"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 transition-all ml-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  </div>
);
