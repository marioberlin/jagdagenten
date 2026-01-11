import React, { useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { TRANSITIONS } from '@/styles/animations';

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
        const [isDragging, setIsDragging] = useState(false);
        const value = controlledValue !== undefined ? controlledValue : internalValue;
        const trackRef = useRef<HTMLDivElement>(null);

        const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

        const bind = useDrag(({ active, event, delta: [dx], movement: [_, my], memo }) => {
            if (disabled || !trackRef.current) return;
            event.stopPropagation();
            setIsDragging(active);

            if (active) {
                document.body.style.cursor = 'grabbing';
            } else {
                document.body.style.cursor = '';
                return;
            }

            // Initialize memo with current value
            if (memo === undefined) {
                return { val: value };
            }

            const rect = trackRef.current.getBoundingClientRect();
            const range = max - min;
            const unitsPerPixel = range / rect.width;

            // iOS-style fine scrubbing: 
            // Dragging vertically away from track reduces horizontal sensitivity
            const verticalDist = Math.abs(my);
            const threshold = 50; // px
            let factor = 1;

            if (verticalDist > threshold) {
                // Decaying factor for finer control
                factor = 1 / (1 + (verticalDist - threshold) * 0.02);
            }

            // Accumulate exact value change based on current sensitivity
            memo.val += (dx * unitsPerPixel * factor);

            // Output processed value
            const newValue = Math.round(memo.val / step) * step;
            const clampedValue = Math.min(Math.max(newValue, min), max);

            if (clampedValue !== value) {
                setInternalValue(clampedValue);
                onValueChange?.(clampedValue);
            }

            return memo;
        }, {
            filterTaps: true,
            bounds: { left: 0 }
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
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-primary/30 backdrop-blur-sm"
                        animate={{ width: `${percentage}%` }}
                        transition={isDragging ? { type: "tween", ease: "linear", duration: 0 } : TRANSITIONS.springFast}
                    />
                </div>

                {/* Thumb */}
                <motion.div
                    {...(bind() as any)}
                    className="absolute w-6 h-6 -ml-3 top-1/2 -mt-3 cursor-grab active:cursor-grabbing z-10"
                    animate={{ left: `${percentage}%` }}
                    transition={isDragging ? { type: "tween", ease: "linear", duration: 0 } : TRANSITIONS.springFast}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ touchAction: 'none' }}
                >
                    <GlassContainer
                        material="thick"
                        enableLiquid={false}
                        className="w-full h-full rounded-full shadow-lg border border-[var(--glass-border)]"
                    />
                </motion.div>
            </div>
        );
    }
);

GlassSlider.displayName = 'GlassSlider';
