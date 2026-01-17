import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { TRANSITIONS } from '@/styles/animations';

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
    const focusTrapRef = useFocusTrap(open, () => onOpenChange(false));

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (!dismissible) return;

        // Dismiss if dragged down more than 100px or flicked down
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onOpenChange(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onOpenChange(false)}
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={focusTrapRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={TRANSITIONS.spring}
                        drag={dismissible ? "y" : false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0.05, bottom: 1 }}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "relative z-10 w-full max-w-lg",
                            // size is handled by style below to avoid arbitrary value issues
                        )}
                        style={{ height: size !== 'auto' ? sizeHeights[size] : 'auto' }}
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
                            style={{ height: '100%' }}
                        >
                            {/* Drag Handle */}
                            {showHandle && (
                                <div
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
                                "flex-1 overflow-y-auto custom-scrollbar",
                                !title && !description && !showHandle ? 'pt-6' : '',
                                "px-6 pb-6"
                            )}>
                                {children}
                            </div>
                        </GlassContainer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

GlassDrawer.displayName = 'GlassDrawer';
