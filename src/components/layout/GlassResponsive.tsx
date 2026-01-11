import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UseResponsiveResult {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    breakpoint: Breakpoint;
    width: number;
}

/**
 * Hook to detect current screen size
 */
export const useResponsive = (): UseResponsiveResult => {
    const [responsive, setResponsive] = useState<UseResponsiveResult>(() => {
        if (typeof window === 'undefined') {
            return { isMobile: false, isTablet: false, isDesktop: true, breakpoint: 'xl', width: 1280 };
        }

        const width = window.innerWidth;
        return getResponsiveState(width);
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setResponsive(getResponsiveState(width));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return responsive;
};

function getResponsiveState(width: number): UseResponsiveResult {
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;

    let breakpoint: Breakpoint = 'sm';
    if (width >= 640) breakpoint = 'md';
    if (width >= 768) breakpoint = 'lg';
    if (width >= 1024) breakpoint = 'xl';
    if (width >= 1280) breakpoint = '2xl';

    return { isMobile, isTablet, isDesktop, breakpoint, width };
}

/**
 * Breakpoint-aware container component
 */
export interface GlassResponsiveProps {
    /** Children to render */
    children: React.ReactNode;
    /** Render only on mobile */
    mobile?: React.ReactNode;
    /** Render only on tablet */
    tablet?: React.ReactNode;
    /** Render only on desktop */
    desktop?: React.ReactNode;
    /** Hide on mobile */
    hideOnMobile?: boolean;
    /** Hide on tablet */
    hideOnTablet?: boolean;
    /** Hide on desktop */
    hideOnDesktop?: boolean;
    /** Custom className */
    className?: string;
}

export const GlassResponsive: React.FC<GlassResponsiveProps> = ({
    children,
    mobile,
    tablet,
    desktop,
    hideOnMobile = false,
    hideOnTablet = false,
    hideOnDesktop = false,
    className,
}) => {
    const responsive = useResponsive();

    // Hide conditions
    if (hideOnMobile && responsive.isMobile) return null;
    if (hideOnTablet && responsive.isTablet) return null;
    if (hideOnDesktop && responsive.isDesktop) return null;

    // Override content based on breakpoint
    if (responsive.isMobile && mobile) return <>{mobile}</>;
    if (responsive.isTablet && tablet) return <>{tablet}</>;
    if (responsive.isDesktop && desktop) return <>{desktop}</>;

    return <div className={className}>{children}</div>;
};

/**
 * Mobile-first column grid that adapts to screen size
 */
export interface ResponsiveGridProps {
    /** Number of columns on mobile (default 1) */
    columnsMobile?: number;
    /** Number of columns on tablet (default 2) */
    columnsTablet?: number;
    /** Number of columns on desktop (default 3) */
    columnsDesktop?: number;
    /** Number of columns on large desktop (default 4) */
    columnsLgDesktop?: number;
    /** Gap size */
    gap?: 'sm' | 'md' | 'lg' | 'xl';
    /** Children */
    children: React.ReactNode;
    /** Custom className */
    className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
    columnsMobile = 1,
    columnsTablet = 2,
    columnsDesktop = 3,
    columnsLgDesktop = 4,
    gap = 'md',
    children,
    className,
}) => {
    const responsive = useResponsive();

    const getColumns = () => {
        if (responsive.isDesktop && responsive.width >= 1280) return columnsLgDesktop;
        if (responsive.isDesktop) return columnsDesktop;
        if (responsive.isTablet) return columnsTablet;
        return columnsMobile;
    };

    const gapSizes = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
    };

    return (
        <div
            className={cn(
                'grid',
                `grid-cols-${getColumns()}`,
                gapSizes[gap],
                className
            )}
        >
            {children}
        </div>
    );
};

/**
 * Conditional renderer based on screen size
 */
export interface ShowProps {
    /** Show only on these breakpoints */
    when: Breakpoint | Breakpoint[];
    /** Fallback content when condition not met */
    fallback?: React.ReactNode;
    /** Children to render if condition met */
    children: React.ReactNode;
}

export const Show: React.FC<ShowProps> = ({ when, fallback, children }) => {
    const responsive = useResponsive();

    const breakpoints = Array.isArray(when) ? when : [when];
    const shouldShow = breakpoints.includes(responsive.breakpoint);

    if (shouldShow) return <>{children}</>;
    return <>{fallback}</>;
};

/**
 * Hide component on specific breakpoints
 */
export interface HideProps {
    /** Hide on these breakpoints */
    when: Breakpoint | Breakpoint[];
    /** Children */
    children: React.ReactNode;
}

export const Hide: React.FC<HideProps> = ({ when, children }) => {
    const responsive = useResponsive();

    const breakpoints = Array.isArray(when) ? when : [when];
    if (breakpoints.includes(responsive.breakpoint)) return null;

    return <>{children}</>;
};

export default GlassResponsive;
