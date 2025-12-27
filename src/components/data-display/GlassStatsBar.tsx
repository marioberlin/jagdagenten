import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';

export interface StatItem {
    label: string;
    value: string | number;
    unit?: string;
}

export interface GlassStatsBarProps {
    stats: StatItem[];
    title?: string;
    className?: string;
}

export const GlassStatsBar = React.forwardRef<HTMLDivElement, GlassStatsBarProps>(
    ({ stats, title, className = '' }, ref) => {
        return (
            <GlassContainer
                ref={ref}
                className={`p-4 rounded-xl ${className}`}
                material="thin"
                border
            >
                {title && (
                    <h3 className="text-sm text-secondary mb-3">{title}</h3>
                )}
                <div className="flex items-center gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {stat.value}
                                {stat.unit && <span className="text-sm font-normal text-secondary ml-0.5">{stat.unit}</span>}
                            </div>
                            <div className="text-xs text-secondary">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </GlassContainer>
        );
    }
);

GlassStatsBar.displayName = 'GlassStatsBar';
