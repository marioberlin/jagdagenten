import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { Minus, Plus } from 'lucide-react';

interface GlassNumberInputProps {
    value?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Show +/- buttons inline or as a stepper */
    variant?: 'inline' | 'stepper';
    /** Label for the input */
    label?: string;
    /** Suffix like "kg" or "$" */
    suffix?: string;
    /** Prefix like "$" or "€" */
    prefix?: string;
}

export const GlassNumberInput = forwardRef<HTMLDivElement, GlassNumberInputProps>(({
    value: controlledValue,
    defaultValue = 0,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    disabled = false,
    className,
    size = 'md',
    variant = 'inline',
    label,
    suffix,
    prefix,
}, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [inputValue, setInputValue] = useState(String(defaultValue));
    const inputRef = useRef<HTMLInputElement>(null);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Sync input display with value
    useEffect(() => {
        setInputValue(String(value));
    }, [value]);

    const clamp = (n: number) => Math.min(Math.max(n, min), max);

    const updateValue = (newValue: number) => {
        const clamped = clamp(newValue);
        setInternalValue(clamped);
        setInputValue(String(clamped));
        onChange?.(clamped);
    };

    const increment = () => {
        updateValue(value + step);
    };

    const decrement = () => {
        updateValue(value - step);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setInputValue(raw);

        // Allow empty, minus sign, or valid number patterns
        if (raw === '' || raw === '-' || raw === '.') {
            return;
        }

        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
            setInternalValue(clamp(parsed));
            onChange?.(clamp(parsed));
        }
    };

    const handleBlur = () => {
        // On blur, ensure value is valid
        const parsed = parseFloat(inputValue);
        if (isNaN(parsed)) {
            setInputValue(String(value));
        } else {
            const clamped = clamp(parsed);
            setInternalValue(clamped);
            setInputValue(String(clamped));
            onChange?.(clamped);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            increment();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            decrement();
        }
    };

    const sizeClasses = {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
    };

    const buttonSizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 20,
    };

    if (variant === 'stepper') {
        return (
            <div ref={ref} className={cn("flex flex-col gap-2", className)}>
                {label && (
                    <span className="text-sm font-medium text-secondary">{label}</span>
                )}
                <div className="flex items-center gap-3">
                    <GlassButton
                        variant="outline"
                        size="icon"
                        onClick={decrement}
                        disabled={disabled || value <= min}
                        className={buttonSizeClasses[size]}
                    >
                        <Minus size={iconSizes[size]} />
                    </GlassButton>

                    <div className="flex items-center gap-1">
                        {prefix && <span className="text-secondary">{prefix}</span>}
                        <GlassContainer
                            material="thin"
                            border
                            className={cn(
                                "min-w-[80px] px-4 flex items-center justify-center rounded-full",
                                sizeClasses[size]
                            )}
                        >
                            <div className="flex items-center justify-center w-full h-full">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="decimal"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    disabled={disabled}
                                    className={cn(
                                        "w-full bg-transparent text-center text-primary font-medium outline-none tabular-nums",
                                        disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                />
                            </div>
                        </GlassContainer>
                        {suffix && <span className="text-secondary">{suffix}</span>}
                    </div>

                    <GlassButton
                        variant="outline"
                        size="icon"
                        onClick={increment}
                        disabled={disabled || value >= max}
                        className={buttonSizeClasses[size]}
                    >
                        <Plus size={iconSizes[size]} />
                    </GlassButton>
                </div>
            </div>
        );
    }

    // Inline variant (buttons inside input)
    return (
        <div ref={ref} className={cn("flex flex-col gap-2", className)}>
            {label && (
                <span className="text-sm font-medium text-secondary">{label}</span>
            )}
            <GlassContainer
                material="thin"
                border
                className={cn(
                    "px-2",
                    sizeClasses[size],
                    disabled && "opacity-50"
                )}
            >
                <div className="flex items-center gap-1 w-full h-full">
                    <button
                        type="button"
                        onClick={decrement}
                        disabled={disabled || value <= min}
                        className={cn(
                            "flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-glass-surface-hover transition-colors",
                            buttonSizeClasses[size],
                            (disabled || value <= min) && "opacity-30 cursor-not-allowed"
                        )}
                    >
                        <Minus size={iconSizes[size]} />
                    </button>

                    <div className="flex-1 flex items-center justify-center gap-1">
                        {prefix && <span className="text-secondary text-sm">{prefix}</span>}
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            className={cn(
                                "w-16 bg-transparent text-center text-primary font-medium outline-none tabular-nums",
                                disabled && "cursor-not-allowed"
                            )}
                        />
                        {suffix && <span className="text-secondary text-sm">{suffix}</span>}
                    </div>

                    <button
                        type="button"
                        onClick={increment}
                        disabled={disabled || value >= max}
                        className={cn(
                            "flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-glass-surface-hover transition-colors",
                            buttonSizeClasses[size],
                            (disabled || value >= max) && "opacity-30 cursor-not-allowed"
                        )}
                    >
                        <Plus size={iconSizes[size]} />
                    </button>
                </div>
            </GlassContainer>
        </div>
    );
});

GlassNumberInput.displayName = 'GlassNumberInput';
