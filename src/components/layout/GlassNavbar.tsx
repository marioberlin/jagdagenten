import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { Settings, Sun, Moon, PieChart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface GlassNavbarProps {
    className?: string;
    style?: React.CSSProperties;
    position?: 'fixed' | 'absolute' | 'relative';
    /** ID of the main content element for skip link */
    mainContentId?: string;
}

export const GlassNavbar = ({
    className,
    style,
    position = 'fixed',
    mainContentId = 'main-content'
}: GlassNavbarProps) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header
            className={cn("left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none", position, className)}
            style={style}
        >
            {/* Skip to main content - keyboard accessibility */}
            <a
                href={`#${mainContentId}`}
                className={cn(
                    "sr-only focus:not-sr-only",
                    "focus:absolute focus:top-2 focus:left-1/2 focus:-translate-x-1/2",
                    "focus:z-[100] focus:pointer-events-auto",
                    "focus:px-4 focus:py-2 focus:rounded-full",
                    "focus:bg-accent/90 focus:text-primary focus:font-medium",
                    "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
            >
                Skip to main content
            </a>

            {/* Left: System Status (Time) */}
            <div className="flex items-center gap-4 pointer-events-auto">
                <GlassContainer
                    interactive
                    material="nav-glass"
                    className="px-4 py-2 rounded-full"
                >
                    <span className="text-sm font-medium tracking-wide text-primary">{time}</span>
                </GlassContainer>
            </div>

            {/* Right: System Actions */}
            <div className="flex items-center gap-3 pointer-events-auto">
                {/* Status Icons Container - purely visual */}
                {/* Theme Toggle */}
                <GlassContainer
                    as="button"
                    interactive
                    material="nav-glass"
                    onClick={toggleTheme}
                    className="flex items-center justify-center p-3 rounded-full text-primary/80 hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </GlassContainer>

                <Link
                    to="/analytics"
                    className="flex items-center justify-center p-3 rounded-full text-primary/80 hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    aria-label="Smart Analytics"
                >
                    <GlassContainer
                        interactive
                        material="nav-glass"
                        className="p-3 rounded-full hover:brightness-110 transition-all group"
                    >
                        <PieChart size={20} className="text-primary/80 group-hover:text-primary transition-colors" />
                    </GlassContainer>
                </Link>

                {/* Settings Link (Only show if not on Settings page) */}
                {location.pathname !== '/settings' && location.pathname !== '/demos/admin' && (
                    <Link
                        to="/settings"
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full"
                        aria-label="Open settings"
                    >
                        <GlassContainer
                            interactive
                            material="nav-glass"
                            className="p-3 rounded-full hover:brightness-110 transition-all group"
                        >
                            <Settings size={20} className="text-primary/80 group-hover:text-primary transition-colors" />
                        </GlassContainer>
                    </Link>
                )}
            </div>
        </header>
    );
};

GlassNavbar.displayName = 'GlassNavbar';
