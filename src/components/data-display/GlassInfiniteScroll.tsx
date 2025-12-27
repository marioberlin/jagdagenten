import { useEffect, useRef, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface GlassInfiniteScrollProps {
    /**
     * Callback when more data needs to be loaded
     */
    onLoadMore: () => Promise<void>;

    /**
     * Whether there is more data to load
     */
    hasMore: boolean;

    /**
     * Whether data is currently loading
     */
    isLoading?: boolean;

    /**
     * Custom loader component
     */
    loader?: React.ReactNode;

    /**
     * Message to show when end of list is reached
     */
    endMessage?: React.ReactNode;

    /**
     * Content to render
     */
    children: React.ReactNode;

    /**
     * Additional class names
     */
    className?: string;

    /**
     * Threshold in pixels to trigger load more
     */
    threshold?: number;
}

export function GlassInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading = false,
    loader,
    endMessage,
    children,
    className,
    threshold = 100
}: GlassInfiniteScrollProps) {
    const observerTarget = useRef<HTMLDivElement>(null);
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    const checkLoading = isLoading || isInternalLoading;

    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                const target = entries[0];
                if (target.isIntersecting && hasMore && !checkLoading) {
                    setIsInternalLoading(true);
                    try {
                        await onLoadMore();
                    } finally {
                        setIsInternalLoading(false);
                    }
                }
            },
            {
                root: null,
                rootMargin: `0px 0px ${threshold}px 0px`,
                threshold: 0.1,
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, checkLoading, onLoadMore, threshold]);

    return (
        <div className={cn("w-full relative", className)}>
            {children}

            {(hasMore || checkLoading) && (
                <div
                    ref={observerTarget}
                    className="w-full py-6 flex items-center justify-center min-h-[60px]"
                >
                    {checkLoading && (
                        loader || (
                            <GlassContainer
                                material="regular"
                                className="rounded-full p-2"
                            >
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </GlassContainer>
                        )
                    )}
                </div>
            )}

            {!hasMore && endMessage && (
                <div className="w-full py-8 text-center text-sm text-secondary">
                    {endMessage}
                </div>
            )}
        </div>
    );
}

GlassInfiniteScroll.displayName = 'GlassInfiniteScroll';
