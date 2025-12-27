import React, { useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

export interface GlassSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    value?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number) => void;
    disabled?: boolean;
}

export const GlassSlider = React.forwardRef<HTMLDivElement, GlassSliderProps>(
    ({
        value: controlledValue,
        defaultValue = 0,
        min = 0,
        max = 100,
        step = 1,
        onValueChange,
        className,
        disabled,
        ...props
    }, ref) => {
        const [internalValue, setInternalValue] = useState(defaultValue);
        const value = controlledValue !== undefined ? controlledValue : internalValue;
        const trackRef = useRef<HTMLDivElement>(null);

        const percentage = ((value - min) / (max - min)) * 100;

        const bind = useDrag(({ xy: [x], active, event }) => {
            if (disabled || !trackRef.current) return;
            event.stopPropagation();

            if (active) {
                document.body.style.cursor = 'grabbing';
            } else {
                document.body.style.cursor = '';
            }

            const rect = trackRef.current.getBoundingClientRect();
            const relativeX = Math.min(Math.max(0, x - rect.left), rect.width);
            const newValue = Math.round(((relativeX / rect.width) * (max - min) + min) / step) * step;

            const clampedValue = Math.min(Math.max(newValue, min), max);

            if (clampedValue !== value) {
                setInternalValue(clampedValue);
                onValueChange?.(clampedValue);
            }
        }, {
            filterTaps: true,
            bounds: { left: 0 }
        });

        const { fillWidth } = useSpring({
            fillWidth: percentage,
            config: { tension: 280, friction: 30 }
        });

        return (
            <div
                ref={ref}
                className={cn("relative flex items-center w-full h-10 touch-none select-none", disabled && "opacity-50", className)}
                {...props}
            >
                {/* Track */}
                <div
                    ref={trackRef}
                    className="relative w-full h-2 rounded-full bg-glass-surface overflow-hidden"
                    onClick={(e) => {
                        if (disabled || !trackRef.current) return;
                        const rect = trackRef.current.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const newValue = Math.round(((x / rect.width) * (max - min) + min) / step) * step;
                        const clampedValue = Math.min(Math.max(newValue, min), max);
                        setInternalValue(clampedValue);
                        onValueChange?.(clampedValue);
                    }}
                >
                    {/* Active Fill */}
                    <animated.div
                        className="absolute top-0 left-0 h-full bg-primary/30 backdrop-blur-sm"
                        style={{ width: fillWidth.to(w => `${w}%`) }}
                    />
                </div>

                {/* Thumb */}
                <animated.div
                    {...bind()}
                    className="absolute w-6 h-6 -ml-3 top-1/2 -mt-3 cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-transform"
                    style={{
                        left: fillWidth.to(w => `${w}%`),
                        touchAction: 'none'
                    }}
                >
                    <GlassContainer
                        material="thick"
                        enableLiquid={false}
                        className="w-full h-full rounded-full shadow-lg border border-[var(--glass-border)]"
                    />
                </animated.div>
            </div>
        );
    }
);

GlassSlider.displayName = 'GlassSlider';
