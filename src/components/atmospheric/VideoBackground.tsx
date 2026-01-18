/**
 * VideoBackground
 * 
 * Atmospheric video background with lazy loading and fallback support.
 * Features:
 * - Fetches video/image from media API based on destination + weather
 * - Lazy loading with IntersectionObserver
 * - Graceful fallback to gradient if video fails or isn't generated yet
 * - Blur overlay for content legibility
 * - Muted autoplay with loop
 */
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { cn } from '@/utils/cn';
import type { WeatherCondition } from '../../services/a2a/NeonTokyoService';

interface VideoBackgroundProps {
    /** Weather condition (determines visual style) */
    condition?: WeatherCondition;
    /** Optional destination for destination-specific backgrounds */
    destination?: string;
    /** Direct video URL override (bypasses API) */
    videoUrl?: string;
    /** Fallback gradient override */
    fallbackGradient?: string;
    className?: string;
    overlayOpacity?: number;
    blurAmount?: string;
    /** If true, attempts to trigger generation when video is missing */
    autoGenerate?: boolean;
}

interface MediaApiResponse {
    type: 'video' | 'image' | 'none';
    url: string | null;
    cacheKey: string;
}

// Fallback gradients for each condition
const FALLBACK_GRADIENTS: Record<WeatherCondition, string> = {
    sunny: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #dc2626 100%)',
    cloudy: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
    rainy: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4c1d95 100%)',
    snowy: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #0ea5e9 100%)',
    night: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 30%, #06b6d4 70%, #1e1b4b 100%)',
    foggy: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)'
};

// Slugify destination for API
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export const VideoBackground = memo(function VideoBackground({
    condition = 'night',
    destination = 'tokyo',
    videoUrl,
    fallbackGradient,
    className,
    overlayOpacity = 0.4,
    blurAmount = '0px',
    autoGenerate = false
}: VideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(videoUrl || null);
    const [mediaType, setMediaType] = useState<'video' | 'image' | 'none'>('none');
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const gradient = fallbackGradient || FALLBACK_GRADIENTS[condition];
    const showMedia = mediaUrl && !hasError && isVisible && (mediaType === 'video' || mediaType === 'image');

    // Fetch background from API
    const fetchBackground = useCallback(async () => {
        if (videoUrl) {
            // Direct URL provided, skip API
            setMediaUrl(videoUrl);
            setMediaType('video');
            return;
        }

        setIsLoading(true);
        try {
            const slug = slugify(destination);
            const response = await fetch(`/api/media/background/${slug}/${condition}`);

            if (response.ok) {
                const data: MediaApiResponse = await response.json();
                if (data.url) {
                    setMediaUrl(data.url);
                    setMediaType(data.type as 'video' | 'image');
                } else {
                    setMediaUrl(null);
                    setMediaType('none');

                    // Auto-trigger generation if enabled
                    if (autoGenerate) {
                        console.log('[VideoBackground] No media found, triggering generation...');
                        // Fire and forget - don't wait for completion
                        fetch('/api/media/generate/video', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ destination: slug, condition })
                        }).catch(() => { });
                    }
                }
            }
        } catch (error) {
            console.warn('[VideoBackground] Failed to fetch background:', error);
            setMediaUrl(null);
            setMediaType('none');
        } finally {
            setIsLoading(false);
        }
    }, [destination, condition, videoUrl, autoGenerate]);

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

    // Fetch when visible and destination/condition changes
    useEffect(() => {
        if (isVisible) {
            fetchBackground();
        }
    }, [isVisible, fetchBackground]);

    // Reset state when destination/condition changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
        setMediaUrl(videoUrl || null);
        setMediaType(videoUrl ? 'video' : 'none');
    }, [destination, condition, videoUrl]);

    // Handle video/image load
    const handleLoadedData = () => {
        setIsLoaded(true);
    };

    // Handle load error
    const handleError = () => {
        setHasError(true);
        console.warn('[VideoBackground] Media failed to load, using gradient fallback');
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
                    showMedia && isLoaded ? "opacity-0" : "opacity-100"
                )}
                style={{ background: gradient }}
            />

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                </div>
            )}

            {/* Video layer */}
            {showMedia && mediaType === 'video' && (
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
                    <source src={mediaUrl!} type="video/mp4" />
                </video>
            )}

            {/* Image layer (fallback when only image is available) */}
            {showMedia && mediaType === 'image' && (
                <img
                    src={mediaUrl!}
                    alt=""
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    style={{ filter: blurAmount !== '0px' ? `blur(${blurAmount})` : undefined }}
                    onLoad={handleLoadedData}
                    onError={handleError}
                />
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
