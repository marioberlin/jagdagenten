import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassRadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    name?: string;
    value?: string;
    children?: React.ReactNode;
}

export const GlassRadio = React.forwardRef<HTMLButtonElement, GlassRadioProps>(
    ({ checked = false, onCheckedChange, className, disabled, children, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = useState(checked);
        const isChecked = onCheckedChange ? checked : internalChecked;

        const toggle = () => {
            if (disabled) return;
            if (!isChecked) {
                setInternalChecked(true);
                onCheckedChange?.(true);
            }
        };

        const radio = (
            <button
                ref={ref}
                type="button"
                role="radio"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={toggle}
                className={cn(
                    "group relative w-5 h-5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent flex-shrink-0",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                {...props}
            >
                <GlassContainer
                    interactive
                    material="thin"
                    enableLiquid={false}
                    className={cn(
                        "w-full h-full rounded-full transition-all duration-300",
                        isChecked ? "border-accent/50" : "hover:bg-glass-surface-hover"
                    )}
                >
                    <div className="flex items-center justify-center w-full h-full">
                        <div
                            className={cn(
                                "w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-muted)] transition-all duration-300",
                                isChecked ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}
                        />
                    </div>
                </GlassContainer>
            </button>
        );

        if (children) {
            return (
                <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
                    {radio}
                    <span className="text-secondary group-hover:text-primary transition-colors">{children}</span>
                </label>
            );
        }

        return radio;
    }
);

GlassRadio.displayName = 'GlassRadio';
