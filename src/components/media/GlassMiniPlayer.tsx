import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';

export interface GlassMiniPlayerProps {
    artist: string;
    title: string;
    albumArt: string;
    isPlaying?: boolean;
    showShuffle?: boolean;
    showRepeat?: boolean;
    onPlayPause?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onShuffle?: () => void;
    onRepeat?: () => void;
    className?: string;
}

export const GlassMiniPlayer = React.forwardRef<HTMLDivElement, GlassMiniPlayerProps>(
    ({
        artist,
        title,
        albumArt,
        isPlaying = false,
        showShuffle = true,
        showRepeat = true,
        onPlayPause,
        onNext,
        onPrev,
        onShuffle,
        onRepeat,
        className = ''
    }, ref) => {
        return (
            <GlassContainer
                ref={ref}
                className={`p-4 rounded-xl ${className}`}
                material="regular"
                border
            >
                <div className="text-xs text-secondary mb-1">{artist}</div>
                <div className="text-sm font-medium text-primary mb-3 truncate">{title}</div>

                <img
                    src={albumArt}
                    alt={`${title} - ${artist}`}
                    className="w-full h-20 object-cover rounded-lg mb-3"
                />

                <div className="flex items-center justify-center gap-4">
                    {showShuffle && (
                        <button
                            onClick={onShuffle}
                            className="text-secondary hover:text-primary transition-colors"
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onPrev}
                        className="text-primary hover:text-accent transition-colors"
                    >
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onPlayPause}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        {isPlaying ? (
                            <Pause className="w-4 h-4 text-primary" />
                        ) : (
                            <Play className="w-4 h-4 text-primary" />
                        )}
                    </button>
                    <button
                        onClick={onNext}
                        className="text-primary hover:text-accent transition-colors"
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                    {showRepeat && (
                        <button
                            onClick={onRepeat}
                            className="text-secondary hover:text-primary transition-colors"
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </GlassContainer>
        );
    }
);

GlassMiniPlayer.displayName = 'GlassMiniPlayer';
