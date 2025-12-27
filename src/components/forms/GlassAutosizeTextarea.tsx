import React, { useState } from 'react';
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassAutosizeTextareaProps extends TextareaAutosizeProps {
    /**
     * Whether the textarea has an error
     */
    error?: boolean;

    /**
     * Additional container class names
     */
    containerClassName?: string;
}

export const GlassAutosizeTextarea = React.forwardRef<HTMLTextAreaElement, GlassAutosizeTextareaProps>(
    ({ className, containerClassName, error, onFocus, onBlur, disabled, ...props }, ref) => {
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
                    // Focus state
                    isFocused && !error && 'bg-glass-surface-hover border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/30 ring-offset-1 ring-offset-transparent',
                    // Error state
                    error && 'border-red-500/60 bg-red-500/5',
                    error && isFocused && 'ring-2 ring-red-500/30 ring-offset-1 ring-offset-transparent shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                    // Default hover
                    !isFocused && !error && 'hover:bg-glass-surface',
                    // Disabled
                    disabled && 'opacity-50 cursor-not-allowed',
                    containerClassName
                )}
            >
                <TextareaAutosize
                    ref={ref}
                    disabled={disabled}
                    className={cn(
                        "flex-1 bg-transparent border-none outline-none font-medium resize-none min-h-[40px]",
                        "text-primary placeholder:text-secondary/50",
                        "disabled:cursor-not-allowed",
                        className
                    )}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </GlassContainer>
        );
    }
);

GlassAutosizeTextarea.displayName = "GlassAutosizeTextarea";
