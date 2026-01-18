/**
 * VideoBackground
 * 
 * Atmospheric video background with lazy loading and fallback support.
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Graceful fallback to gradient if video fails
 * - Blur overlay for content legibility
 * - Muted autoplay with loop
 */
import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/utils/cn';
import type { WeatherCondition } from '../../services/a2a/NeonTokyoService';

interface VideoBackgroundProps {
    condition?: WeatherCondition;
    videoUrl?: string;
    fallbackGradient?: string;
    className?: string;
    overlayOpacity?: number;
    blurAmount?: string;
}

// Curated free video URLs for each weather condition (Pexels/Pixabay style)
// These are placeholder URLs - in production, use your own CDN
const DEFAULT_VIDEOS: Partial<Record<WeatherCondition, string>> = {
    // Using placeholder gradients as video is expensive
    // night: 'https://cdn.example.com/neon-tokyo-night.mp4',
    // rainy: 'https://cdn.example.com/rain-window.mp4',
};

// Fallback gradients for each condition
const FALLBACK_GRADIENTS: Record<WeatherCondition, string> = {
    sunny: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #dc2626 100%)',
    cloudy: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
    rainy: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4c1d95 100%)',
    snowy: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #0ea5e9 100%)',
    night: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 30%, #06b6d4 70%, #1e1b4b 100%)',
    foggy: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)'
};

export const VideoBackground = memo(function VideoBackground({
    condition = 'night',
    videoUrl,
    fallbackGradient,
    className,
    overlayOpacity = 0.4,
    blurAmount = '0px'
}: VideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Determine video source
    const src = videoUrl || DEFAULT_VIDEOS[condition];
    const gradient = fallbackGradient || FALLBACK_GRADIENTS[condition];
    const showVideo = src && !hasError && isVisible;

    // Lazy loading with IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Handle video load
    const handleLoadedData = () => {
        setIsLoaded(true);
    };

    // Handle video error
    const handleError = () => {
        setHasError(true);
        console.warn('[VideoBackground] Video failed to load, using gradient fallback');
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute inset-0 overflow-hidden",
                className
            )}
        >
            {/* Gradient layer (always present as base/fallback) */}
            <div
                className={cn(
                    "absolute inset-0 transition-opacity duration-1000",
                    showVideo && isLoaded ? "opacity-0" : "opacity-100"
                )}
                style={{ background: gradient }}
            />

            {/* Video layer */}
            {showVideo && (
                <video
                    ref={videoRef}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    style={{ filter: blurAmount !== '0px' ? `blur(${blurAmount})` : undefined }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                >
                    <source src={src} type="video/mp4" />
                </video>
            )}

            {/* Dark overlay for content legibility */}
            <div
                className="absolute inset-0 bg-black transition-opacity duration-500"
                style={{ opacity: overlayOpacity }}
            />

            {/* Vignette effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
                }}
            />
        </div>
    );
});

export default VideoBackground;
