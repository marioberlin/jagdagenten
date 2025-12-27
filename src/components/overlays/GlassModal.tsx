import React, { useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GlassContainer } from '../primitives/GlassContainer';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Optional aria-label for the modal */
    ariaLabel?: string;
    /** Optional aria-describedby for the modal content */
    ariaDescribedBy?: string;
}

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

    const animation = useSpring({
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'scale(1) translateZ(0)' : 'scale(0.95) translateZ(0)',
        config: { tension: 300, friction: 20 },
    });

    if (!isOpen && animation.opacity.get() === 0) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
            {/* Backdrop */}
            <animated.div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                style={{ opacity: animation.opacity }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <animated.div
                ref={focusTrapRef}
                style={animation}
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
            </animated.div>
        </div>,
        document.body
    );
};

GlassModal.displayName = 'GlassModal';
