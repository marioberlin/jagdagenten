import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';

export interface GlassSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export const GlassSwitch = React.forwardRef<HTMLButtonElement, GlassSwitchProps>(
    ({ checked = false, onCheckedChange, className, disabled, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = useState(checked);
        const isChecked = onCheckedChange ? checked : internalChecked;

        const toggle = () => {
            if (disabled) return;
            const newValue = !isChecked;
            setInternalChecked(newValue);
            onCheckedChange?.(newValue);
        };

        const { x } = useSpring({
            x: isChecked ? 20 : 0,
            config: { tension: 300, friction: 18 }
        });

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
                {...props}
            >
                {/* Track */}
                <GlassContainer
                    material="thin"
                    enableLiquid={false}
                    className={cn(
                        "absolute inset-0 rounded-full transition-colors duration-300",
                        isChecked ? "!bg-success-muted !border-success/30" : "!bg-glass-surface"
                    )}
                />

                {/* Thumb */}
                <animated.div style={{ x }} className="relative z-10">
                    <GlassContainer
                        material="thick"
                        enableLiquid={false}
                        className={cn(
                            "w-5 h-5 rounded-full shadow-md transition-colors duration-300",
                            isChecked ? "bg-primary" : "bg-secondary"
                        )}
                    />
                </animated.div>
            </button>
        );
    }
);

GlassSwitch.displayName = 'GlassSwitch';
