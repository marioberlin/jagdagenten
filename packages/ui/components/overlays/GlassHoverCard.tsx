import React, { useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassHoverCardProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    width?: number;
    delay?: number;
    className?: string;
}

export const GlassHoverCard = ({ trigger, children, width = 300, delay = 200, className }: GlassHoverCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsOpen(true), delay);
    };

    const handleMouseLeave = () => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsOpen(false), delay);
    };

    return (
        <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Trigger */}
            <div className="cursor-pointer">{trigger}</div>

            {/* Content */}
            <div
                className={cn(
                    "absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none",
                    isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1"
                )}
                style={{ width }}
            >
                <GlassContainer material="thick" className={cn("p-4 rounded-xl shadow-2xl backdrop-blur-xl border border-[var(--glass-border)]", className)}>
                    {children}
                </GlassContainer>
            </div>
        </div>
    );
};
