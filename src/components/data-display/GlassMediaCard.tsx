import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';

export interface GlassMediaCardProps {
    image: string;
    title: string;
    description?: string;
    aspectRatio?: 'square' | 'video' | 'portrait';
    onClick?: () => void;
    className?: string;
}

export const GlassMediaCard = React.forwardRef<HTMLDivElement, GlassMediaCardProps>(
    ({ image, title, description, aspectRatio = 'square', onClick, className = '' }, ref) => {
        const aspectClasses = {
            square: 'aspect-square',
            video: 'aspect-video',
            portrait: 'aspect-[3/4]',
        };

        return (
            <GlassContainer
                ref={ref}
                className={`rounded-xl overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
                material="thin"
                border
                interactive={!!onClick}
                onClick={onClick}
            >
                <div className={`relative ${aspectClasses[aspectRatio]}`}>
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="text-sm font-medium text-white truncate">
                            {title}
                        </div>
                        {description && (
                            <div className="text-xs text-white/70 truncate">
                                {description}
                            </div>
                        )}
                    </div>
                </div>
            </GlassContainer>
        );
    }
);

GlassMediaCard.displayName = 'GlassMediaCard';
