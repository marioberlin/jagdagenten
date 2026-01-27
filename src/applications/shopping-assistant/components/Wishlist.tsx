/**
 * Wishlist Component
 * Saves favorite products as artifacts for later purchase
 */
import React, { useState } from 'react';
import { Heart, Trash2, ShoppingCart, TrendingUp, TrendingDown, X, Share2, Bell } from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

// Wishlist item with price tracking
export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
  priceAtAdd: string;
  note?: string;
  priceAlertThreshold?: number;
  notifications: boolean;
}

interface WishlistProps {
  items: WishlistItem[];
  isOpen: boolean;
  onToggle: () => void;
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onSetPriceAlert: (productId: string, threshold: number | null) => void;
  onUpdateNote: (productId: string, note: string) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  items,
  isOpen,
  onToggle,
  onRemove,
  onAddToCart,
  onSetPriceAlert,
  onUpdateNote,
}) => {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [alertInput, setAlertInput] = useState<{ id: string; value: string } | null>(null);
  const { formatPrice, currencyInfo } = useCurrency();

  const handleSaveNote = (productId: string) => {
    onUpdateNote(productId, noteValue);
    setEditingNote(null);
    setNoteValue('');
  };

  const handleSetAlert = (productId: string) => {
    if (alertInput && alertInput.id === productId) {
      const threshold = parseFloat(alertInput.value);
      if (!isNaN(threshold) && threshold > 0) {
        onSetPriceAlert(productId, threshold);
      }
      setAlertInput(null);
    }
  };

  // Calculate price changes
  const getPriceChange = (item: WishlistItem): { change: number; direction: 'up' | 'down' | 'same' } => {
    const currentPrice = parseFloat(item.product.price.amount);
    const originalPrice = parseFloat(item.priceAtAdd);
    const change = currentPrice - originalPrice;
    const direction = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'same';
    return { change, direction };
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`fixed right-4 bottom-36 z-40 p-3 rounded-full shadow-lg transition-all ${
          isOpen ? 'bg-white/10' : 'bg-pink-500 hover:bg-pink-600'
        }`}
      >
        <Heart size={24} className={isOpen ? 'text-white' : 'text-white fill-white'} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-pink-500 text-xs flex items-center justify-center font-medium">
            {items.length}
          </span>
        )}
      </button>

      {/* Wishlist panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-glass-elevated border-l border-white/10 transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-pink-400 fill-pink-400" />
            <h2 className="text-lg font-semibold text-white">Wishlist</h2>
            {items.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-sm">
                {items.length} items
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Heart size={48} className="text-white/20 mb-4" />
                <p className="text-white/50 mb-2">Your wishlist is empty</p>
                <p className="text-sm text-white/30">Save items to track prices and buy later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const priceInfo = getPriceChange(item);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3"
                    >
                      {/* Product info */}
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          {item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <Heart size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-semibold text-white">
                              {formatPrice(item.product.price.amount)}
                            </span>
                            {priceInfo.direction !== 'same' && (
                              <span
                                className={`flex items-center gap-0.5 text-xs ${
                                  priceInfo.direction === 'down'
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {priceInfo.direction === 'down' ? (
                                  <TrendingDown size={12} />
                                ) : (
                                  <TrendingUp size={12} />
                                )}
                                {formatPrice(Math.abs(priceInfo.change).toFixed(2))}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            Added {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Note */}
                      {editingNote === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNote(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-pink-500 text-white text-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : item.note ? (
                        <p
                          className="text-xs text-white/60 italic cursor-pointer hover:text-white/80"
                          onClick={() => {
                            setEditingNote(item.id);
                            setNoteValue(item.note || '');
                          }}
                        >
                          "{item.note}"
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNote(item.id);
                            setNoteValue('');
                          }}
                          className="text-xs text-white/40 hover:text-white/60"
                        >
                          + Add note
                        </button>
                      )}

                      {/* Price alert */}
                      {alertInput?.id === item.id ? (
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-yellow-400" />
                          <span className="text-xs text-white/60">Alert when price drops to {currencyInfo?.symbol || '$'}</span>
                          <input
                            type="number"
                            value={alertInput.value}
                            onChange={(e) => setAlertInput({ id: item.id, value: e.target.value })}
                            className="w-20 px-2 py-1 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSetAlert(item.id)}
                            className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => setAlertInput(null)}
                            className="p-1 text-white/40 hover:text-white/60"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : item.priceAlertThreshold ? (
                        <div className="flex items-center gap-2 text-xs text-yellow-400">
                          <Bell size={14} />
                          <span>Alert at {formatPrice(item.priceAlertThreshold)}</span>
                          <button
                            onClick={() => onSetPriceAlert(item.id, null)}
                            className="text-white/40 hover:text-white/60"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAlertInput({ id: item.id, value: '' })}
                          className="flex items-center gap-1 text-xs text-white/40 hover:text-yellow-400"
                        >
                          <Bell size={12} />
                          <span>Set price alert</span>
                        </button>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => onAddToCart(item.product.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm transition-all"
                        >
                          <ShoppingCart size={14} />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
                          title="Share"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

export default Wishlist;
