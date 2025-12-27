import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassBentoProps {
    children: React.ReactNode;
    className?: string;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
}

export const GlassBento = ({
    children,
    className,
    columns = 3,
    gap = 'md'
}: GlassBentoProps) => {
    const gapStyles = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6'
    };

    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };

    return (
        <div className={cn(
            'grid w-full',
            gridCols[columns],
            gapStyles[gap],
            className
        )}>
            {children}
        </div>
    );
};

interface GlassBentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2 | 3 | 4;
    title?: string;
    description?: string;
    visual?: React.ReactNode;
}

export const GlassBentoItem = ({
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    title,
    description,
    visual,
    ...props
}: GlassBentoItemProps) => {
    const colSpanClass = {
        1: 'col-span-1',
        2: 'col-span-1 md:col-span-2',
        3: 'col-span-1 md:col-span-3',
        4: 'col-span-1 md:col-span-4',
    };

    const rowSpanClass = {
        1: 'row-span-1',
        2: 'row-span-1 md:row-span-2',
        3: 'row-span-1 md:row-span-3',
        4: 'row-span-1 md:row-span-4',
    };

    return (
        <GlassContainer
            className={cn(
                'group relative overflow-hidden flex flex-col justify-between p-0',
                colSpanClass[colSpan],
                rowSpanClass[rowSpan],
                className
            )}
            {...props}
        >
            {visual && (
                <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 opacity-50">
                    {visual}
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full p-6 transition-all duration-300 group-hover:bg-glass-surface">
                <div className="flex-1">
                    {children}
                </div>

                {(title || description) && (
                    <div className="mt-4 pointer-events-none">
                        {title && <h3 className="text-lg font-semibold text-label-glass-primary mb-1">{title}</h3>}
                        {description && <p className="text-sm text-label-glass-secondary">{description}</p>}
                    </div>
                )}
            </div>
        </GlassContainer>
    );
};

GlassBento.displayName = 'GlassBento';
GlassBentoItem.displayName = 'GlassBentoItem';
