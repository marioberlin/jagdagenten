import { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
    label: string;
    href?: string;
    children?: { title: string; href: string; description: string }[];
}

interface GlassNavigationMenuProps {
    items: NavItem[];
    className?: string;
}

export const GlassNavigationMenu = ({ items, className }: GlassNavigationMenuProps) => {
    const [active, setActive] = useState<string | null>(null);

    return (
        <nav className={cn("relative z-50 flex justify-center", className)} onMouseLeave={() => setActive(null)}>
            <GlassContainer material="thin" enableLiquid={false} className="inline-flex flex-col items-start gap-0 p-2 rounded-2xl">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => setActive(item.label)}
                    >
                        {/* Trigger */}
                        <button
                            className={cn(
                                "flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 text-left",
                                active === item.label ? "bg-[var(--glass-surface-hover)] text-primary shadow-lg" : "text-secondary hover:text-primary hover:bg-[var(--glass-surface)]"
                            )}
                        >
                            {item.label}
                            {item.children && (
                                <ChevronDown
                                    size={14}
                                    className={cn("transition-transform duration-300 ml-auto", active === item.label ? "rotate-180" : "")}
                                />
                            )}
                        </button>

                        {/* Content Dropdown (Mega Menu Style) */}
                        {item.children && (
                            <div
                                className={cn(
                                    "absolute top-full left-0 mt-2 w-[400px] bg-transparent transition-all duration-300 transform origin-top-left",
                                    active === item.label
                                        ? "opacity-100 translate-y-0 pointer-events-auto"
                                        : "opacity-0 -translate-y-2 pointer-events-none"
                                )}
                            >
                                <GlassContainer material="regular" enableLiquid={false} className="p-4 rounded-2xl grid grid-cols-2 gap-4 border border-[var(--glass-border)] shadow-2xl">
                                    {item.children.map((child) => (
                                        <a
                                            key={child.title}
                                            href={child.href}
                                            className="block p-3 rounded-xl hover:bg-[var(--glass-surface-hover)] transition-colors group"
                                        >
                                            <div className="text-sm font-semibold text-primary mb-1 group-hover:text-blue-400 transition-colors">
                                                {child.title}
                                            </div>
                                            <div className="text-xs text-secondary leading-snug">
                                                {child.description}
                                            </div>
                                        </a>
                                    ))}
                                </GlassContainer>
                            </div>
                        )}
                    </div>
                ))}
            </GlassContainer>
        </nav>
    );
};

GlassNavigationMenu.displayName = 'GlassNavigationMenu';
