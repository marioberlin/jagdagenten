import React, { TextareaHTMLAttributes, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Whether the textarea has an error (from GlassFormGroup or manual) */
    error?: boolean;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
    ({ className, error, onFocus, onBlur, disabled, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setIsFocused(false);
            onBlur?.(e);
        };

        return (
            <GlassContainer
                material="thin"
                border={true}
                enableLiquid={false}
                className={cn(
                    'flex flex-col px-4 py-3 transition-all duration-300',
                    // Focus state - enhanced visibility with ring
                    isFocused && !error && 'bg-glass-surface-hover border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/30 ring-offset-1 ring-offset-transparent',
                    // Error state
                    error && 'border-red-500/60 bg-red-500/5',
                    error && isFocused && 'ring-2 ring-red-500/30 ring-offset-1 ring-offset-transparent shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                    // Default hover (only when not focused or errored)
                    !isFocused && !error && 'hover:bg-glass-surface',
                    // Disabled state
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                <textarea
                    ref={ref}
                    disabled={disabled}
                    className={cn(
                        "flex-1 bg-transparent border-none outline-none font-medium resize-none min-h-[80px]",
                        "text-primary placeholder:text-secondary/50",
                        "disabled:cursor-not-allowed"
                    )}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </GlassContainer>
        );
    }
);

GlassTextarea.displayName = "GlassTextarea";

