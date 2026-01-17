import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

export interface GlassCheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    children?: React.ReactNode;
}

export const GlassCheckbox = React.forwardRef<HTMLButtonElement, GlassCheckboxProps>(
    ({ checked = false, onCheckedChange, className, disabled, children, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = useState(checked);
        const isChecked = onCheckedChange ? checked : internalChecked;

        const toggle = () => {
            if (disabled) return;
            const newValue = !isChecked;
            setInternalChecked(newValue);
            onCheckedChange?.(newValue);
        };

        const checkbox = (
            <button
                ref={ref}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={toggle}
                className={cn(
                    "group relative w-5 h-5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent flex-shrink-0",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                {...props}
            >
                <GlassContainer
                    interactive
                    material={isChecked ? "thick" : "thin"}
                    enableLiquid={false}
                    className={cn(
                        "w-full h-full rounded-md transition-all duration-300",
                        isChecked ? "!bg-accent-muted border-accent/40 text-primary" : "hover:!bg-glass-surface-hover"
                    )}
                >
                    <div className="flex items-center justify-center w-full h-full">
                        <Check
                            size={12}
                            className={cn(
                                "transition-all duration-300",
                                isChecked ? "opacity-100 scale-100" : "opacity-0 scale-50"
                            )}
                        />
                    </div>
                </GlassContainer>
            </button>
        );

        if (children) {
            return (
                <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
                    {checkbox}
                    <span className="text-secondary group-hover:text-primary transition-colors">{children}</span>
                </label>
            );
        }

        return checkbox;
    }
);

GlassCheckbox.displayName = 'GlassCheckbox';
