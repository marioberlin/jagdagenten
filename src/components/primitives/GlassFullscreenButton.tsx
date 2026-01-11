import { forwardRef, RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { useFullscreen } from '@/hooks/useFullscreen';
import { cn } from '@/utils/cn';

interface GlassFullscreenButtonProps {
    /** Ref to the element that should go fullscreen */
    targetRef?: RefObject<HTMLElement>;
    /** Additional class names */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'icon';
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

/**
 * GlassFullscreenButton - A button that toggles fullscreen mode for a target element.
 * Per Apple HIG, supports content-heavy views like charts, media, and complex data displays.
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * 
 * return (
 *   <div ref={containerRef} className="relative">
 *     <GlassChart data={data} />
 *     <GlassFullscreenButton targetRef={containerRef} className="absolute top-2 right-2" />
 *   </div>
 * );
 * ```
 */
export const GlassFullscreenButton = forwardRef<HTMLButtonElement, GlassFullscreenButtonProps>(
    ({ targetRef, className, size = 'icon', variant = 'ghost' }, ref) => {
        const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen(targetRef);

        if (!isSupported) {
            return null;
        }

        return (
            <GlassButton
                ref={ref}
                size={size}
                variant={variant}
                onClick={toggleFullscreen}
                className={cn("transition-all", className)}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
                {isFullscreen ? (
                    <Minimize2 size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16} />
                ) : (
                    <Maximize2 size={size === 'lg' ? 20 : size === 'sm' ? 12 : 16} />
                )}
            </GlassButton>
        );
    }
);

GlassFullscreenButton.displayName = 'GlassFullscreenButton';
