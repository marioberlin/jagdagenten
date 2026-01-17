'use client';

import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { GlassBadge } from './GlassBadge';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassProductCardProps {
    /** Product image URL */
    image: string;
    /** Product title */
    title: string;
    /** Product price (formatted string) */
    price: string;
    /** Original price for sale items */
    originalPrice?: string;
    /** Product description */
    description?: string;
    /** Rating (0-5) */
    rating?: number;
    /** Number of reviews */
    reviewCount?: number;
    /** Badge text (e.g., "Sale", "New", "Limited") */
    badge?: string;
    /** Badge variant */
    badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'glass';
    /** Add to cart handler */
    onAddToCart?: () => void;
    /** Wishlist handler */
    onWishlist?: () => void;
    /** Card click handler */
    onClick?: () => void;
    /** Is item in wishlist */
    inWishlist?: boolean;
    /** Additional class names */
    className?: string;
    /** Aspect ratio for image */
    aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export const GlassProductCard: React.FC<GlassProductCardProps> = ({
    image,
    title,
    price,
    originalPrice,
    description,
    rating,
    reviewCount,
    badge,
    badgeVariant = 'default',
    onAddToCart,
    onWishlist,
    onClick,
    inWishlist = false,
    className,
    aspectRatio = 'square',
}) => {
    const aspectRatioClasses = {
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
        landscape: 'aspect-[4/3]',
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={cn(
                            star <= Math.floor(rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : star <= rating
                                    ? 'text-yellow-400 fill-yellow-400/50'
                                    : 'text-secondary/30'
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <GlassContainer
            material="regular"
            enableLiquid={false}
            interactive={!!onClick}
            onClick={onClick}
            className={cn(
                'overflow-hidden flex flex-col group cursor-pointer',
                className
            )}
        >
            {/* Image container with overlay elements */}
            <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio])}>
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Glass overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badge */}
                {badge && (
                    <div className="absolute top-3 left-3">
                        <GlassBadge variant={badgeVariant}>{badge}</GlassBadge>
                    </div>
                )}

                {/* Wishlist button */}
                {onWishlist && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onWishlist();
                        }}
                        className={cn(
                            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center',
                            'bg-black/30 backdrop-blur-sm border border-white/10',
                            'transition-all duration-300 hover:scale-110',
                            inWishlist ? 'text-red-400' : 'text-white/70 hover:text-red-400'
                        )}
                        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart size={16} className={cn(inWishlist && 'fill-current')} />
                    </button>
                )}

                {/* Quick add button (appears on hover) */}
                {onAddToCart && (
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <GlassButton
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart();
                            }}
                        >
                            <ShoppingCart size={14} className="mr-2" />
                            Add to Cart
                        </GlassButton>
                    </div>
                )}
            </div>

            {/* Product info panel */}
            <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-primary line-clamp-1">{title}</h3>

                {description && (
                    <p className="text-sm text-secondary line-clamp-2">{description}</p>
                )}

                {/* Rating */}
                {rating !== undefined && (
                    <div className="flex items-center gap-2">
                        {renderStars(rating)}
                        {reviewCount !== undefined && (
                            <span className="text-xs text-secondary">({reviewCount})</span>
                        )}
                    </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold text-primary">{price}</span>
                    {originalPrice && (
                        <span className="text-sm text-secondary line-through">{originalPrice}</span>
                    )}
                </div>
            </div>
        </GlassContainer>
    );
};

GlassProductCard.displayName = 'GlassProductCard';
