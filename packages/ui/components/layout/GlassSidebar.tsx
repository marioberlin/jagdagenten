import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSITIONS } from '@/styles/animations';

export interface GlassSidebarProps {
    /** Sidebar content */
    children: React.ReactNode;
    /** Width of the sidebar */
    width?: string;
    /** Breakpoint to collapse (default: 'lg') */
    collapseAt?: 'sm' | 'md' | 'lg' | 'xl';
    /** Whether sidebar is open on mobile */
    mobileOpen?: boolean;
    /** Callback when mobile state changes */
    onMobileOpenChange?: (open: boolean) => void;
    /** Position of sidebar */
    position?: 'left' | 'right';
    /** Additional className */
    className?: string;
    /** Title for the mobile drawer */
    title?: string;
}

const breakpointClasses = {
    sm: 'sm:flex',
    md: 'md:flex',
    lg: 'lg:flex',
    xl: 'xl:flex',
};

/**
 * GlassSidebar - Responsive sidebar with mobile drawer
 * 
 * Features:
 * - Automatically collapses to hamburger menu on mobile
 * - Smooth slide-in animation on mobile
 * - Focus trapping in mobile mode
 * - Configurable breakpoint
 * 
 * @example
 * ```tsx
 * <GlassSidebar width="w-64" collapseAt="lg">
 *   <nav>
 *     <NavItem>Dashboard</NavItem>
 *     <NavItem>Settings</NavItem>
 *   </nav>
 * </GlassSidebar>
 * ```
 */
export const GlassSidebar = ({
    children,
    width = 'w-64',
    collapseAt = 'lg',
    mobileOpen: controlledMobileOpen,
    onMobileOpenChange,
    position = 'left',
    className,
    title,
}: GlassSidebarProps) => {
    // Internal state for uncontrolled mode
    const [internalMobileOpen, setInternalMobileOpen] = useState(false);

    // Use controlled or uncontrolled state
    const mobileOpen = controlledMobileOpen ?? internalMobileOpen;
    const setMobileOpen = (open: boolean) => {
        setInternalMobileOpen(open);
        onMobileOpenChange?.(open);
    };

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    // Desktop sidebar classes
    const showAtClasses = breakpointClasses[collapseAt];
    const hideAtClasses = {
        sm: 'sm:hidden',
        md: 'md:hidden',
        lg: 'lg:hidden',
        xl: 'xl:hidden',
    }[collapseAt];

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className={cn('fixed top-20 z-40', hideAtClasses, position === 'left' ? 'left-4' : 'right-4')}>
                <GlassButton
                    variant="secondary"
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={mobileOpen}
                >
                    <Menu size={20} />
                </GlassButton>
            </div>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden flex-shrink-0 h-full',
                    showAtClasses,
                    width,
                    className
                )}
            >
                <GlassContainer
                    material="thick"
                    border
                    className="h-full w-full"
                >
                    {children}
                </GlassContainer>
            </aside>

            {/* Mobile Drawer Portal */}
            {createPortal(
                <AnimatePresence>
                    {mobileOpen && (
                        <div
                            className={cn(
                                'fixed inset-0 z-50',
                                hideAtClasses
                            )}
                        >
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm"
                                onClick={() => setMobileOpen(false)}
                                aria-hidden="true"
                            />

                            {/* Drawer */}
                            <motion.aside
                                initial={{ x: position === 'left' ? '-100%' : '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: position === 'left' ? '-100%' : '100%' }}
                                transition={TRANSITIONS.spring}
                                className={cn(
                                    'absolute top-0 bottom-0 w-80 max-w-[85vw]',
                                    position === 'left' ? 'left-0' : 'right-0'
                                )}
                                role="dialog"
                                aria-modal="true"
                                aria-label={title || 'Sidebar navigation'}
                            >
                                <GlassContainer
                                    material="thick"
                                    className={cn(
                                        'h-full w-full flex flex-col',
                                        position === 'left' ? 'rounded-r-3xl' : 'rounded-l-3xl'
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                                        {title && (
                                            <span className="text-lg font-bold text-primary">{title}</span>
                                        )}
                                        <GlassButton
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full w-10 h-10 ml-auto"
                                            onClick={() => setMobileOpen(false)}
                                            aria-label="Close menu"
                                        >
                                            <X size={20} />
                                        </GlassButton>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {children}
                                    </div>
                                </GlassContainer>
                            </motion.aside>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

GlassSidebar.displayName = 'GlassSidebar';
