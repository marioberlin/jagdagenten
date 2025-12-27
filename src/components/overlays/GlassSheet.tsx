import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpring, animated } from '@react-spring/web';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface GlassSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    side?: 'left' | 'right' | 'top' | 'bottom';
    title?: string;
    description?: string;
    className?: string;
    /** Optional aria-label for the sheet */
    ariaLabel?: string;
}

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
    const [shouldRender, setShouldRender] = useState(open);

    // Focus trap - handles Tab cycling, Escape key, and focus restoration
    const focusTrapRef = useFocusTrap(open, () => onOpenChange(false));

    useEffect(() => {
        if (open) setShouldRender(true);
    }, [open]);

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

    const backdropSpring = useSpring({
        opacity: open ? 1 : 0,
        backdropFilter: open ? 'blur(4px)' : 'blur(0px)',
        onRest: () => {
            if (!open) setShouldRender(false);
        }
    });

    const sheetSpring = useSpring({
        transform: open
            ? 'translate3d(0%, 0%, 0)'
            : side === 'right' ? 'translate3d(100%, 0, 0)'
                : side === 'left' ? 'translate3d(-100%, 0, 0)'
                    : side === 'bottom' ? 'translate3d(0, 100%, 0)'
                        : 'translate3d(0, -100%, 0)',
        config: { tension: 350, friction: 35 } // Snappy but smooth
    });

    if (!shouldRender) return null;

    const sideClasses = {
        right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l',
        left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r',
        bottom: 'inset-x-0 bottom-0 w-full border-t',
        top: 'inset-x-0 top-0 w-full border-b',
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center sm:items-center">
            {/* Backdrop */}
            <animated.div
                className="fixed inset-0 bg-black/20 dark:bg-black/40"
                style={backdropSpring}
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Sheet Content */}
            <animated.div
                ref={focusTrapRef}
                className={cn(
                    "fixed z-50 bg-background/80 shadow-2xl p-0",
                    sideClasses[side],
                    className
                )}
                style={sheetSpring}
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

                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                </GlassContainer>
            </animated.div>
        </div>,
        document.body
    );
};

GlassSheet.displayName = 'GlassSheet';
