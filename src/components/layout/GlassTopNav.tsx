import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Command, Github } from 'lucide-react';


import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';

interface NavLink {
    label: string;
    path: string;
    external?: boolean;
}

const navLinks: NavLink[] = [
    { label: 'Home', path: '/' },
    { label: 'Components', path: '/showcase' },
    { label: 'Demos', path: '/showcase#demos' },
];

interface GlassTopNavProps {
    className?: string;
    /** Callback to open Command Palette */
    onCommandPaletteOpen?: () => void;
}

export const GlassTopNav = ({ className, onCommandPaletteOpen }: GlassTopNavProps) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Track scroll for subtle background change
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50",
                    "transition-all duration-300 ease-out",
                    className
                )}
            >
                <div
                    className={cn(
                        "mx-4 mt-4 rounded-2xl",
                        "backdrop-blur-xl",
                        "transition-all duration-300",
                        isScrolled
                            ? "bg-[var(--glass-bg-thick)] shadow-glass-lg border border-[var(--glass-border)]"
                            : "bg-[var(--glass-bg-thin)] border border-transparent"
                    )}
                >
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        {/* Left: Logo */}
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-primary font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity"
                        >
                            <span className="text-2xl">✦</span>
                            <span className="hidden sm:inline">Liquid Glass UI Kit</span>
                        </Link>

                        {/* Center: Navigation Links (Desktop) */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path ||
                                    (link.path !== '/' && location.pathname.startsWith(link.path));

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-accent/15 text-accent"
                                                : "text-secondary hover:text-primary hover:bg-white/5"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* Command Palette Trigger */}
                            {onCommandPaletteOpen && (
                                <button
                                    onClick={onCommandPaletteOpen}
                                    className={cn(
                                        "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg",
                                        "text-sm text-secondary hover:text-primary",
                                        "bg-glass-surface hover:bg-glass-surface-hover",
                                        "border border-[var(--glass-border)]",
                                        "transition-colors duration-200"
                                    )}
                                    aria-label="Open command palette (Cmd+K)"
                                >
                                    <Command size={14} />
                                    <span className="text-xs opacity-60">⌘K</span>
                                </button>
                            )}

                            {/* GitHub Link */}
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "hidden sm:flex items-center justify-center w-9 h-9 rounded-lg",
                                    "text-secondary hover:text-primary",
                                    "hover:bg-glass-surface-hover",
                                    "transition-colors duration-200"
                                )}
                                aria-label="View on GitHub"
                            >
                                <Github size={18} />
                            </a>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-lg",
                                    "text-secondary hover:text-primary",
                                    "hover:bg-glass-surface-hover",
                                    "transition-colors duration-200"
                                )}
                                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={cn(
                                    "md:hidden flex items-center justify-center w-9 h-9 rounded-lg",
                                    "text-secondary hover:text-primary",
                                    "hover:bg-glass-surface-hover",
                                    "transition-colors duration-200"
                                )}
                                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={mobileMenuOpen}
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div
                        className={cn(
                            "md:hidden mx-4 mt-2 rounded-2xl overflow-hidden",
                            "bg-[var(--glass-bg-thick)] backdrop-blur-xl",
                            "border border-[var(--glass-border)] shadow-glass-lg"
                        )}
                    >
                        <nav className="p-4 flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path ||
                                    (link.path !== '/' && location.pathname.startsWith(link.path));

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-accent/15 text-accent"
                                                : "text-secondary hover:text-primary hover:bg-white/5"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Mobile-only: Command Palette */}
                            {onCommandPaletteOpen && (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        onCommandPaletteOpen();
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                                        "text-base font-medium text-secondary hover:text-primary",
                                        "hover:bg-white/5 transition-colors duration-200"
                                    )}
                                >
                                    <Command size={18} />
                                    Search...
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Spacer for fixed header */}
            <div className="h-24" aria-hidden="true" />
        </>
    );
};

GlassTopNav.displayName = 'GlassTopNav';
