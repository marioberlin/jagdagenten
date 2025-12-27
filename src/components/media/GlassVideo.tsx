import React, { useRef, useState, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src: string;
    poster?: string;
    className?: string;
}

export const GlassVideo = ({ src, poster, className, ...props }: GlassVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<number | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(percent || 0);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(parseFloat(e.target.value));
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    };

    useEffect(() => {
        return () => clearTimeout(controlsTimeoutRef.current);
    }, []);

    return (
        <GlassContainer
            className={cn("relative overflow-hidden group aspect-video bg-black", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                {...props}
            />

            {/* Controls Overlay */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-glass-surface hover:bg-glass-surface-hover backdrop-blur-md flex items-center justify-center text-primary transition-all"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="flex-1 relative group/slider">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleProgressChange}
                            className="w-full h-1 bg-glass-surface rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover/slider:[&::-webkit-slider-thumb]:opacity-100 transition-all"
                        />
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-blue-500 pointer-events-none rounded-lg"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <button onClick={() => {
                        if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                        }
                    }} className="text-secondary hover:text-primary">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <button onClick={() => videoRef.current?.requestFullscreen()} className="text-secondary hover:text-primary">
                        <Maximize size={20} />
                    </button>
                </div>
            </div>

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-glass-surface backdrop-blur-md flex items-center justify-center text-primary animate-pulse">
                        <Play size={32} fill="currentColor" className="ml-1" />
                    </div>
                </div>
            )}
        </GlassContainer>
    );
};

GlassVideo.displayName = 'GlassVideo';
