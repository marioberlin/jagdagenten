'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Search, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassSearchBarProps {
    /** Placeholder text */
    placeholder?: string;
    /** Custom icon (defaults to Search) */
    icon?: React.ReactNode;
    /** Show AI/sparkle indicator */
    aiEnabled?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Expandable pill style on focus */
    expandable?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Controlled value */
    value?: string;
    /** Default value for uncontrolled usage */
    defaultValue?: string;
    /** Change handler */
    onChange?: (value: string) => void;
    /** Search submit handler */
    onSearch?: (query: string) => void;
    /** Clear handler */
    onClear?: () => void;
    /** Additional class names */
    className?: string;
    /** Disable the input */
    disabled?: boolean;
}

export const GlassSearchBar = React.forwardRef<HTMLInputElement, GlassSearchBarProps>(
    (
        {
            placeholder = 'Search...',
            icon,
            aiEnabled = false,
            size = 'md',
            expandable = false,
            loading = false,
            value: controlledValue,
            defaultValue = '',
            onChange,
            onSearch,
            onClear,
            className,
            disabled = false,
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = useState(defaultValue);
        const [isFocused, setIsFocused] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);

        // Use controlled or uncontrolled value
        const value = controlledValue !== undefined ? controlledValue : internalValue;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }
            onChange?.(newValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && value.trim()) {
                onSearch?.(value.trim());
            }
            if (e.key === 'Escape') {
                handleClear();
                inputRef.current?.blur();
            }
        };

        const handleClear = () => {
            if (controlledValue === undefined) {
                setInternalValue('');
            }
            onClear?.();
            onChange?.('');
        };

        // Forward ref
        useEffect(() => {
            if (typeof ref === 'function') {
                ref(inputRef.current);
            } else if (ref) {
                ref.current = inputRef.current;
            }
        }, [ref]);

        const sizeClasses = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-11 px-4 text-base',
            lg: 'h-14 px-5 text-lg',
        };

        const iconSizes = {
            sm: 14,
            md: 18,
            lg: 22,
        };

        const SearchIcon = icon || <Search size={iconSizes[size]} />;

        return (
            <GlassContainer
                material="thin"
                border={true}
                enableLiquid={false}
                className={cn(
                    'transition-all duration-300 ease-out',
                    sizeClasses[size],
                    // Expandable behavior
                    expandable && !isFocused && 'w-48',
                    expandable && isFocused && 'w-full max-w-md',
                    // Focus state
                    isFocused && 'bg-glass-surface-hover border-accent/50 shadow-[0_0_20px_var(--color-accent-muted)] ring-2 ring-accent/20',
                    // Default hover
                    !isFocused && 'hover:bg-glass-surface',
                    // Disabled state
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                <div className="flex items-center gap-3 w-full h-full">
                    {/* Search/AI Icon */}
                    <span
                        className={cn(
                            'flex items-center justify-center shrink-0 transition-colors duration-200',
                            isFocused ? 'text-accent' : 'text-secondary/50'
                        )}
                    >
                        {loading ? (
                            <Loader2 size={iconSizes[size]} className="animate-spin" />
                        ) : aiEnabled ? (
                            <Sparkles size={iconSizes[size]} className={cn(isFocused && 'text-purple-400')} />
                        ) : (
                            SearchIcon
                        )}
                    </span>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        className={cn(
                            'flex-1 bg-transparent border-none outline-none font-medium h-full min-w-0',
                            'text-primary placeholder:text-secondary/50',
                            'disabled:cursor-not-allowed'
                        )}
                    />

                    {/* Clear button */}
                    {value && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className={cn(
                                'flex items-center justify-center shrink-0 rounded-full p-1',
                                'text-secondary/50 hover:text-primary hover:bg-white/10',
                                'transition-all duration-200'
                            )}
                            aria-label="Clear search"
                        >
                            <X size={iconSizes[size] - 2} />
                        </button>
                    )}
                </div>
            </GlassContainer>
        );
    }
);

GlassSearchBar.displayName = 'GlassSearchBar';
