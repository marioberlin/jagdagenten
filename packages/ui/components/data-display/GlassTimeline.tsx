import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface TimelineItem {
    id: string;
    date: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface GlassTimelineProps {
    items: TimelineItem[];
    className?: string;
}

export const GlassTimeline = ({ items, className }: GlassTimelineProps) => {
    return (
        <div className={cn("relative py-8 pl-8", className)}>
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--glass-border)] to-transparent" />

            {items.map((item, _index) => (
                <div key={item.id} className="relative mb-8 last:mb-0 group">
                    {/* Node */}
                    <div className="absolute left-[-29px] top-1.5 w-6 h-6 rounded-full border-2 border-[var(--glass-border)] bg-glass-surface backdrop-blur-md flex items-center justify-center transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 shadow-lg z-10">
                        {item.icon ? (
                            <div className="text-blue-300 transform scale-75">{item.icon}</div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-secondary group-hover:bg-blue-400 transition-colors" />
                        )}
                    </div>

                    {/* Content */}
                    <GlassContainer enableLiquid={false} className="ml-4 p-4 transition-transform duration-300 hover:translate-x-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-label-glass-primary">{item.title}</h4>
                            <span className="text-xs font-mono text-label-glass-tertiary bg-glass-surface px-2 py-0.5 rounded">{item.date}</span>
                        </div>
                        <p className="text-sm text-label-glass-secondary leading-relaxed">{item.description}</p>
                    </GlassContainer>
                </div>
            ))}
        </div>
    );
};

GlassTimeline.displayName = 'GlassTimeline';
