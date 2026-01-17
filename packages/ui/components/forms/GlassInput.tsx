import React, { InputHTMLAttributes, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

import { GlassComponentProps } from '@/components/types';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement>, Omit<GlassComponentProps<HTMLInputElement>, 'as' | 'children' | 'onChange' | 'onFocus' | 'onBlur' | 'onSelect' | 'type'> {
    /** Content to display on the left side (prefixed) - formerly `icon` */
    startContent?: React.ReactNode;
    /** Content to display on the right side (suffixed) */
    endContent?: React.ReactNode;
    /** Deprecated: use startContent instead */
    icon?: React.ReactNode;
    /** 
     * Whether the input has an error state.
     * Triggers destructive/red styling and glow.
     */
    error?: boolean;
}

/**
 * GlassInput
 * 
 * A styled input component with glassmorphism effects.
 * Supports standard HTML input props, prefix icons, and error states.
 * Automatically handles focus styles and number input spinners.
 * 
 * @example
 * ```tsx
 * <GlassInput 
 *   placeholder="Search..." 
 *   icon={<SearchIcon />} 
 *   onChange={handleChange}
 * />
 * ```
 */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, icon, startContent, endContent, error, onFocus, onBlur, disabled, type, value, onChange, min, max, step, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const isNumberInput = type === 'number';

        // Backward compatibility
        const prefix = startContent || icon;

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            onBlur?.(e);
        };

        // Number input spinner handlers
        const handleIncrement = useCallback(() => {
            if (disabled || !isNumberInput) return;

            const currentValue = Number(value) || 0;
            const stepValue = Number(step) || 1;
            const newValue = currentValue + stepValue;

            if (max !== undefined && newValue > Number(max)) return;

            // Create synthetic event
            const syntheticEvent = {
                target: { value: String(newValue) }
            } as React.ChangeEvent<HTMLInputElement>;

            onChange?.(syntheticEvent);
        }, [value, step, max, disabled, onChange, isNumberInput]);

        const handleDecrement = useCallback(() => {
            if (disabled || !isNumberInput) return;

            const currentValue = Number(value) || 0;
            const stepValue = Number(step) || 1;
            const newValue = currentValue - stepValue;

            if (min !== undefined && newValue < Number(min)) return;

            // Create synthetic event
            const syntheticEvent = {
                target: { value: String(newValue) }
            } as React.ChangeEvent<HTMLInputElement>;

            onChange?.(syntheticEvent);
        }, [value, step, min, disabled, onChange, isNumberInput]);

        const canIncrement = disabled || (max !== undefined && Number(value) >= Number(max));
        const canDecrement = disabled || (min !== undefined && Number(value) <= Number(min));

        return (
            <GlassContainer
                material="thin"
                border={true}
                enableLiquid={false}
                className={cn(
                    'px-4 h-11 transition-all duration-300',
                    // Focus state - enhanced visibility with ring
                    isFocused && !error && 'bg-glass-surface-hover border-accent/50 shadow-[0_0_15px_var(--color-accent-muted)] ring-2 ring-accent/30 ring-offset-1 ring-offset-transparent',
                    // Error state
                    error && 'border-destructive/60 bg-destructive-muted',
                    error && isFocused && 'ring-2 ring-destructive/30 ring-offset-1 ring-offset-transparent shadow-[0_0_15px_var(--color-destructive-muted)]',
                    // Default hover (only when not focused or errored)
                    !isFocused && !error && 'hover:bg-glass-surface',
                    // Disabled state
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                <div className="flex items-center gap-3 w-full h-full">
                    {prefix && (
                        <span className={cn(
                            "flex items-center justify-center transition-colors",
                            error ? "text-destructive/70" : "text-secondary/50"
                        )}>
                            {prefix}
                        </span>
                    )}
                    <input
                        ref={ref}
                        type={type}
                        disabled={disabled}
                        value={value}
                        onChange={onChange}
                        min={min}
                        max={max}
                        step={step}
                        className={cn(
                            "flex-1 bg-transparent border-none outline-none font-medium h-full",
                            "text-primary placeholder:text-secondary/50",
                            "disabled:cursor-not-allowed",
                            // Hide default browser spinners for number inputs
                            isNumberInput && [
                                "[appearance:textfield]",
                                "[&::-webkit-outer-spin-button]:appearance-none",
                                "[&::-webkit-inner-spin-button]:appearance-none"
                            ]
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />

                    {/* Custom Glass Spinners for number inputs */}
                    {isNumberInput ? (
                        <div className="flex flex-col gap-0.5 -mr-1">
                            <button
                                type="button"
                                onClick={handleIncrement}
                                disabled={canIncrement}
                                tabIndex={-1}
                                className={cn(
                                    "group p-0.5 rounded transition-all duration-200",
                                    "hover:bg-white/10 active:bg-white/20",
                                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50"
                                )}
                                aria-label="Increment value"
                            >
                                <ChevronUp className={cn(
                                    "w-3.5 h-3.5 transition-colors",
                                    error ? "text-destructive/70" : "text-secondary/70",
                                    "group-hover:text-primary group-disabled:group-hover:text-secondary/70"
                                )} />
                            </button>
                            <button
                                type="button"
                                onClick={handleDecrement}
                                disabled={canDecrement}
                                tabIndex={-1}
                                className={cn(
                                    "group p-0.5 rounded transition-all duration-200",
                                    "hover:bg-white/10 active:bg-white/20",
                                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50"
                                )}
                                aria-label="Decrement value"
                            >
                                <ChevronDown className={cn(
                                    "w-3.5 h-3.5 transition-colors",
                                    error ? "text-destructive/70" : "text-secondary/70",
                                    "group-hover:text-primary group-disabled:group-hover:text-secondary/70"
                                )} />
                            </button>
                        </div>
                    ) : (
                        endContent && (
                            <span className={cn(
                                "flex items-center justify-center transition-colors",
                                error ? "text-destructive/70" : "text-secondary/50"
                            )}>
                                {endContent}
                            </span>
                        )
                    )}
                </div>
            </GlassContainer>
        );
    }
);

GlassInput.displayName = "GlassInput";
