import React, { useState } from 'react';

import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';

interface GlassCollapsibleProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const GlassCollapsible = ({ trigger, children, defaultOpen = false, className }: GlassCollapsibleProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const style = useSpring({
        height: isOpen ? 'auto' : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        config: { tension: 300, friction: 30 }
    });

    return (
        <div className={cn("w-full", className)}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            <animated.div style={style}>
                <div className="pt-2">
                    {children}
                </div>
            </animated.div>
        </div>
    );
};

GlassCollapsible.displayName = 'GlassCollapsible';
