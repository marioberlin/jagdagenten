import React, { useState, useRef, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassSlider } from '../forms/GlassSlider';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Heart } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassAudioProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string;
    poster?: string;
    title?: string;
    artist?: string;
    layout?: 'vertical' | 'horizontal';
}

export const GlassAudio = React.forwardRef<HTMLDivElement, GlassAudioProps>(
    ({ className, src, poster, title = "Unknown Title", artist = "Unknown Artist", layout = 'vertical', ...props }, ref) => {
        const audioRef = useRef<HTMLAudioElement>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [isMuted, setIsMuted] = useState(false);
        const [isShuffle, setIsShuffle] = useState(false);
        const [isRepeat, setIsRepeat] = useState(false);
        const [isLiked, setIsLiked] = useState(false);

        useEffect(() => {
            const audio = audioRef.current;
            if (!audio) return;

            const updateTime = () => {
                setCurrentTime(audio.currentTime);
                setProgress((audio.currentTime / audio.duration) * 100);
            };

            const updateDuration = () => {
                setDuration(audio.duration);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
            };

            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', handleEnded);
            };
        }, []);

        const togglePlay = () => {
            if (!audioRef.current) return;
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        };

        const handleSeek = (value: number) => {
            if (!audioRef.current) return;
            const time = (value / 100) * duration;
            audioRef.current.currentTime = time;
            setProgress(value);
        };

        const formatTime = (time: number) => {
            if (isNaN(time)) return "00:00";
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const VerticalLayout = () => (
            <div className="flex flex-col items-center w-full max-w-sm mx-auto p-4 gap-6">
                {/* Album Art */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                    <div className={cn(
                        "relative w-64 h-64 rounded-full overflow-hidden border-4 border-glass-border shadow-glass-lg transition-transform duration-1000 ease-spring",
                        isPlaying ? "scale-105 rotate-3" : "scale-100 rotate-0"
                    )}>
                        {poster ? (
                            <img src={poster} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-glass-surface flex items-center justify-center">
                            </div>
                        )}

                    </div>
                </div>

                {/* Track Info */}
                <div className="text-center space-y-2 w-full">
                    <h3 className="text-xl font-bold text-primary truncate leading-tight">{title}</h3>
                    <p className="text-sm text-secondary font-medium tracking-wide truncate">{artist}</p>
                    <div className="flex justify-center mt-2">
                        <button
                            onClick={() => setIsLiked(!isLiked)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                                isLiked ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-glass-surface border border-glass-border text-label-secondary hover:text-primary"
                            )}
                        >
                            {isLiked ? 'Liked' : 'Hardcore punk'}
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-label-tertiary font-medium px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <GlassSlider
                        value={progress}
                        max={100}
                        onValueChange={handleSeek}
                        className="w-full"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between w-full px-4">
                    <button
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={cn("p-2 rounded-full transition-colors", isShuffle ? "text-primary bg-primary/10" : "text-label-tertiary hover:text-label-primary")}
                    >
                        <Shuffle size={20} />
                    </button>

                    <div className="flex items-center gap-6">
                        <button className="p-3 rounded-full hover:bg-glass-surface text-label-secondary hover:text-primary transition-all active:scale-95">
                            <SkipBack size={24} fill="currentColor" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_8px_32px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_48px_rgba(59,130,246,0.5)] flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95"
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button className="p-3 rounded-full hover:bg-glass-surface text-label-secondary hover:text-primary transition-all active:scale-95">
                            <SkipForward size={24} fill="currentColor" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsRepeat(!isRepeat)}
                        className={cn("p-2 rounded-full transition-colors", isRepeat ? "text-primary bg-primary/10" : "text-label-tertiary hover:text-label-primary")}
                    >
                        <Repeat size={20} />
                    </button>
                </div>
            </div>
        );

        const HorizontalLayout = () => (
            <div className="flex items-center w-full gap-6 p-2">
                {/* Info & Controls */}
                <div className="flex flex-col flex-1 gap-3 min-w-0 items-center text-center">
                    <div className="flex justify-center items-center gap-4 w-full relative">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-primary truncate leading-tight">{title}</h3>
                            <p className="text-sm text-secondary truncate">{artist}</p>
                        </div>
                        <button
                            onClick={() => setIsLiked(!isLiked)}
                            className={cn("transition-colors absolute right-0", isLiked ? "text-red-500" : "text-label-tertiary hover:text-red-400")}
                        >
                            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3 w-full max-w-xl">
                        <span className="text-xs text-label-tertiary w-10 text-right font-medium">{formatTime(currentTime)}</span>
                        <GlassSlider
                            value={progress}
                            max={100}
                            onValueChange={handleSeek}
                            className="flex-1 h-1.5"
                        />
                        <span className="text-xs text-label-tertiary w-10 font-medium">{formatTime(duration)}</span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-center gap-8 w-full">
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-glass-surface rounded-full text-label-tertiary hover:text-primary transition-colors">
                                <Shuffle size={16} />
                            </button>
                            <button className="p-2 hover:bg-glass-surface rounded-full text-label-tertiary hover:text-primary transition-colors">
                                <Repeat size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="text-label-secondary hover:text-primary transition-colors active:scale-95">
                                <SkipBack size={20} fill="currentColor" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-lg hover:shadow-primary/40 transition-all transform hover:scale-105 active:scale-95"
                            >
                                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button className="text-label-secondary hover:text-primary transition-colors active:scale-95">
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 w-24">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-label-tertiary hover:text-primary">
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            {/* Mini Volume Bar */}
                            <div className="h-1 flex-1 bg-glass-surface rounded-full overflow-hidden">
                                <div className="h-full bg-label-secondary w-2/3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <GlassContainer
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    layout === 'vertical' ? "p-6" : "p-4",
                    className
                )}
                {...props}
            >
                <audio ref={audioRef} src={src} loop={isRepeat} muted={isMuted} />
                {layout === 'vertical' ? <VerticalLayout /> : <HorizontalLayout />}
            </GlassContainer>
        );
    }
);

GlassAudio.displayName = 'GlassAudio';
