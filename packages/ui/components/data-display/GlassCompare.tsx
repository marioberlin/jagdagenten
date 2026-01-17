import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassCompareProps {
    beforeDetails: React.ReactNode;
    afterDetails: React.ReactNode;
    beforeLabel?: string;
    afterLabel?: string;
    className?: string;
}

export const GlassCompare = ({
    beforeDetails,
    afterDetails,
    beforeLabel = 'Before',
    afterLabel = 'After',
    className
}: GlassCompareProps) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
        setSliderPosition(percent);
    }, []);

    const onMouseDown = () => setIsDragging(true);
    const onTouchStart = () => setIsDragging(true);

    useEffect(() => {
        const onMouseUp = () => setIsDragging(false);
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) handleMove(e.clientX);
        };
        const onTouchMove = (e: TouchEvent) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        };

        if (isDragging) {
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchend', onMouseUp);
            window.addEventListener('touchmove', onTouchMove);
        }

        return () => {
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [isDragging, handleMove]);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden select-none group h-full w-full rounded-2xl", className)}
        >
            {/* After Image (Background) */}
            <div className="absolute inset-0 w-full h-full">
                {afterDetails}
                {afterLabel && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 text-white/80 text-xs rounded backdrop-blur-sm z-10">
                        {afterLabel}
                    </div>
                )}
            </div>

            {/* Before Image (Foreground - Clipped) */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                {beforeDetails}
                {beforeLabel && (
                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 text-white/80 text-xs rounded backdrop-blur-sm z-10">
                        {beforeLabel}
                    </div>
                )}
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white z-20 transition-colors"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border-2 border-white/60 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                    <ChevronsLeftRight size={18} className="text-white" />
                </div>
            </div>
        </div>
    );
};

GlassCompare.displayName = 'GlassCompare';
