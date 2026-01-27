/**
 * Product Reviews Component
 *
 * Displays customer reviews with ratings, helpful votes, and review filtering.
 */
import React, { useState, useMemo } from 'react';
import { Star, ThumbsUp, User, Check, Filter } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified_purchase: boolean;
  helpful_count: number;
  images?: string[];
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: Record<number, number>;
  onHelpful?: (reviewId: string) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution = {},
  onHelpful,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>('helpful');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sort and filter reviews
  const processedReviews = useMemo(() => {
    let result = [...reviews];

    // Filter by rating
    if (filterRating !== null) {
      result = result.filter((r) => r.rating === filterRating);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'helpful':
        result.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      case 'rating_high':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        result.sort((a, b) => a.rating - b.rating);
        break;
    }

    return result;
  }, [reviews, sortBy, filterRating]);

  const displayedReviews = showAll ? processedReviews : processedReviews.slice(0, 3);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Overall Rating */}
        <div className="flex-shrink-0 text-center p-4 bg-white/5 rounded-xl">
          <div className="text-4xl font-bold text-white mb-1">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} size={18} />
          <div className="text-sm text-white/50 mt-1">{totalReviews} reviews</div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`w-full flex items-center gap-2 group transition-all ${
                  filterRating === rating ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1 w-16 text-sm text-white/70">
                  <span>{rating}</span>
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      filterRating === rating ? 'bg-yellow-400' : 'bg-yellow-400/70'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-xs text-white/50 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full"
            >
              {filterRating} stars only
              <span className="hover:bg-yellow-500/30 rounded-full p-0.5">×</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/40" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="helpful">Most Helpful</option>
            <option value="recent">Most Recent</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {filterRating
              ? `No ${filterRating}-star reviews yet`
              : 'No reviews yet. Be the first to review!'}
          </div>
        ) : (
          displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} onHelpful={onHelpful} />
          ))
        )}
      </div>

      {/* Show More/Less */}
      {processedReviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
        >
          {showAll ? 'Show Less' : `Show All ${processedReviews.length} Reviews`}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpful }) => {
  const [isHelpful, setIsHelpful] = useState(false);

  const handleHelpful = () => {
    if (!isHelpful) {
      setIsHelpful(true);
      onHelpful?.(review.id);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center">
            <User size={18} className="text-white/60" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{review.author}</span>
              {review.verified_purchase && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">
                  <Check size={10} />
                  Verified
                </span>
              )}
            </div>
            <div className="text-xs text-white/40">
              {formatDate(review.date)}
            </div>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>

      {/* Title & Content */}
      <div>
        {review.title && (
          <h4 className="font-medium text-white mb-1">{review.title}</h4>
        )}
        <p className="text-sm text-white/70 leading-relaxed">{review.content}</p>
      </div>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Review image ${i + 1}`}
              className="w-20 h-20 object-cover rounded-lg border border-white/10"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <button
          onClick={handleHelpful}
          disabled={isHelpful}
          className={`flex items-center gap-1.5 text-sm transition-all ${
            isHelpful
              ? 'text-indigo-400'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <ThumbsUp size={14} className={isHelpful ? 'fill-current' : ''} />
          <span>Helpful ({review.helpful_count + (isHelpful ? 1 : 0)})</span>
        </button>
      </div>
    </div>
  );
};

// Star Rating Display
interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 14,
  showNumber = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const partial = !filled && rating > star - 1;
          return (
            <div key={star} className="relative">
              <Star
                size={size}
                className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
              />
              {partial && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating - (star - 1)) * 100}%` }}
                >
                  <Star size={size} className="text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-white/60 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============================================================================
// Mock Data Generator (for demo)
// ============================================================================

export function generateMockReviews(productId: string, count: number = 5): Review[] {
  const authors = [
    'Alex M.', 'Sarah K.', 'Jordan T.', 'Chris P.', 'Morgan L.',
    'Taylor R.', 'Jamie S.', 'Casey D.', 'Quinn W.', 'Riley B.'
  ];

  const titles = [
    'Great product!', 'Exceeded expectations', 'Good value for money',
    'Perfect fit', 'Love it!', 'Highly recommend', 'Exactly as described',
    'Nice quality', 'Fast shipping too', 'Will buy again'
  ];

  const contents = [
    'This product is exactly what I was looking for. The quality is excellent and it arrived quickly.',
    'Very happy with this purchase. It looks even better in person than in the photos.',
    'Great value for the price. Would definitely recommend to others.',
    'The material is high quality and comfortable. Very satisfied with my purchase.',
    'Fits perfectly and looks great. Customer service was also very helpful.',
    'I was skeptical at first but this exceeded my expectations. Will be ordering more.',
    'Solid product, no complaints. Shipping was fast and packaging was good.',
    'Really impressed with the quality. It\'s clear a lot of thought went into the design.',
  ];

  // Use productId to seed random values consistently
  const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return Array.from({ length: count }, (_, i) => {
    const idx = (seed + i) % authors.length;
    const rating = 3 + Math.floor(((seed * (i + 1)) % 100) / 33); // 3-5 stars weighted
    const daysAgo = Math.floor(((seed * (i + 2)) % 100));

    return {
      id: `review-${productId}-${i}`,
      author: authors[(idx + i) % authors.length],
      rating: Math.min(5, rating),
      title: titles[(idx + i) % titles.length],
      content: contents[(idx + i) % contents.length],
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      verified_purchase: ((seed + i) % 3) !== 0,
      helpful_count: Math.floor(((seed * (i + 3)) % 50)),
    };
  });
}

export function generateRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });
  return distribution;
}

export default ProductReviews;
