import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

interface GlassTooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const GlassTooltip = ({ content, children, side = 'top', className }: GlassTooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    // Initial/Exit offsets based on side
    const getOffset = () => {
        switch (side) {
            case 'top': return { y: 5 };
            case 'bottom': return { y: -5 };
            case 'left': return { x: 5 };
            case 'right': return { x: -5 };
        }
    };

    // Positioning logic 
    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    };

    return (
        <div
            className="relative inline-block z-50 group"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, ...getOffset() }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, ...getOffset() }}
                        transition={TRANSITIONS.springFast}
                        className={cn(
                            "absolute whitespace-nowrap z-50 pointer-events-none",
                            positionClasses[side],
                            side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
                            className
                        )}
                    >
                        <GlassContainer
                            material="regular"
                            className="px-3 py-1.5 text-xs text-primary rounded-lg shadow-xl"
                        >
                            {content}
                        </GlassContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

GlassTooltip.displayName = 'GlassTooltip';
