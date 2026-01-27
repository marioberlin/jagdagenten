/**
 * Product Recommendations Component
 *
 * Shows personalized product recommendations based on:
 * - Current product being viewed
 * - Items in cart
 * - Browse history
 */
import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Eye, ShoppingCart } from 'lucide-react';
import { Product, Money } from '@/services/a2a/CommerceService';

// ============================================================================
// Types
// ============================================================================

type RecommendationType = 'similar' | 'frequently-bought' | 'trending' | 'recently-viewed';

interface ProductRecommendationsProps {
  products: Product[];
  currentProduct?: Product;
  cartProductIds?: string[];
  type?: RecommendationType;
  title?: string;
  maxItems?: number;
  onViewProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  products,
  currentProduct,
  cartProductIds = [],
  type = 'similar',
  title,
  maxItems = 6,
  onViewProduct,
  onAddToCart,
  className = '',
}) => {
  // Filter and sort recommendations
  const recommendations = useMemo(() => {
    let filtered = products.filter((p) => {
      // Exclude current product
      if (currentProduct && p.id === currentProduct.id) return false;
      // Exclude items already in cart
      if (cartProductIds.includes(p.id)) return false;
      return true;
    });

    // Apply type-specific logic
    switch (type) {
      case 'similar':
        if (currentProduct) {
          // Prioritize same category, similar price
          filtered = filtered
            .map((p) => ({
              product: p,
              score: calculateSimilarityScore(p, currentProduct),
            }))
            .sort((a, b) => b.score - a.score)
            .map((item) => item.product);
        }
        break;
      case 'frequently-bought':
        // In a real app, this would use purchase correlation data
        filtered = filtered.sort((a, b) => b.review_count - a.review_count);
        break;
      case 'trending':
        // Sort by rating * review_count as a proxy for trending
        filtered = filtered.sort(
          (a, b) => b.rating * b.review_count - a.rating * a.review_count
        );
        break;
      case 'recently-viewed':
        // Would use view history in a real app
        break;
    }

    return filtered.slice(0, maxItems);
  }, [products, currentProduct, cartProductIds, type, maxItems]);

  if (recommendations.length === 0) {
    return null;
  }

  const defaultTitle = getDefaultTitle(type);
  const Icon = getTypeIcon(type);

  return (
    <section className={`space-y-4 ${className}`} aria-label={title || defaultTitle}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-medium text-white">
          <Icon size={18} className="text-indigo-400" aria-hidden="true" />
          {title || defaultTitle}
        </h3>
        {recommendations.length > 4 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/40">{recommendations.length} items</span>
          </div>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div className="relative group">
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x snap-mandatory">
          {recommendations.map((product) => (
            <RecommendationCard
              key={product.id}
              product={product}
              onView={() => onViewProduct(product.id)}
              onAddToCart={() => onAddToCart(product.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// Recommendation Card
// ============================================================================

interface RecommendationCardProps {
  product: Product;
  onView: () => void;
  onAddToCart: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  product,
  onView,
  onAddToCart,
}) => {
  const hasDiscount =
    product.compare_at_price &&
    parseFloat(product.compare_at_price.amount) > parseFloat(product.price.amount);

  return (
    <article
      className="flex-shrink-0 w-40 snap-start bg-white/5 rounded-xl border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all group/card"
      aria-label={product.name}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-white/5">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ShoppingCart size={32} aria-hidden="true" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium">
            Sale
          </div>
        )}

        {/* Quick actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            onClick={onView}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`View ${product.name}`}
          >
            <Eye size={14} aria-hidden="true" />
          </button>
          {product.inventory.in_stock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="p-1.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs text-white/80 font-medium truncate" title={product.name}>
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-semibold text-white">
            {formatMoney(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-white/40 line-through">
              {formatMoney(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

function calculateSimilarityScore(product: Product, reference: Product): number {
  let score = 0;

  // Same category
  if (product.category === reference.category) score += 50;

  // Same brand
  if (product.brand === reference.brand) score += 20;

  // Similar price (within 30%)
  const priceRatio =
    parseFloat(product.price.amount) / parseFloat(reference.price.amount);
  if (priceRatio >= 0.7 && priceRatio <= 1.3) score += 15;

  // Shared tags
  const sharedTags = product.tags.filter((t) => reference.tags.includes(t));
  score += sharedTags.length * 5;

  // Higher rating is a plus
  score += product.rating * 2;

  return score;
}

function getDefaultTitle(type: RecommendationType): string {
  switch (type) {
    case 'similar':
      return 'Similar Products';
    case 'frequently-bought':
      return 'Frequently Bought Together';
    case 'trending':
      return 'Trending Now';
    case 'recently-viewed':
      return 'Recently Viewed';
    default:
      return 'Recommended For You';
  }
}

function getTypeIcon(type: RecommendationType): React.FC<{ size: number; className?: string }> {
  switch (type) {
    case 'similar':
      return Sparkles;
    case 'frequently-bought':
      return ShoppingCart;
    case 'trending':
      return TrendingUp;
    case 'recently-viewed':
      return Eye;
    default:
      return Sparkles;
  }
}

function formatMoney(money: Money): string {
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(amount);
}

// ============================================================================
// Quick Recommendations Section
// ============================================================================

interface QuickRecommendationsProps {
  allProducts: Product[];
  currentProduct?: Product;
  cartProductIds?: string[];
  onViewProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  className?: string;
}

export const QuickRecommendations: React.FC<QuickRecommendationsProps> = ({
  allProducts,
  currentProduct,
  cartProductIds = [],
  onViewProduct,
  onAddToCart,
  className = '',
}) => {
  if (allProducts.length < 4) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {currentProduct && (
        <ProductRecommendations
          products={allProducts}
          currentProduct={currentProduct}
          cartProductIds={cartProductIds}
          type="similar"
          maxItems={4}
          onViewProduct={onViewProduct}
          onAddToCart={onAddToCart}
        />
      )}

      <ProductRecommendations
        products={allProducts}
        cartProductIds={cartProductIds}
        type="trending"
        title="Popular Right Now"
        maxItems={4}
        onViewProduct={onViewProduct}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default ProductRecommendations;
