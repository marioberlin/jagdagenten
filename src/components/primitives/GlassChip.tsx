import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassChipProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Chip content/label */
    children: React.ReactNode;
    /** Callback when the remove button is clicked */
    onRemove?: () => void;
    /** Whether the chip is selected */
    selected?: boolean;
    /** Callback when selection changes (for selectable chips) */
    onSelectedChange?: (selected: boolean) => void;
    /** Visual variant */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
    /** Size variant */
    size?: 'sm' | 'default' | 'lg';
    /** Optional icon to show before the label */
    icon?: React.ReactNode;
    /** Whether the chip is disabled */
    disabled?: boolean;
}

const variantStyles = {
    default: {
        base: 'bg-glass-surface border-[var(--glass-border)]',
        selected: 'bg-glass-surface-hover border-[var(--glass-border)]',
    },
    primary: {
        base: 'bg-accent-muted border-accent/30 text-accent',
        selected: 'bg-accent-hover border-accent/40',
    },
    success: {
        base: 'bg-success-muted border-success/30 text-success',
        selected: 'bg-success/20 border-success/40',
    },
    warning: {
        base: 'bg-warning-muted border-warning/30 text-warning',
        selected: 'bg-warning/20 border-warning/40',
    },
    destructive: {
        base: 'bg-destructive-muted border-destructive/30 text-destructive',
        selected: 'bg-destructive/20 border-destructive/40',
    },
};

/**
 * GlassChip - Closeable tag/chip for multi-select, filters, and tags
 * 
 * Features:
 * - Optional remove button
 * - Selectable state
 * - Multiple color variants
 * - Icon support
 * 
 * @example
 * ```tsx
 * // Closeable chip
 * <GlassChip onRemove={() => removeTag(tag)}>
 *   {tag.name}
 * </GlassChip>
 * 
 * // Selectable chip
 * <GlassChip 
 *   selected={isSelected}
 *   onSelectedChange={setIsSelected}
 *   variant="primary"
 * >
 *   React
 * </GlassChip>
 * ```
 */
export const GlassChip = React.forwardRef<HTMLDivElement, GlassChipProps>(
    ({
        className,
        children,
        onRemove,
        selected = false,
        onSelectedChange,
        variant = 'default',
        size = 'default',
        icon,
        disabled = false,
        onClick,
        ...props
    }, ref) => {
        const sizeClasses = {
            sm: 'h-6 px-2 text-xs',
            default: 'h-8 px-3 text-sm',
            lg: 'h-10 px-4 text-base',
        };

        const sizeGapClasses = {
            sm: 'gap-1',
            default: 'gap-1.5',
            lg: 'gap-2',
        };

        const iconSizes = {
            sm: 12,
            default: 14,
            lg: 16,
        };

        const isInteractive = !!onSelectedChange && !disabled;

        const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
            onClick?.(e);
            if (isInteractive) {
                onSelectedChange(!selected);
            }
        };

        const handleRemove = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!disabled) {
                onRemove?.();
            }
        };

        const styles = variantStyles[variant];

        return (
            <GlassContainer
                ref={ref}
                as={isInteractive ? 'button' : 'div'}
                role={isInteractive ? 'switch' : undefined}
                aria-pressed={isInteractive ? selected : undefined}
                material="thin"
                border
                interactive={isInteractive}
                enableLiquid={false}
                onClick={handleClick}
                className={cn(
                    'inline-flex rounded-full font-medium transition-all',
                    sizeClasses[size],
                    selected ? styles.selected : styles.base,
                    isInteractive && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
                {...props}
            >
                <div className={cn("flex items-center justify-center w-full h-full leading-none", sizeGapClasses[size])}>
                    {/* Icon */}
                    {icon && (
                        <span className="flex-shrink-0 flex items-center">
                            {icon}
                        </span>
                    )}

                    {/* Label */}
                    <span className="truncate pt-0.5">{children}</span>

                    {/* Remove Button */}
                    {onRemove && !disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className={cn(
                                "flex items-center justify-center flex-shrink-0 rounded-full p-0.5 transition-colors",
                                "hover:bg-glass-surface-hover text-current opacity-70 hover:opacity-100",
                                "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                            )}
                            aria-label="Remove"
                        >
                            <X size={iconSizes[size]} />
                        </button>
                    )}
                </div>
            </GlassContainer>
        );
    }
);

GlassChip.displayName = 'GlassChip';
