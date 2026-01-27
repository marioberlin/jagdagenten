/**
 * Product Grid
 * Displays products in a responsive grid with Glass UI styling
 */
import React from 'react';
import { Star, ShoppingCart, Eye, Tag } from 'lucide-react';
import { Product } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onViewProduct: (productId: string) => void;
  onAddToCart: (productId: string, quantity?: number, variantId?: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onViewProduct,
  onAddToCart
}) => {
  const { formatPrice } = useCurrency();

  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-indigo-500/10 mb-4">
          <ShoppingCart size={32} className="text-indigo-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
        <p className="text-sm text-white/50 max-w-sm">
          Try searching for something else or browse our featured products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onView={() => onViewProduct(product.id)}
          onAddToCart={() => onAddToCart(product.id)}
          formatPrice={formatPrice}
        />
      ))}
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onView: () => void;
  onAddToCart: () => void;
  formatPrice: (amountUSD: number | string) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onView, onAddToCart, formatPrice }) => {
  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price.amount) > parseFloat(product.price.amount);
  const discountPercent = hasDiscount
    ? Math.round((1 - parseFloat(product.price.amount) / parseFloat(product.compare_at_price!.amount)) * 100)
    : 0;

  return (
    <article
      className="group relative bg-glass-elevated/50 rounded-xl border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all"
      aria-label={`${product.name}, ${formatPrice(product.price.amount)}`}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-white/5">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={`Product image of ${product.name}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20" aria-hidden="true">
            <ShoppingCart size={48} />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-medium" aria-label={`${discountPercent} percent off`}>
            -{discountPercent}%
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.inventory.in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center" role="status">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">Out of Stock</span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`View details for ${product.name}`}
          >
            <Eye size={18} aria-hidden="true" />
          </button>
          {product.inventory.in_stock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Brand & Category */}
        <div className="flex items-center gap-2 mb-1">
          {product.brand && (
            <span className="text-xs text-indigo-400">{product.brand}</span>
          )}
          <span className="text-xs text-white/30">{product.category}</span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-medium text-white truncate mb-1" title={product.name}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white/60">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-white/30">({product.review_count})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">
            {formatPrice(product.price.amount)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-white/40 line-through">
              {formatPrice(product.compare_at_price!.amount)}
            </span>
          )}
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 overflow-hidden">
            <Tag size={10} className="text-white/30 flex-shrink-0" />
            <span className="text-xs text-white/30 truncate">
              {product.tags.slice(0, 3).join(', ')}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

const ProductCardSkeleton: React.FC = () => (
  <div className="bg-glass-elevated/50 rounded-xl border border-white/5 overflow-hidden animate-pulse">
    <div className="aspect-square bg-white/5" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-white/10 rounded w-1/3" />
      <div className="h-4 bg-white/10 rounded w-2/3" />
      <div className="h-3 bg-white/10 rounded w-1/4" />
      <div className="h-5 bg-white/10 rounded w-1/3" />
    </div>
  </div>
);
