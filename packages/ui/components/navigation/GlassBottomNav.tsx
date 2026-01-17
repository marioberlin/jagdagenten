import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Home, BarChart2, Bot, Settings, Plus, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { GlassButton } from '@/components';

export interface NavItem {
    /** Navigation icon */
    icon: LucideIcon;
    /** Navigation label */
    label: string;
    /** Navigation href */
    href: string;
    /** Badge content */
    badge?: React.ReactNode;
}

export interface GlassBottomNavProps {
    /** Navigation items */
    items?: NavItem[];
    /** Center action button */
    action?: {
        icon?: LucideIcon;
        label?: string;
        onClick: () => void;
    };
    /** Show menu toggle */
    showMenu?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * GlassBottomNav - Mobile bottom navigation bar with glass effect
 */
export const GlassBottomNav: React.FC<GlassBottomNavProps> = ({
    items = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: BarChart2, label: 'Trade', href: '/trading' },
        { icon: Bot, label: 'AI', href: '/analytics' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ],
    action,
    showMenu = true,
    className,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(href);
    };

    return (
        <>
            {/* Main bottom navigation */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-50',
                    'flex items-center justify-around',
                    'h-safe-bottom-nav pt-2 pb-safe',
                    'bg-[var(--glass-surface)]/90 backdrop-blur-xl',
                    'border-t border-[var(--glass-border)]',
                    className
                )}
            >
                {/* Regular nav items */}
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <button
                            key={item.href}
                            onClick={() => navigate(item.href)}
                            className={cn(
                                'flex flex-col items-center justify-center',
                                'flex-1 py-2 px-1',
                                'relative',
                                'transition-all duration-200',
                                active
                                    ? 'text-[var(--glass-accent)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            )}
                            aria-label={item.label}
                        >
                            {/* Active indicator */}
                            {active && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[var(--glass-primary)]/20 rounded-lg"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}

                            {/* Icon */}
                            <div className="relative">
                                <Icon
                                    className={cn(
                                        'w-5 h-5 mb-1',
                                        active && 'scale-110'
                                    )}
                                />
                                {item.badge && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--glass-accent)] text-[10px] flex items-center justify-center text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className="text-xs font-medium truncate max-w-full">
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* Menu toggle */}
                {showMenu && (
                    <button
                        onClick={() => setMenuOpen(true)}
                        className={cn(
                            'flex flex-col items-center justify-center',
                            'flex-1 py-2 px-1',
                            'text-[var(--text-muted)]'
                        )}
                        aria-label="Menu"
                    >
                        <Menu className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Menu</span>
                    </button>
                )}
            </motion.nav>

            {/* Slide-out menu */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Menu panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={cn(
                                'fixed right-0 top-0 bottom-0 w-80 z-50',
                                'bg-[var(--glass-surface)]',
                                'border-l border-[var(--glass-border)]',
                                'backdrop-blur-xl',
                                'p-6'
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold">Menu</h2>
                                <GlassButton
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </GlassButton>
                            </div>

                            {/* Navigation links */}
                            <nav className="space-y-2">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => {
                                                navigate(item.href);
                                                setMenuOpen(false);
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                                                'transition-colors',
                                                active
                                                    ? 'bg-[var(--glass-primary)] text-[var(--glass-accent)]'
                                                    : 'hover:bg-[var(--glass-surface-hover)] text-[var(--text-primary)]'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                            {item.badge && (
                                                <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--glass-accent)] text-[10px] text-white">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Secondary links */}
                            <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">
                                    More
                                </h3>
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => {
                                            navigate('/showcase');
                                            setMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-primary)]"
                                    >
                                        <span className="font-medium">Showcase</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/demos');
                                            setMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-primary)]"
                                    >
                                        <span className="font-medium">Demos</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/performance');
                                            setMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-primary)]"
                                    >
                                        <span className="font-medium">Performance</span>
                                    </button>
                                </nav>
                            </div>

                            {/* Action button */}
                            {action && (
                                <div className="mt-8">
                                    <GlassButton
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() => {
                                            action.onClick();
                                            setMenuOpen(false);
                                        }}
                                        startContent={<Plus className="w-5 h-5" />}
                                    >
                                        {action.label || 'Action'}
                                    </GlassButton>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Safe area padding */}
            <style>{`
                .safe-bottom-nav {
                    padding-bottom: env(safe-area-inset-bottom, 20px);
                }
            `}</style>
        </>
    );
};

export default GlassBottomNav;
