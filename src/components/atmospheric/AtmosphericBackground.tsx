/**
 * AtmosphericBackground
 * 
 * A living, reactive background layer that changes based on destination weather.
 * Implements the "looking through a window" effect from the Liquid Glass philosophy.
 */
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useAtmosphere, getAtmosphereCSSVars, type AtmosphereUIConfig } from '../../hooks/useAtmosphere';
import { VideoBackground } from './VideoBackground';
import type { AtmosphereConfig } from '../../services/a2a/NeonTokyoService';

interface AtmosphericBackgroundProps {
    atmosphere?: AtmosphereConfig;
    destination?: string;
    className?: string;
    enableVideo?: boolean;
    children?: React.ReactNode;
}

/**
 * Animated gradient orbs that float in the background
 */
function FloatingOrbs({ config }: { config: AtmosphereUIConfig }) {
    const orbCount = config.condition === 'night' ? 4 : 2;

    return (
        <>
            {Array.from({ length: orbCount }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "absolute rounded-full blur-3xl pointer-events-none",
                        "animate-float opacity-30",
                        config.condition === 'night' && "mix-blend-screen",
                        config.condition === 'rainy' && "mix-blend-overlay"
                    )}
                    style={{
                        width: `${200 + i * 100}px`,
                        height: `${200 + i * 100}px`,
                        background: `radial-gradient(circle, ${config.accentColorHex}40 0%, transparent 70%)`,
                        left: `${10 + i * 25}%`,
                        top: `${20 + (i % 2) * 40}%`,
                        animationDelay: `${i * 1.5}s`,
                        animationDuration: config.animationSpeed === 'calm' ? '8s' : '5s'
                    }}
                />
            ))}
        </>
    );
}

/**
 * Rain effect overlay for rainy weather
 */
function RainOverlay({ intensity = 'medium' }: { intensity?: 'light' | 'medium' | 'heavy' }) {
    const dropCount = intensity === 'heavy' ? 100 : intensity === 'medium' ? 50 : 25;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: dropCount }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-px bg-gradient-to-b from-transparent via-white/20 to-transparent animate-rain"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${20 + Math.random() * 30}px`,
                        height: `${15 + Math.random() * 25}px`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Snow effect overlay for snowy weather
 */
function SnowOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-white/40 animate-snow"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                        animationDuration: `${3 + Math.random() * 4}s`,
                        animationDelay: `${Math.random() * 5}s`
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Glass refraction effect for depth
 */
function GlassRefractionLayer({ config }: { config: AtmosphereUIConfig }) {
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                background: `
                    radial-gradient(ellipse at 30% 20%, ${config.accentColorHex}10 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, ${config.accentColorHex}08 0%, transparent 40%)
                `,
                backdropFilter: `blur(${config.blurValue})`
            }}
        />
    );
}

/**
 * Main AtmosphericBackground component
 */
export function AtmosphericBackground({
    atmosphere,
    destination,
    className,
    enableVideo = false,
    children
}: AtmosphericBackgroundProps) {
    const config = useAtmosphere(atmosphere, destination);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    // Apply CSS custom properties
    useEffect(() => {
        if (containerRef.current) {
            const vars = getAtmosphereCSSVars(config);
            Object.entries(vars).forEach(([key, value]) => {
                containerRef.current!.style.setProperty(key, value);
            });
        }
    }, [config]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute inset-0 overflow-hidden",
                className
            )}
        >
            {/* Base gradient layer (fallback when no video) */}
            <div
                className={cn(
                    "absolute inset-0 transition-all duration-1000 ease-out",
                    "bg-gradient-to-br",
                    config.gradientFrom,
                    config.gradientVia,
                    config.gradientTo,
                    enableVideo && "opacity-30" // Fade gradient when video is showing
                )}
            />

            {/* Video background layer (when enabled) */}
            {enableVideo && (
                <VideoBackground
                    condition={config.condition}
                    overlayOpacity={0.5}
                    className="z-0"
                />
            )}

            {/* Secondary ambient gradient */}
            <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                    background: `
                        radial-gradient(ellipse at 0% 0%, ${config.accentColorHex}15 0%, transparent 50%),
                        radial-gradient(ellipse at 100% 100%, ${config.accentColorHex}10 0%, transparent 50%)
                    `,
                    opacity: config.overlayOpacity
                }}
            />

            {/* Floating orbs */}
            <FloatingOrbs config={config} />

            {/* Weather-specific effects */}
            {config.condition === 'rainy' && <RainOverlay intensity="medium" />}
            {config.condition === 'snowy' && <SnowOverlay />}

            {/* Glass refraction layer */}
            <GlassRefractionLayer config={config} />

            {/* Noise texture overlay for depth */}
            <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Top vignette */}
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

            {/* Bottom vignette */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

            {/* Content */}
            {children}
        </div>
    );
}

export default AtmosphericBackground;
