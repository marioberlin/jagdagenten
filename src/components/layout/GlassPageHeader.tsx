import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { VibrantText } from '../data-display/VibrantText';
import { cn } from '@/utils/cn';

export interface GlassPageHeaderProps {
    /** Page title */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Breadcrumb items (auto-generated from path if not provided) */
    breadcrumbs?: { label: string; href?: string }[];
    /** Right-side action buttons/content */
    actions?: React.ReactNode;
    /** Whether to use sticky positioning */
    sticky?: boolean;
    /** Additional className */
    className?: string;
    /** Children rendered below the header content */
    children?: React.ReactNode;
}

/**
 * GlassPageHeader - Standardized page header with breadcrumb navigation
 * 
 * Features:
 * - Auto-generated breadcrumb trail from URL path
 * - Title and optional subtitle
 * - Action buttons slot
 * - Sticky option for scrollable pages
 * 
 * @example
 * ```tsx
 * <GlassPageHeader
 *   title="Settings"
 *   subtitle="Customize your experience"
 *   actions={<GlassButton>Save</GlassButton>}
 * />
 * ```
 */
export const GlassPageHeader = ({
    title,
    subtitle,
    breadcrumbs,
    actions,
    sticky = false,
    className,
    children,
}: GlassPageHeaderProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-generate breadcrumbs from path if not provided
    const autoBreadcrumbs = React.useMemo(() => {
        if (breadcrumbs) return breadcrumbs;

        const pathSegments = location.pathname.split('/').filter(Boolean);
        // Show breadcrumbs for any page that's not the home page
        if (pathSegments.length === 0) return undefined;

        return [
            { label: 'Home', href: '/' },
            ...pathSegments.map((segment, index) => ({
                label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
                href: index < pathSegments.length - 1
                    ? '/' + pathSegments.slice(0, index + 1).join('/')
                    : undefined,
            })),
        ];
    }, [breadcrumbs, location.pathname]);

    return (
        <div
            className={cn(
                'w-full',
                sticky && 'sticky top-16 z-30',
                className
            )}
        >
            <GlassContainer
                material="regular"
                border
                className={cn(
                    'p-4 md:p-6 rounded-2xl',
                    sticky && 'backdrop-blur-xl'
                )}
            >
                {/* Breadcrumb Navigation */}
                {autoBreadcrumbs && autoBreadcrumbs.length > 1 && (
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-1 mb-4 text-sm"
                    >
                        {autoBreadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.label}>
                                {index > 0 && (
                                    <ChevronRight size={14} className="text-secondary/40 mx-1" />
                                )}
                                {crumb.href ? (
                                    <button
                                        onClick={() => navigate(crumb.href!)}
                                        className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 hover:underline underline-offset-4"
                                    >
                                        {index === 0 && <Home size={14} />}
                                        {crumb.label}
                                    </button>
                                ) : (
                                    <span className="text-primary font-semibold">
                                        {crumb.label}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* Header Row */}
                <div className="flex items-center justify-between gap-4">
                    {/* Title */}
                    <div className="min-w-0">
                        <VibrantText
                            intensity="high"
                            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight truncate"
                        >
                            {title}
                        </VibrantText>
                        {subtitle && (
                            <p className="text-secondary text-sm md:text-base mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Optional Children */}
                {children && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        {children}
                    </div>
                )}
            </GlassContainer>
        </div>
    );
};

GlassPageHeader.displayName = 'GlassPageHeader';
