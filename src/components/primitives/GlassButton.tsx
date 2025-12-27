import React, { ButtonHTMLAttributes } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useHaptics } from '@/hooks/useHaptics';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'glow' | 'outline' | 'destructive';
    /** Size preset */
    size?: 'sm' | 'md' | 'lg' | 'icon';
    /** Shows loading spinner and disables button */
    loading?: boolean;
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

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, children, onClick, ...props }, ref) => {
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

        return (
            <GlassContainer
                as="button"
                ref={ref}
                material={material}
                interactive={!isDisabled}
                border={variant !== 'ghost'}
                enableLiquid={false}
                className={cn(
                    'inline-flex items-center justify-center transition-all leading-none',
                    // Focus visible ring for keyboard navigation
                    'outline-none',
                    focusRing,
                    bgStyles,
                    sizeStyles[size],
                    // Disabled/loading states
                    isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
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
                <span className={cn(
                    "flex items-center justify-center gap-2 w-full h-full",
                    loading && "opacity-0"
                )}>
                    {children}
                </span>
                {loading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner />
                    </span>
                )}
            </GlassContainer>
        );
    }
);

GlassButton.displayName = "GlassButton";

