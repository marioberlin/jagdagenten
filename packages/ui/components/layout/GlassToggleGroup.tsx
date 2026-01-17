import React, { createContext, useContext, useState } from 'react';

import { cn } from '@/utils/cn';

type ToggleGroupContextType = {
    value: string[];
    onChange: (value: string) => void;
    type: 'single' | 'multiple';
};

const ToggleGroupContext = createContext<ToggleGroupContextType | null>(null);

interface GlassToggleGroupProps {
    type?: 'single' | 'multiple';
    value?: string | string[];
    onValueChange?: (value: string | string[] | undefined) => void;
    children: React.ReactNode;
    className?: string;
}

export const GlassToggleGroup = ({
    type = 'single',
    value,
    onValueChange,
    children,
    className
}: GlassToggleGroupProps) => {
    const [internalValue, setInternalValue] = useState<string[]>(
        Array.isArray(value) ? value : value ? [value] : []
    );

    const handleChange = (itemValue: string) => {
        let newValue: string[];
        if (type === 'single') {
            newValue = internalValue.includes(itemValue) ? [] : [itemValue];
        } else {
            newValue = internalValue.includes(itemValue)
                ? internalValue.filter(v => v !== itemValue)
                : [...internalValue, itemValue];
        }
        setInternalValue(newValue);
        onValueChange?.(type === 'single' ? newValue[0] : newValue);
    };

    return (
        <ToggleGroupContext.Provider value={{ value: internalValue, onChange: handleChange, type }}>
            <div className={cn("flex gap-1 bg-[var(--glass-surface)] p-1 rounded-lg backdrop-blur-md inline-flex", className)}>
                {children}
            </div>
        </ToggleGroupContext.Provider>
    );
};

export const GlassToggleGroupItem = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
    const context = useContext(ToggleGroupContext);
    if (!context) throw new Error("ToggleGroupItem must be used within GlassToggleGroup");

    const isSelected = context.value.includes(value);

    return (
        <button
            onClick={() => context.onChange(value)}
            className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                isSelected
                    ? "bg-[var(--glass-surface-active)] text-primary shadow-sm"
                    : "text-secondary hover:text-primary hover:bg-[var(--glass-surface-hover)]",
                className
            )}
        >
            {children}
        </button>
    );
};

GlassToggleGroup.displayName = 'GlassToggleGroup';
GlassToggleGroupItem.displayName = 'GlassToggleGroupItem';
