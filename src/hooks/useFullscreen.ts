import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseFullscreenReturn {
    /** Whether the element is currently in fullscreen mode */
    isFullscreen: boolean;
    /** Enter fullscreen mode */
    enterFullscreen: () => Promise<void>;
    /** Exit fullscreen mode */
    exitFullscreen: () => Promise<void>;
    /** Toggle fullscreen mode */
    toggleFullscreen: () => Promise<void>;
    /** Whether fullscreen is supported in this browser */
    isSupported: boolean;
}

/**
 * Hook for managing fullscreen state per Apple HIG fullscreen guidelines.
 * Supports modern browsers including Safari with webkit prefix.
 * 
 * @param targetRef - Optional ref to the element to make fullscreen. Defaults to document.documentElement.
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen(containerRef);
 * 
 * return (
 *   <div ref={containerRef}>
 *     {isSupported && (
 *       <button onClick={toggleFullscreen}>
 *         {isFullscreen ? 'Exit' : 'Enter'} Fullscreen
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */
export const useFullscreen = (targetRef?: RefObject<HTMLElement>): UseFullscreenReturn => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Check if fullscreen API is supported
    const isSupported = typeof document !== 'undefined' && (
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
    );

    // Get the current fullscreen element (with vendor prefixes)
    const getFullscreenElement = useCallback((): Element | null => {
        return (
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement ||
            null
        );
    }, []);

    // Update state when fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!getFullscreenElement());
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [getFullscreenElement]);

    const enterFullscreen = useCallback(async () => {
        if (!isSupported) return;

        const element = targetRef?.current || document.documentElement;

        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
        }
    }, [isSupported, targetRef]);

    const exitFullscreen = useCallback(async () => {
        if (!isSupported || !getFullscreenElement()) return;

        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    }, [isSupported, getFullscreenElement]);

    const toggleFullscreen = useCallback(async () => {
        if (isFullscreen) {
            await exitFullscreen();
        } else {
            await enterFullscreen();
        }
    }, [isFullscreen, enterFullscreen, exitFullscreen]);

    return {
        isFullscreen,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
        isSupported,
    };
};
