import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface GlassDrawerProps {
    /** Whether the drawer is open */
    open: boolean;
    /** Callback when the drawer should close */
    onOpenChange: (open: boolean) => void;
    /** Drawer content */
    children: React.ReactNode;
    /** Optional title */
    title?: string;
    /** Optional description */
    description?: string;
    /** Height of the drawer ('auto', 'sm', 'md', 'lg', 'full') */
    size?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
    /** Whether to show the drag handle */
    showHandle?: boolean;
    /** Whether the drawer can be dismissed by dragging down */
    dismissible?: boolean;
    /** Snap points as percentages of viewport height */
    snapPoints?: number[];
}

const sizeHeights = {
    auto: 'auto',
    sm: '30vh',
    md: '50vh',
    lg: '75vh',
    full: '95vh',
};

/**
 * GlassDrawer - Mobile-friendly bottom sheet component
 * 
 * Features:
 * - Swipe to dismiss (optional)
 * - Snap points for different heights
 * - Focus trapping for accessibility
 * - Drag handle for touch interaction
 * - Smooth spring animations
 * 
 * @example
 * ```tsx
 * <GlassDrawer
 *   open={showDrawer}
 *   onOpenChange={setShowDrawer}
 *   title="Options"
 *   size="md"
 * >
 *   <div>Drawer content here</div>
 * </GlassDrawer>
 * ```
 */
export const GlassDrawer = ({
    open,
    onOpenChange,
    children,
    title,
    description,
    size = 'md',
    showHandle = true,
    dismissible = true,
}: GlassDrawerProps) => {
    const [shouldRender, setShouldRender] = useState(open);
    const focusTrapRef = useFocusTrap(open, () => onOpenChange(false));

    // Track drag offset
    const [dragY, setDragY] = useState(0);

    useEffect(() => {
        if (open) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    const backdropSpring = useSpring({
        opacity: open ? 1 : 0,
        onRest: () => {
            if (!open) setShouldRender(false);
        },
    });

    const drawerSpring = useSpring({
        transform: open
            ? `translateY(${dragY}px)`
            : 'translateY(100%)',
        config: config.stiff,
    });

    // Drag gesture for swipe-to-dismiss
    const bindDrag = useDrag(
        ({ movement: [, my], velocity: [, vy], direction: [, dy], active }) => {
            // Only allow dragging down
            if (my < 0) {
                setDragY(0);
                return;
            }

            if (active) {
                setDragY(my);
            } else {
                // Released - check if should dismiss
                const shouldDismiss = dismissible && (my > 100 || (vy > 0.5 && dy > 0));
                if (shouldDismiss) {
                    onOpenChange(false);
                }
                setDragY(0);
            }
        },
        {
            filterTaps: true,
            bounds: { top: 0 },
            rubberband: true,
        }
    );

    if (!shouldRender) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <animated.div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                style={{ opacity: backdropSpring.opacity }}
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Drawer */}
            <animated.div
                ref={focusTrapRef}
                style={drawerSpring}
                className={cn(
                    "relative z-10 w-full max-w-lg",
                    size !== 'auto' && `h-[${sizeHeights[size]}]`
                )}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <GlassContainer
                    material="thick"
                    border
                    className={cn(
                        "w-full flex flex-col rounded-t-3xl rounded-b-none overflow-hidden",
                        size === 'auto' ? 'max-h-[85vh]' : '',
                    )}
                    style={{ height: size !== 'auto' ? sizeHeights[size] : 'auto' }}
                >
                    {/* Drag Handle */}
                    {showHandle && (
                        <div
                            {...(dismissible ? bindDrag() : {})}
                            className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
                        >
                            <div className="w-12 h-1.5 rounded-full bg-secondary" />
                        </div>
                    )}

                    {/* Header */}
                    {(title || description) && (
                        <div className="flex items-start justify-between px-6 pb-4 border-b border-[var(--glass-border)]">
                            <div className="space-y-1">
                                {title && (
                                    <h2 className="text-lg font-bold text-primary">{title}</h2>
                                )}
                                {description && (
                                    <p className="text-sm text-secondary">{description}</p>
                                )}
                            </div>
                            <GlassButton
                                variant="ghost"
                                size="icon"
                                className="rounded-full w-8 h-8 !p-0 -mr-2 -mt-1"
                                onClick={() => onOpenChange(false)}
                                aria-label="Close drawer"
                            >
                                <X size={16} />
                            </GlassButton>
                        </div>
                    )}

                    {/* Content */}
                    <div className={cn(
                        "flex-1 overflow-y-auto",
                        !title && !description && !showHandle ? 'pt-6' : '',
                        "px-6 pb-6"
                    )}>
                        {children}
                    </div>
                </GlassContainer>
            </animated.div>
        </div>,
        document.body
    );
};

GlassDrawer.displayName = 'GlassDrawer';
