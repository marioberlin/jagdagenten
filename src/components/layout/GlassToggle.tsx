import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Whether the toggle is pressed/active */
    pressed?: boolean;
    /** Callback when pressed state changes */
    onPressedChange?: (pressed: boolean) => void;
    /** Size variant */
    size?: 'sm' | 'default' | 'lg';
    /** Visual variant when pressed */
    variant?: 'default' | 'outline';
}

/**
 * GlassToggle - Single toggle button (on/off state)
 * 
 * Different from GlassSwitch in that it looks like a button that can be toggled.
 * Use for toolbar actions, formatting options, etc.
 * 
 * @example
 * ```tsx
 * <GlassToggle pressed={isBold} onPressedChange={setIsBold}>
 *   <Bold size={16} />
 * </GlassToggle>
 * ```
 */
export const GlassToggle = React.forwardRef<HTMLButtonElement, GlassToggleProps>(
    ({
        className,
        children,
        pressed = false,
        onPressedChange,
        size = 'default',
        variant = 'default',
        disabled,
        ...props
    }, ref) => {
        const sizeClasses = {
            sm: 'h-8 px-2.5 text-sm',
            default: 'h-10 px-3',
            lg: 'h-12 px-4 text-lg',
        };

        const handleClick = () => {
            if (!disabled) {
                onPressedChange?.(!pressed);
            }
        };

        return (
            <GlassContainer
                as="button"
                ref={ref}
                type="button"
                role="switch"
                aria-pressed={pressed}
                disabled={disabled}
                onClick={handleClick}
                material={pressed ? 'regular' : 'thin'}
                border={variant === 'outline' || pressed}
                interactive={!disabled}
                enableLiquid={false}
                className={cn(
                    'inline-flex font-medium transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    sizeClasses[size],
                    pressed
                        ? 'bg-accent-muted text-primary border-accent/30'
                        : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface',
                    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                    className
                )}
                {...props}
            >
                <div className="flex items-center justify-center w-full h-full gap-2">
                    {children}
                </div>
            </GlassContainer>
        );
    }
);

GlassToggle.displayName = 'GlassToggle';
