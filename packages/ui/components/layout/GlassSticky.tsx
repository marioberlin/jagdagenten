import { useRef, useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

export interface GlassStickyProps {
    /**
     * Top offset in pixels
     */
    offsetTop?: number;

    /**
     * Bottom offset in pixels (if sticking to bottom)
     */
    offsetBottom?: number;

    /**
     * Z-index of the sticky element
     */
    zIndex?: number;

    /**
     * Content to stick
     */
    children: React.ReactNode;

    /**
     * Additional class names
     */
    className?: string;

    /**
     * Whether to show glass effect when sticky
     */
    activeClass?: string;

    /**
     * Container reference to stick within (optional)
     */
    containerRef?: React.RefObject<HTMLElement>;
}

export function GlassSticky({
    offsetTop = 0,
    offsetBottom,
    zIndex = 10,
    children,
    className,
    activeClass = "bg-glass-layer-2 backdrop-blur-md shadow-lg border-b border-glass-border",
    containerRef
}: GlassStickyProps) {
    const [isSticky, setIsSticky] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            // Simple check: if top is at the offset, it's sticky
            // Note: Position sticky makes this detailed check slightly complex
            // A common trick is to use an IntersectionObserver on a sentinel above it,
            // or just rely on CSS and styled state if needed.
            // For now, we'll assume CSS handling is primary and this state is for visual enhancements

            // Refined check: compare top with offsetTop + parent context
            const isStuck = rect.top <= offsetTop + 1; // +1 tolerance
            setIsSticky(isStuck);
        };

        const container = containerRef?.current || window;
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [offsetTop, containerRef]);

    const style: React.CSSProperties = {
        position: 'sticky',
        top: offsetTop,
        bottom: offsetBottom,
        zIndex,
    };

    return (
        <div
            ref={elementRef}
            style={style}
            className={cn(
                "transition-all duration-300",
                isSticky ? activeClass : "",
                className
            )}
        >
            {children}

            {/* Optional sentinel for better sticky detection if needed in future */}
        </div>
    );
}

GlassSticky.displayName = 'GlassSticky';
