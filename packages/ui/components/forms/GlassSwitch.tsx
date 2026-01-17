import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

import { GlassComponentProps } from '@/components/types';

export interface GlassSwitchProps extends Omit<GlassComponentProps, 'onChange'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export const GlassSwitch = React.forwardRef<HTMLButtonElement, GlassSwitchProps>(
    ({ checked = false, onCheckedChange, className, disabled, material = 'thin', enableLiquid = false, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = useState(checked);
        const isChecked = onCheckedChange ? checked : internalChecked;

        const toggle = () => {
            if (disabled) return;
            const newValue = !isChecked;
            setInternalChecked(newValue);
            onCheckedChange?.(newValue);
        };

        return (
            <button
                ref={ref}
                type="button"
                role="switch"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={toggle}
                className={cn(
                    "group relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 flex items-center px-1",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                {...props as any}
            >
                {/* Track */}
                <GlassContainer
                    material={material}
                    enableLiquid={enableLiquid}
                    className={cn(
                        "absolute inset-0 rounded-full transition-colors duration-300",
                        isChecked ? "!bg-success-muted !border-success/30" : "!bg-glass-surface"
                    )}
                />

                {/* Thumb */}
                <motion.div
                    className="relative z-10"
                    animate={{ x: isChecked ? 20 : 0 }}
                    transition={TRANSITIONS.spring}
                >
                    <GlassContainer
                        material="thick"
                        enableLiquid={false}
                        className={cn(
                            "w-5 h-5 rounded-full shadow-md transition-colors duration-300",
                            isChecked ? "bg-primary" : "bg-secondary"
                        )}
                    />
                </motion.div>
            </button>
        );
    }
);

GlassSwitch.displayName = 'GlassSwitch';
