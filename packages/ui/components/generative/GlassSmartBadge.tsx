/**
 * GlassSmartBadge
 * 
 * A generative badge component that displays AI-generated status indicators.
 * Listens for the 'generate_badge' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassBadge } from '../data-display/GlassBadge';
import { cn } from '@/utils/cn';

// Badge type to variant mapping
const typeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'glass'> = {
    success: 'default',
    warning: 'secondary',
    error: 'destructive',
    info: 'secondary',
    pending: 'glass',
    neutral: 'outline',
};

export function GlassSmartBadge() {
    return (
        <LiquidSmartComponent
            name="generate_badge"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                const variant = typeVariants[args.type] || 'default';
                const text = args.text || args.label || 'Badge';
                const size = args.size || 'md';

                return (
                    <GlassContainer
                        className={cn(
                            'inline-flex items-center justify-center',
                            isLoading && !args.text ? 'animate-pulse' : ''
                        )}
                    >
                        <GlassBadge
                            variant={variant}
                            size={size as 'sm' | 'md'}
                            className={cn(
                                args.interactive && 'cursor-pointer hover:scale-105 transition-transform'
                            )}
                        >
                            {isLoading && !args.text ? (
                                <span className="w-12 h-4 bg-white/10 rounded" />
                            ) : (
                                <>
                                    {args.icon && (
                                        <span className="mr-1">{args.icon}</span>
                                    )}
                                    {text}
                                </>
                            )}
                        </GlassBadge>
                    </GlassContainer>
                );
            }}
        />
    );
}
