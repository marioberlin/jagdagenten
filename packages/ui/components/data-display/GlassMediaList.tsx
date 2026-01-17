import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';

export interface MediaListItem {
    image: string;
    title: string;
    description?: string;
}

export interface GlassMediaListProps {
    items: MediaListItem[];
    title?: string;
    onItemClick?: (item: MediaListItem, index: number) => void;
    className?: string;
}

export const GlassMediaList = React.forwardRef<HTMLDivElement, GlassMediaListProps>(
    ({ items, title, onItemClick, className = '' }, ref) => {
        return (
            <GlassContainer
                ref={ref}
                className={`p-4 rounded-xl ${className}`}
                material="regular"
                border
            >
                {title && (
                    <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>
                )}
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-3 ${onItemClick ? 'cursor-pointer hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors' : ''}`}
                            onClick={() => onItemClick?.(item, index)}
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-primary truncate">
                                    {item.title}
                                </div>
                                {item.description && (
                                    <div className="text-xs text-secondary truncate">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassContainer>
        );
    }
);

GlassMediaList.displayName = 'GlassMediaList';
