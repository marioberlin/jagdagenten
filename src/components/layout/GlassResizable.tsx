import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassResizableProps {
    direction?: 'horizontal' | 'vertical';
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    defaultSplit?: number;
}

export const GlassResizable = ({ direction = 'horizontal', children, className, defaultSplit = 50 }: GlassResizableProps) => {
    const [split, setSplit] = useState(defaultSplit);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let newSplit: number;

            if (direction === 'horizontal') {
                const x = e.clientX - rect.left;
                newSplit = (x / rect.width) * 100;
            } else {
                const y = e.clientY - rect.top;
                newSplit = (y / rect.height) * 100;
            }

            // Clamp between 10% and 90%
            newSplit = Math.min(Math.max(newSplit, 10), 90);
            setSplit(newSplit);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        // Set cursor style
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, direction]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex overflow-hidden relative rounded-2xl",
                direction === 'vertical' ? 'flex-col' : 'flex-row',
                className
            )}
        >
            {/* Panel 1 */}
            <div
                className="relative overflow-hidden"
                style={{
                    [direction === 'horizontal' ? 'width' : 'height']: `calc(${split}% - 8px)`,
                    flexShrink: 0
                }}
            >
                {children[0]}
            </div>

            {/* Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    "flex items-center justify-center flex-shrink-0 z-20 transition-colors",
                    isDragging ? "bg-white/40" : "bg-white/10 hover:bg-white/30",
                    direction === 'horizontal'
                        ? "w-4 cursor-col-resize"
                        : "h-4 cursor-row-resize"
                )}
            >
                <div className={cn(
                    "rounded-full bg-white/30 flex items-center justify-center",
                    direction === 'horizontal' ? "w-1 h-8" : "h-1 w-8"
                )}>
                    <GripVertical
                        size={12}
                        className={cn(
                            "opacity-60",
                            direction === 'vertical' && "rotate-90"
                        )}
                    />
                </div>
            </div>

            {/* Panel 2 */}
            <div
                className="relative overflow-hidden flex-1"
            >
                {children[1]}
            </div>
        </div>
    );
};

GlassResizable.displayName = 'GlassResizable';
