import React, { InputHTMLAttributes, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Icon to display on the left side */
    icon?: React.ReactNode;
    /** Whether the input has an error (from GlassFormGroup or manual) */
    error?: boolean;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, icon, error, onFocus, onBlur, disabled, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            onBlur?.(e);
        };

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
                    {icon && (
                        <span className={cn(
                            "flex items-center justify-center transition-colors",
                            error ? "text-destructive/70" : "text-secondary/50"
                        )}>
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={cn(
                            "flex-1 bg-transparent border-none outline-none font-medium h-full",
                            "text-primary placeholder:text-secondary/50",
                            "disabled:cursor-not-allowed"
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />
                </div>
            </GlassContainer>
        );
    }
);

GlassInput.displayName = "GlassInput";
