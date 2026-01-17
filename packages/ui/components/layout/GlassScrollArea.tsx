import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassScrollAreaProps {
    children: React.ReactNode;
    height?: number | string;
    className?: string;
}

export const GlassScrollArea = ({ children, height = '100%', className }: GlassScrollAreaProps) => {
    return (
        <GlassContainer
            material="regular"
            className={cn("overflow-hidden relative", className)}
            style={{ height }}
        >
            <div className="h-full w-full overflow-y-auto pr-2 scrollbar-glass">
                {children}
            </div>
            <style>{`
                .scrollbar-glass::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-glass::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-glass::-webkit-scrollbar-thumb {
                    background: var(--glass-surface);
                    border-radius: 10px;
                }
                .scrollbar-glass::-webkit-scrollbar-thumb:hover {
                    background: var(--glass-surface-hover);
                }
            `}</style>
        </GlassContainer>
    );
};

GlassScrollArea.displayName = 'GlassScrollArea';
