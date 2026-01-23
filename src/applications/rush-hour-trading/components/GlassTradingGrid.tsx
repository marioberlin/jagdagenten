import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type GridSpan = 'small' | 'medium' | 'large' | 'full';

export interface GridItem {
    /** Unique identifier */
    id: string;
    /** Grid span size */
    span?: GridSpan;
    /** Content */
    children: ReactNode;
}

export interface GlassTradingGridProps {
    /** Grid items */
    children: React.ReactNode;
    /** Number of columns (default 4) */
    columns?: number;
    /** Gap size */
    gap?: 'sm' | 'md' | 'lg';
    /** Custom className */
    className?: string;
}

/**
 * GlassTradingGrid - Bento grid layout for trading dashboard
 */
export const GlassTradingGrid: React.FC<GlassTradingGridProps> = ({
    children,
    columns = 4,
    gap = 'md',
    className,
}) => {
    const gapSizes = {
        sm: 'gap-3',
        md: 'gap-4',
        lg: 'gap-6',
    };

    const spanClasses: Record<GridSpan, string> = {
        small: 'col-span-1',
        medium: 'col-span-2',
        large: 'col-span-2 row-span-2',
        full: 'col-span-4',
    };

    const colClasses: Record<string, string> = {
        '1': 'grid-cols-1',
        '2': 'grid-cols-1 sm:grid-cols-2',
        '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
        '6': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
    };

    const colKey = String(columns);
    const colClass = colClasses[colKey] || colClasses['4'];

    return (
        <div
            className={cn(
                'grid',
                colClass,
                gapSizes[gap],
                className
            )}
        >
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return null;
                const item = child.props as GridItem;
                return (
                    <div
                        className={cn(
                            'min-h-[200px]',
                            item.span && spanClasses[item.span]
                        )}
                    >
                        {child}
                    </div>
                );
            })}
        </div>
    );
};

export default GlassTradingGrid;
