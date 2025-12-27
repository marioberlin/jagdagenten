import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassTooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const GlassTooltip = ({ content, children, side = 'top', className }: GlassTooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const { opacity, transform } = useSpring({
        opacity: isVisible ? 1 : 0,
        transform: isVisible
            ? 'scale(1) translate3d(0,0,0)'
            : side === 'top' ? 'scale(0.9) translate3d(0, 5px, 0)'
                : side === 'bottom' ? 'scale(0.9) translate3d(0, -5px, 0)'
                    : side === 'left' ? 'scale(0.9) translate3d(5px, 0, 0)'
                        : 'scale(0.9) translate3d(-5px, 0, 0)',
        config: { tension: 300, friction: 20 },
    });

    // Positioning logic 
    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    };

    return (
        <div
            className="relative inline-block z-50"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <animated.div
                style={{ opacity, transform }}
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
            </animated.div>
        </div>
    );
};

GlassTooltip.displayName = 'GlassTooltip';
