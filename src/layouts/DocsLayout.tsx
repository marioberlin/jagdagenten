import { ReactNode, useState } from 'react';
import { GlassContainer } from '@/components';
import { GlassInput } from '@/components';
import { GlassButton } from '@/components';
import { GlassDrawer } from '@/components';
import { GlassBadge } from '@/components';
import { cn } from '../utils/cn';
import { Search, Menu } from 'lucide-react';

export interface NavSection {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    id: string;
    label: string;
    badge?: string;
    badgeVariant?: 'default' | 'outline';
}

interface DocsLayoutProps {
    /** Navigation sections for the left sidebar */
    navSections: NavSection[];
    /** Currently active item ID */
    activeItem: string;
    /** Callback when a nav item is clicked */
    onNavChange: (id: string) => void;
    /** Optional search functionality */
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    /** Main content */
    children: ReactNode;
    /** Optional right sidebar content (TOC) */
    rightSidebar?: ReactNode;
    /** Page header content */
    header?: ReactNode;
}

export const DocsLayout = ({
    navSections,
    activeItem,
    onNavChange,
    searchPlaceholder = 'Search...',
    onSearch,
    children,
    rightSidebar,
    header,
}: DocsLayoutProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleNavClick = (id: string) => {
        onNavChange(id);
        setMobileNavOpen(false);
    };

    // Sidebar navigation content (shared between desktop and mobile)
    const SidebarNav = () => (
        <div className="space-y-6">
            {/* Search */}
            <GlassInput
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                icon={<Search size={16} />}
                className="w-full"
            />

            {/* Navigation Sections */}
            <nav className="space-y-6">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium",
                                        "transition-all duration-200",
                                        "flex items-center justify-between gap-2",
                                        activeItem === item.id
                                            ? "bg-accent/15 text-primary"
                                            : "text-secondary hover:text-primary hover:bg-white/5"
                                    )}
                                >
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <GlassBadge
                                            variant={item.badgeVariant || 'outline'}
                                            size="sm"
                                            className="text-[10px] py-0"
                                        >
                                            {item.badge}
                                        </GlassBadge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen relative z-10">
            {/* Optional Header */}
            {header && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    {header}
                </div>
            )}

            {/* Mobile Nav Trigger */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <GlassButton
                    variant="primary"
                    size="icon"
                    className="rounded-full w-14 h-14 shadow-glass-lg"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open navigation"
                >
                    <Menu size={24} />
                </GlassButton>
            </div>

            {/* Mobile Navigation Drawer */}
            <GlassDrawer
                open={mobileNavOpen}
                onOpenChange={setMobileNavOpen}
                title="Navigation"
                size="md"
            >
                <SidebarNav />
            </GlassDrawer>

            {/* Main Layout Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={cn(
                    "grid gap-8",
                    rightSidebar
                        ? "lg:grid-cols-[280px_1fr_220px]"
                        : "lg:grid-cols-[280px_1fr]"
                )}>
                    {/* Left Sidebar - Desktop Only */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            <GlassContainer
                                material="thin"
                                border
                                className="p-4 rounded-2xl"
                            >
                                <SidebarNav />
                            </GlassContainer>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 pb-24" id="main-content">
                        {children}
                    </main>

                    {/* Right Sidebar (TOC) - Desktop Only */}
                    {rightSidebar && (
                        <aside className="hidden lg:block">
                            <div className="sticky top-28">
                                {rightSidebar}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

DocsLayout.displayName = 'DocsLayout';
