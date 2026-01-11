import React, { ButtonHTMLAttributes } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassTooltip } from '../overlays/GlassTooltip';
import { cn } from '@/utils/cn';
import { useHaptics } from '@/hooks/useHaptics';

import { GlassComponentProps } from '@/components/types';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<GlassComponentProps<HTMLButtonElement>, 'as' | 'children' | 'type' | 'onClick' | 'onKeyDown' | 'onKeyUp' | 'onPointerDown' | 'onPointerUp'> {
    /** 
     * Visual style variant.
     * - `primary`: Highly visible, thick glass with accent color.
     * - `secondary`: Standard glass button.
     * - `ghost`: Transparent background, useful for icon buttons.
     * - `glow`: Subtle outer glow effect.
     * - `outline`: Bordered with no background.
     * - `destructive`: Red/Danger styling.
     * @default 'primary'
     */
    variant?: 'primary' | 'secondary' | 'ghost' | 'glow' | 'outline' | 'destructive';

    /** Button size variant. @default 'md' */
    size?: 'sm' | 'md' | 'lg' | 'icon';

    /** Shows loading spinner and suppresses interaction. */
    loading?: boolean;

    /**
     * Change the underlying element to the child element
     * Useful for using GlassButton as a Link (e.g. <GlassButton asChild><Link ... /></GlassButton>)
     */
    asChild?: boolean;

    /** Content to appear before the children (e.g. left icon) */
    startContent?: React.ReactNode;
    /** Content to appear after the children (e.g. right icon) */
    endContent?: React.ReactNode;

    /** Optional tooltip content to wrap the button */
    tooltip?: React.ReactNode;
    /** Optional badge content to display */
    badge?: React.ReactNode;
    /** Badge styling variant */
    badgeVariant?: 'default' | 'destructive' | 'outline';
}

// Simple loading spinner component
const LoadingSpinner = () => (
    <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

/**
 * GlassButton
 * 
 * A versatile button component that implements the Glass design system.
 * Supports various variants, sizes, loading states, and polymorphic rendering
 * via `asChild` (e.g., for converting to a link).
 * 
 * @example
 * ```tsx
 * <GlassButton variant="primary" onClick={handleClick}>
 *   Click Me
 * </GlassButton>
 * ```
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, asChild, children, onClick, tooltip, badge, badgeVariant = 'default', ...props }, ref) => {
        const isDisabled = disabled || loading;
        const haptics = useHaptics();

        let material: 'thin' | 'regular' | 'thick' = 'regular';
        let bgStyles = '';

        switch (variant) {
            case 'primary':
                material = 'thick';
                bgStyles = 'bg-accent-muted text-label-glass-primary font-semibold hover:bg-accent-hover';
                break;
            case 'secondary':
                material = 'regular';
                bgStyles = 'text-label-glass-primary font-medium hover:bg-glass-surface-hover';
                break;
            case 'ghost':
                material = 'thin';
                bgStyles = 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface border-transparent shadow-none';
                break;
            case 'glow':
                material = 'thin';
                bgStyles = 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover border-[var(--glass-border)] shadow-[0_0_15px_rgba(255,255,255,0.05)]';
                break;
            case 'outline':
                material = 'thin';
                bgStyles = 'text-label-glass-primary border-[var(--glass-border)] hover:bg-glass-surface-hover';
                break;
            case 'destructive':
                material = 'regular';
                bgStyles = 'bg-destructive-muted text-destructive font-semibold hover:bg-destructive/30 border-destructive/30';
                break;
        }

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm h-8',
            md: 'px-5 py-2.5 text-base h-11',
            lg: 'px-8 py-3.5 text-lg h-14',
            icon: 'w-10 h-10 p-0 flex items-center justify-center',
        };

        // Focus ring colors based on variant
        const focusRing = variant === 'destructive'
            ? 'focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
            : 'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

        const buttonContent = (
            <GlassContainer
                as={asChild ? undefined : 'button'}
                asChild={asChild}
                ref={ref}
                material={material}
                interactive={!isDisabled}
                border={variant !== 'ghost'}
                enableLiquid={false}
                className={cn(
                    'inline-flex items-center justify-center transition-all leading-none relative',
                    // Focus visible ring for keyboard navigation
                    'outline-none',
                    focusRing,
                    bgStyles,
                    sizeStyles[size],
                    // Disabled/loading states
                    isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                    // Allow overflow for badges only on icon buttons
                    badge && size === 'icon' && 'overflow-visible',
                    // Enforce symmetry for badge buttons (Space Left == Space Middle == Space Right)
                    badge && size !== 'icon' && 'px-3',
                    className
                )}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                aria-busy={loading}
                onClick={(e) => {
                    // Trigger haptic for primary actions
                    if (variant === 'primary') {
                        haptics.impact();
                    }
                    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
                }}
                {...props}
            >

                {asChild ? (
                    children
                ) : (
                    <>
                        <span className={cn(
                            "flex items-center justify-center w-full h-full",
                            badge ? "gap-3" : "gap-2",
                            loading && "opacity-0"
                        )}>
                            {props.startContent && <span className="flex items-center justify-center">{props.startContent}</span>}
                            {children}
                            {props.endContent && <span className="flex items-center justify-center">{props.endContent}</span>}
                            {badge && size !== 'icon' && (
                                <span className={cn(
                                    "min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] px-1 font-bold border border-white/10",
                                    badgeVariant === 'destructive' && "bg-destructive text-white",
                                    badgeVariant === 'default' && "bg-accent text-white",
                                    badgeVariant === 'outline' && "bg-glass-surface backdrop-blur-md border-glass-border text-primary"
                                )}>
                                    {badge}
                                </span>
                            )}
                        </span>
                        {loading && (
                            <span className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner />
                            </span>
                        )}
                        {badge && size === 'icon' && (
                            <span className={cn(
                                "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] px-1 font-bold shadow-lg border border-white/10 z-10",
                                badgeVariant === 'destructive' && "bg-destructive text-white",
                                badgeVariant === 'default' && "bg-accent text-white",
                                badgeVariant === 'outline' && "bg-glass-surface backdrop-blur-md border-glass-border text-primary"
                            )}>
                                {badge}
                            </span>
                        )}
                    </>
                )}
            </GlassContainer >
        );

        if (tooltip) {
            return (
                <GlassTooltip content={tooltip}>
                    {buttonContent}
                </GlassTooltip>
            );
        }

        return buttonContent;
    }
);

GlassButton.displayName = "GlassButton";

