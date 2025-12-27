import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'glass';
    size?: 'sm' | 'md';
}

export const GlassBadge = ({ className, variant = 'default', size = 'md', children, ...props }: GlassBadgeProps) => {
    const variantStyles = {
        default: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary/10 text-secondary border-secondary/20',
        destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
        outline: 'text-label-glass-primary border-[var(--glass-border)] bg-transparent',
        glass: 'bg-glass-surface text-label-glass-primary border-[var(--glass-border)] backdrop-blur-md',
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
    };

    return (
        <GlassContainer
            as="div"
            material="thin"
            enableLiquid={false} // Clean edges for badges
            className={cn(
                "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {children}
        </GlassContainer>
    );
};

GlassBadge.displayName = 'GlassBadge';
