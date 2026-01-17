import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/utils/cn';

interface GlassMasonryProps {
    children: React.ReactNode[];
    className?: string;
    columns?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: number;
}

export const GlassMasonry = ({
    children,
    className,
    columns = { default: 1, sm: 2, md: 3, lg: 4 },
    gap = 16
}: GlassMasonryProps) => {
    const [columnCount, setColumnCount] = useState(columns.default);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1280 && columns.xl) setColumnCount(columns.xl);
            else if (width >= 1024 && columns.lg) setColumnCount(columns.lg);
            else if (width >= 768 && columns.md) setColumnCount(columns.md);
            else if (width >= 640 && columns.sm) setColumnCount(columns.sm);
            else setColumnCount(columns.default);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, [columns]);

    // Distribute children into columns
    const columnBuckets = Array.from({ length: columnCount }, () => [] as React.ReactNode[]);

    React.Children.forEach(children, (child, index) => {
        if (React.isValidElement(child)) {
            columnBuckets[index % columnCount].push(child);
        }
    });

    return (
        <div
            ref={containerRef}
            className={cn("flex w-full", className)}
            style={{ gap: `${gap}px` }}
        >
            {columnBuckets.map((bucket, colIndex) => (
                <div
                    key={colIndex}
                    className="flex flex-col flex-1"
                    style={{ gap: `${gap}px` }}
                >
                    {bucket.map((child, childIndex) => (
                        <div key={childIndex} className="w-full">
                            {child}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

GlassMasonry.displayName = 'GlassMasonry';
