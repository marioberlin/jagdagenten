/**
 * Product Detail Modal
 * Full product details with variant selection
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RefreshCw, MessageSquare, GitCompare, TrendingDown, ChevronDown, Layout } from 'lucide-react';
import { Product, ProductVariant } from '@/services/a2a/CommerceService';
import { ProductReviews, generateMockReviews, generateRatingDistribution } from './ProductReviews';
import { useCurrency } from '@/hooks/useCurrency';

// Board type for the dropdown
interface BoardOption {
  id: string;
  name: string;
  color: string;
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number, variantId?: string) => void;
  onAddToWishlist?: (product: Product) => void;
  onAddToComparison?: (product: Product) => void;
  onTrackPrice?: (product: Product) => void;
  onAddToBoard?: (product: Product, boardId: string) => void;
  boards?: BoardOption[];
  isInWishlist?: boolean;
  isInComparison?: boolean;
  isTracking?: boolean;
  isLoading?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddToWishlist,
  onAddToComparison,
  onTrackPrice,
  onAddToBoard,
  boards = [],
  isInWishlist = false,
  isInComparison = false,
  isTracking = false,
  isLoading = false
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boardDropdownRef.current && !boardDropdownRef.current.contains(event.target as Node)) {
        setIsBoardDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate mock reviews based on product
  const mockReviews = useMemo(
    () => generateMockReviews(product.id, product.review_count || 5),
    [product.id, product.review_count]
  );
  const ratingDistribution = useMemo(
    () => generateRatingDistribution(mockReviews),
    [mockReviews]
  );

  const currentPrice = selectedVariant?.price || product.price;
  const currentInventory = selectedVariant?.inventory || product.inventory;
  const images = selectedVariant?.images?.length ? selectedVariant.images : product.images;

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity, selectedVariant?.id);
  };

  const hasDiscount = product.compare_at_price &&
    parseFloat(product.compare_at_price.amount) > parseFloat(currentPrice.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-glass-elevated rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Image gallery */}
          <div className="md:w-1/2 p-6 flex flex-col">
            {/* Main image */}
            <div className="aspect-square bg-white/5 rounded-xl overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <ShoppingCart size={64} />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 overflow-y-auto custom-scrollbar">
            {/* Brand & Category */}
            <div className="flex items-center gap-2 mb-2">
              {product.brand && (
                <span className="text-sm text-indigo-400">{product.brand}</span>
              )}
              <span className="text-sm text-white/30">{product.category}</span>
            </div>

            {/* Name */}
            <h2 className="text-2xl font-semibold text-white mb-2">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                  />
                ))}
              </div>
              <span className="text-sm text-white/60">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-white/30">({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-white">
                {formatPrice(currentPrice.amount)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-white/40 line-through">
                    {formatPrice(product.compare_at_price!.amount)}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                    Save {formatPrice(
                      (parseFloat(product.compare_at_price!.amount) - parseFloat(currentPrice.amount)).toFixed(2)
                    )}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-white/70 mb-6">{product.description}</p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white/80 mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.inventory.in_stock}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : variant.inventory.in_stock
                          ? 'border-white/10 hover:border-white/30 text-white/70'
                          : 'border-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {variant.name}
                      {!variant.inventory.in_stock && ' (Out of stock)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/80 mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 transition-all"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center text-lg font-medium text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentInventory.quantity, quantity + 1))}
                  disabled={quantity >= currentInventory.quantity}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 transition-all"
                >
                  <Plus size={18} />
                </button>
                <span className="text-sm text-white/40">
                  {currentInventory.quantity} available
                </span>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!currentInventory.in_stock || isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ShoppingCart size={20} />
                {currentInventory.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                onClick={() => onAddToWishlist?.(product)}
                disabled={isInWishlist}
                title={isInWishlist ? 'In wishlist' : 'Add to wishlist'}
                className={`p-3 rounded-xl transition-all ${
                  isInWishlist
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-pink-400'
                }`}
              >
                <Heart size={20} className={isInWishlist ? 'fill-pink-400' : ''} />
              </button>
              <button
                onClick={() => onAddToComparison?.(product)}
                disabled={isInComparison}
                title={isInComparison ? 'In comparison' : 'Add to comparison (max 4)'}
                className={`p-3 rounded-xl transition-all ${
                  isInComparison
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-purple-400'
                }`}
              >
                <GitCompare size={20} />
              </button>
              <button
                onClick={() => onTrackPrice?.(product)}
                disabled={isTracking}
                title={isTracking ? 'Tracking price' : 'Track price changes'}
                className={`p-3 rounded-xl transition-all ${
                  isTracking
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-yellow-400'
                }`}
              >
                <TrendingDown size={20} />
              </button>
              {/* Add to Board dropdown */}
              {boards.length > 0 && onAddToBoard && (
                <div className="relative" ref={boardDropdownRef}>
                  <button
                    onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                    title="Add to board"
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-emerald-400 transition-all flex items-center gap-1"
                  >
                    <Layout size={20} />
                    <ChevronDown size={14} className={`transition-transform ${isBoardDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isBoardDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-glass-elevated border border-white/10 shadow-xl z-50">
                      <div className="px-3 py-1.5 text-xs text-white/40 uppercase tracking-wide">Add to board</div>
                      {boards.map((board) => (
                        <button
                          key={board.id}
                          onClick={() => {
                            onAddToBoard(product, board.id);
                            setIsBoardDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 transition-all"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: board.color }}
                          />
                          <span className="truncate">{board.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Truck size={18} className="text-green-400" />
                <span>Free shipping on orders over $80</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Shield size={18} className="text-blue-400" />
                <span>1-year warranty included</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <RefreshCw size={18} className="text-purple-400" />
                <span>30-day hassle-free returns</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-t border-white/5">
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'text-white border-indigo-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === 'reviews'
                      ? 'text-white border-indigo-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  <MessageSquare size={14} />
                  Reviews ({product.review_count || mockReviews.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="py-4">
                {activeTab === 'details' && (
                  <>
                    {/* Attributes */}
                    {Object.keys(product.attributes).length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(product.attributes).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <span className="text-white/40 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-white/70">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.keys(product.attributes).length === 0 && (
                      <p className="text-white/50 text-sm">No additional details available.</p>
                    )}
                  </>
                )}

                {activeTab === 'reviews' && (
                  <ProductReviews
                    reviews={mockReviews}
                    averageRating={product.rating}
                    totalReviews={product.review_count || mockReviews.length}
                    ratingDistribution={ratingDistribution}
                    onHelpful={(reviewId) => console.log('Marked helpful:', reviewId)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
