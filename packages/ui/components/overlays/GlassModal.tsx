import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { TRANSITIONS } from '@/styles/animations';

interface GlassModalProps {
    /** Whether the modal is visible */
    isOpen: boolean;
    /** Callback to close the modal (e.g., on backdrop click or Escape) */
    onClose: () => void;
    /** Modal title displayed in the header */
    title?: string;
    /** Modal body content */
    children: React.ReactNode;
    /** Accessibility label (if title is excluded) */
    ariaLabel?: string;
    /** Accessibility description (points to ID of description text) */
    ariaDescribedBy?: string;
}

/**
 * GlassModal
 * 
 * A dialog component that renders on top of other content.
 * Features:
 * - Focus trapping
 * - Body scroll locking
 * - Glassmorphism styling with backdrop blur
 * - Animated entrance/exit
 * 
 * @example
 * ```tsx
 * <GlassModal isOpen={isOpen} onClose={close} title="Confirm">
 *   <p>Are you sure?</p>
 *   <GlassButton onClick={confirm}>Yes</GlassButton>
 * </GlassModal>
 * ```
 */
export const GlassModal = ({
    isOpen,
    onClose,
    title,
    children,
    ariaLabel,
    ariaDescribedBy,
}: GlassModalProps) => {
    // Focus trap - handles Tab cycling, Escape key, and focus restoration
    const focusTrapRef = useFocusTrap(isOpen, onClose);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={focusTrapRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={TRANSITIONS.spring}
                        className="relative z-10 w-full max-w-lg"
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel || title}
                        aria-describedby={ariaDescribedBy}
                    >
                        <GlassContainer className="flex flex-col max-h-[90vh]" material="thick" border>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)]">
                                <h3 className="text-xl font-bold text-primary tracking-tight">{title || 'Modal'}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-glass-surface-hover text-primary/60 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
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

GlassModal.displayName = 'GlassModal';
