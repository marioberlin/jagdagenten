/**
 * Comparison Board Component
 * Side-by-side product comparison feature
 */
import React, { useState } from 'react';
import { X, Check, Minus, Star, ShoppingCart, GitCompare } from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface ComparisonBoardProps {
  products: Product[];
  isOpen: boolean;
  onToggle: () => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onAddToCart: (productId: string) => void;
}

export const ComparisonBoard: React.FC<ComparisonBoardProps> = ({
  products,
  isOpen,
  onToggle,
  onRemove,
  onClear,
  onAddToCart,
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const { formatPrice } = useCurrency();

  // Get all unique attribute keys across products
  const allAttributes = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.attributes)))
  );

  // Check if an attribute value differs between products
  const valuesDiffer = (key: string): boolean => {
    if (products.length < 2) return false;
    const values = products.map((p) => p.attributes[key] || '-');
    return new Set(values).size > 1;
  };

  // Find the best value for comparison
  const getBestValue = (values: (string | number)[], type: 'price' | 'rating' | 'stock'): number => {
    if (type === 'price') {
      return values.indexOf(Math.min(...values.map(Number).filter((n) => !isNaN(n))));
    }
    if (type === 'rating' || type === 'stock') {
      return values.indexOf(Math.max(...values.map(Number).filter((n) => !isNaN(n))));
    }
    return -1;
  };

  if (!isOpen) {
    return products.length > 0 ? (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-52 z-40 p-3 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg transition-all"
      >
        <GitCompare size={24} className="text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-purple-500 text-xs flex items-center justify-center font-medium">
          {products.length}
        </span>
      </button>
    ) : null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onToggle}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-glass-elevated rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <GitCompare size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Compare Products</h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-sm">
              {products.length} products
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
                className="rounded"
              />
              Highlight differences
            </label>
            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all"
            >
              Clear All
            </button>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <GitCompare size={48} className="text-white/20 mb-4" />
              <p className="text-white/50 mb-2">No products to compare</p>
              <p className="text-sm text-white/30">Add products to compare them side by side</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-left text-sm font-medium text-white/40 w-40">Feature</th>
                  {products.map((product) => (
                    <th key={product.id} className="p-4 text-left min-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={() => onRemove(product.id)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Image & Name */}
                <tr className="border-b border-white/5">
                  <td className="p-4 text-sm text-white/60">Product</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex flex-col items-start gap-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <ShoppingCart size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-white/40">{product.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b border-white/5">
                  <td className="p-4 text-sm text-white/60">Price</td>
                  {products.map((product, idx) => {
                    const prices = products.map((p) => parseFloat(p.price.amount));
                    const isBest = idx === getBestValue(prices, 'price');
                    return (
                      <td key={product.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-semibold ${
                              highlightDifferences && isBest ? 'text-green-400' : 'text-white'
                            }`}
                          >
                            {formatPrice(product.price.amount)}
                          </span>
                          {highlightDifferences && isBest && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                              Best Price
                            </span>
                          )}
                        </div>
                        {product.compare_at_price && (
                          <span className="text-sm text-white/40 line-through">
                            {formatPrice(product.compare_at_price.amount)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Rating */}
                <tr className="border-b border-white/5">
                  <td className="p-4 text-sm text-white/60">Rating</td>
                  {products.map((product, idx) => {
                    const ratings = products.map((p) => p.rating);
                    const isBest = idx === getBestValue(ratings, 'rating');
                    return (
                      <td key={product.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.round(product.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-white/20'
                                }
                              />
                            ))}
                          </div>
                          <span
                            className={`text-sm ${
                              highlightDifferences && isBest ? 'text-green-400' : 'text-white/60'
                            }`}
                          >
                            {product.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-white/30">({product.review_count})</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Stock */}
                <tr className="border-b border-white/5">
                  <td className="p-4 text-sm text-white/60">Availability</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex items-center gap-2">
                        {product.inventory.in_stock ? (
                          <>
                            <Check size={14} className="text-green-400" />
                            <span className="text-sm text-green-400">In Stock</span>
                            <span className="text-xs text-white/30">
                              ({product.inventory.quantity} available)
                            </span>
                          </>
                        ) : (
                          <>
                            <X size={14} className="text-red-400" />
                            <span className="text-sm text-red-400">Out of Stock</span>
                          </>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b border-white/5">
                  <td className="p-4 text-sm text-white/60">Category</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4">
                      <span className="text-sm text-white">{product.category}</span>
                      {product.subcategory && (
                        <span className="text-sm text-white/40"> / {product.subcategory}</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Attributes */}
                {allAttributes.map((attr) => (
                  <tr key={attr} className="border-b border-white/5">
                    <td className="p-4 text-sm text-white/60 capitalize">
                      {attr.replace(/_/g, ' ')}
                    </td>
                    {products.map((product) => {
                      const differs = highlightDifferences && valuesDiffer(attr);
                      const value = product.attributes[attr];
                      return (
                        <td key={product.id} className="p-4">
                          <span
                            className={`text-sm ${
                              differs && value ? 'text-yellow-400' : 'text-white'
                            }`}
                          >
                            {value || <Minus size={14} className="text-white/20" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Add to Cart */}
                <tr>
                  <td className="p-4 text-sm text-white/60">Actions</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4">
                      <button
                        onClick={() => onAddToCart(product.id)}
                        disabled={!product.inventory.in_stock}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ShoppingCart size={14} />
                        <span>Add to Cart</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonBoard;
