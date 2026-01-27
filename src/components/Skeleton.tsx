/**
 * Skeleton Loading Components
 *
 * Placeholder UI elements shown during content loading.
 * Provides visual feedback and prevents layout shift.
 */
import React from 'react';

// ============================================================================
// Base Skeleton
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-white/10 ${roundedClasses[rounded]} ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

// ============================================================================
// Product Card Skeleton
// ============================================================================

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full aspect-square" rounded="none" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton height={20} width="80%" />

        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton height={24} width={60} />
          <Skeleton height={16} width={40} />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton height={14} width={80} />
          <Skeleton height={14} width={40} />
        </div>

        {/* Button */}
        <Skeleton height={36} className="w-full" rounded="lg" />
      </div>
    </div>
  );
};

// ============================================================================
// Product Grid Skeleton
// ============================================================================

interface ProductGridSkeletonProps {
  count?: number;
  columns?: number;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 8,
  columns = 4,
}) => {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

// ============================================================================
// Cart Item Skeleton
// ============================================================================

export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
      <Skeleton width={48} height={48} rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="40%" />
      </div>
      <Skeleton height={20} width={50} />
    </div>
  );
};

// ============================================================================
// Cart Sidebar Skeleton
// ============================================================================

export const CartSidebarSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height={24} width={100} />
        <Skeleton height={24} width={24} rounded="full" />
      </div>

      {/* Items */}
      <div className="space-y-3">
        <CartItemSkeleton />
        <CartItemSkeleton />
        <CartItemSkeleton />
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        <div className="flex justify-between">
          <Skeleton height={14} width={60} />
          <Skeleton height={14} width={50} />
        </div>
        <div className="flex justify-between">
          <Skeleton height={14} width={50} />
          <Skeleton height={14} width={50} />
        </div>
        <div className="flex justify-between">
          <Skeleton height={18} width={40} />
          <Skeleton height={18} width={60} />
        </div>
      </div>

      {/* Checkout Button */}
      <Skeleton height={44} className="w-full" rounded="lg" />
    </div>
  );
};

// ============================================================================
// Product Detail Skeleton
// ============================================================================

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      {/* Image Gallery */}
      <div className="space-y-3">
        <Skeleton className="w-full aspect-square" rounded="xl" />
        <div className="flex gap-2">
          <Skeleton width={60} height={60} rounded="lg" />
          <Skeleton width={60} height={60} rounded="lg" />
          <Skeleton width={60} height={60} rounded="lg" />
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        <Skeleton height={32} width="80%" />
        <Skeleton height={20} width="40%" />

        <div className="flex items-center gap-3">
          <Skeleton height={28} width={80} />
          <Skeleton height={20} width={60} />
        </div>

        <div className="space-y-2">
          <Skeleton height={16} className="w-full" />
          <Skeleton height={16} className="w-full" />
          <Skeleton height={16} width="70%" />
        </div>

        <div className="space-y-3 py-4">
          <Skeleton height={14} width={60} />
          <div className="flex gap-2">
            <Skeleton width={40} height={32} rounded="lg" />
            <Skeleton width={40} height={32} rounded="lg" />
            <Skeleton width={40} height={32} rounded="lg" />
            <Skeleton width={40} height={32} rounded="lg" />
          </div>
        </div>

        <div className="flex gap-3">
          <Skeleton height={48} className="flex-1" rounded="lg" />
          <Skeleton height={48} width={48} rounded="lg" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Order Summary Skeleton
// ============================================================================

export const OrderSummarySkeleton: React.FC = () => {
  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 p-6 space-y-4">
      <Skeleton height={24} width={120} />

      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton height={14} width={80} />
          <Skeleton height={14} width={60} />
        </div>
        <div className="flex justify-between">
          <Skeleton height={14} width={60} />
          <Skeleton height={14} width={50} />
        </div>
        <div className="flex justify-between">
          <Skeleton height={14} width={40} />
          <Skeleton height={14} width={50} />
        </div>
      </div>

      <div className="border-t border-white/5 pt-3">
        <div className="flex justify-between">
          <Skeleton height={20} width={50} />
          <Skeleton height={20} width={70} />
        </div>
      </div>

      <Skeleton height={48} className="w-full" rounded="lg" />
    </div>
  );
};

// ============================================================================
// Stats Card Skeleton
// ============================================================================

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={40} height={40} rounded="lg" />
        <Skeleton width={50} height={16} />
      </div>
      <div className="space-y-2">
        <Skeleton height={32} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
  );
};

// ============================================================================
// Table Row Skeleton
// ============================================================================

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 5,
}) => {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton height={14} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
};

// ============================================================================
// Chart Skeleton
// ============================================================================

export const ChartSkeleton: React.FC<{ height?: number }> = ({
  height = 200,
}) => {
  return (
    <div className="bg-glass-elevated rounded-xl border border-white/5 p-4">
      <Skeleton height={16} width={120} className="mb-4" />
      <Skeleton height={height} className="w-full" rounded="lg" />
    </div>
  );
};

// ============================================================================
// Text Block Skeleton
// ============================================================================

interface TextBlockSkeletonProps {
  lines?: number;
  lineHeight?: number;
}

export const TextBlockSkeleton: React.FC<TextBlockSkeletonProps> = ({
  lines = 3,
  lineHeight = 16,
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export default Skeleton;
