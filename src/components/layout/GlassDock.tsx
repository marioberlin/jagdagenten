import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layout, Settings, ChevronUp } from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface DockItem {
    icon: React.ReactNode;
    label: string;
    path: string;
}

const defaultItems: DockItem[] = [
    { icon: <Home size={20} />, label: 'Home', path: '/' },
    { icon: <Layout size={20} />, label: 'Showcase', path: '/showcase' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
];

interface GlassDockProps {
    items?: DockItem[];
    className?: string;
}

export const GlassDock = ({ items = defaultItems, className }: GlassDockProps) => {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const shouldShow = isVisible || isHovered;

    return (
        <>
            {/* Hover trigger zone when hidden */}
            {!isVisible && (
                <div
                    className="fixed bottom-0 left-0 right-0 h-12 z-40"
                    onMouseEnter={() => setIsHovered(true)}
                />
            )}

            <nav
                className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
                    "transition-all duration-300 ease-out",
                    shouldShow
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-full pointer-events-none",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label="Main navigation dock"
            >
                <GlassContainer
                    material="thick"
                    border
                    className="px-2 py-2 rounded-full flex items-center gap-1"
                >
                    {items.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 rounded-full",
                                    "transition-all duration-200 group",
                                    isActive
                                        ? "bg-accent/20 text-accent"
                                        : "text-secondary hover:text-primary hover:bg-glass-surface-hover"
                                )}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {item.icon}
                                <span className={cn(
                                    "text-sm font-medium transition-all duration-200",
                                    isActive ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Scroll to top button */}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full",
                            "text-secondary hover:text-primary hover:bg-glass-surface-hover",
                            "transition-colors duration-200 ml-1"
                        )}
                        aria-label="Scroll to top"
                    >
                        <ChevronUp size={18} />
                    </button>
                </GlassContainer>
            </nav>
        </>
    );
};

GlassDock.displayName = 'GlassDock';
