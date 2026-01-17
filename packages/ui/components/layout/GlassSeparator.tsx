import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
}

export const GlassSeparator = ({ className, orientation = 'horizontal', ...props }: GlassSeparatorProps) => {
    return (
        <GlassContainer
            border={false}
            material="thin"
            className={cn(
                "shrink-0 bg-glass-surface",
                orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
                className
            )}
            {...props}
        />
    );
};

GlassSeparator.displayName = 'GlassSeparator';
