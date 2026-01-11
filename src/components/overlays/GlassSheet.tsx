import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { TRANSITIONS } from '@/styles/animations';

interface GlassSheetProps {
    /** Whether the sheet is open */
    open: boolean;
    /** Callback for open state changes */
    onOpenChange: (open: boolean) => void;
    /** Content to display inside the sheet */
    children: React.ReactNode;
    /** 
     * Edge to slide in from.
     * @default 'right'
     */
    side?: 'left' | 'right' | 'top' | 'bottom';
    /** Optional title header */
    title?: string;
    /** Optional description text */
    description?: string;
    /** Additional CSS classes */
    className?: string;
    /** Accessibility label */
    ariaLabel?: string;
}

/**
 * GlassSheet
 * 
 * A side panel overlay component (standard "Drawer" in some libraries).
 * Useful for mobile navigation, detailed property views, or settings panels.
 * 
 * @example
 * ```tsx
 * <GlassSheet open={open} onOpenChange={setOpen} side="right" title="Settings">
 *   <SettingsForm />
 * </GlassSheet>
 * ```
 */
export const GlassSheet = ({
    open,
    onOpenChange,
    children,
    side = 'right',
    title,
    description,
    className,
    ariaLabel,
}: GlassSheetProps) => {
    // Focus trap - handles Tab cycling, Escape key, and focus restoration
    const focusTrapRef = useFocusTrap(open, () => onOpenChange(false));

    // Lock body scroll when open
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

    // Animation variants based on side
    const variants = {
        initial: {
            x: side === 'right' ? '100%' : side === 'left' ? '-100%' : 0,
            y: side === 'bottom' ? '100%' : side === 'top' ? '-100%' : 0,
        },
        animate: { x: 0, y: 0 },
        exit: {
            x: side === 'right' ? '100%' : side === 'left' ? '-100%' : 0,
            y: side === 'bottom' ? '100%' : side === 'top' ? '-100%' : 0,
        }
    };

    const sideClasses = {
        right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l',
        left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r',
        bottom: 'inset-x-0 bottom-0 w-full border-t max-h-[90vh]',
        top: 'inset-x-0 top-0 w-full border-b max-h-[90vh]',
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center sm:items-center">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onOpenChange(false)}
                        aria-hidden="true"
                    />

                    {/* Sheet Content */}
                    <motion.div
                        ref={focusTrapRef}
                        className={cn(
                            "fixed z-50 bg-background/80 shadow-2xl p-0",
                            sideClasses[side],
                            className
                        )}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={variants}
                        transition={TRANSITIONS.spring}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel || title}
                    >
                        <GlassContainer
                            material="thick"
                            className="w-full h-full flex flex-col p-6 !rounded-none"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="space-y-1">
                                    {title && <h2 className="text-lg font-bold text-primary">{title}</h2>}
                                    {description && <p className="text-sm text-secondary">{description}</p>}
                                </div>
                                <GlassButton
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full w-8 h-8 !p-0"
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Close sheet"
                                >
                                    <X size={16} />
                                </GlassButton>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
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

GlassSheet.displayName = 'GlassSheet';
