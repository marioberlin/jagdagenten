import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    footer?: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, title, description, children, footer, ...props }, ref) => {
        return (
            <GlassContainer
                ref={ref}
                material="surface"
                className={cn('flex flex-col', className)}
                {...props}
            >
                {(title || description) && (
                    <div className="flex flex-col space-y-1.5 p-6">
                        {title && <h3 className="font-semibold leading-none tracking-tight text-primary">{title}</h3>}
                        {description && <p className="text-sm text-secondary">{description}</p>}
                    </div>
                )}
                <div className="p-6 pt-0">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center p-6 pt-0 text-secondary">
                        {footer}
                    </div>
                )}
            </GlassContainer>
        );
    }
);

GlassCard.displayName = "GlassCard";
