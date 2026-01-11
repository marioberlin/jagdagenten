import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { ChevronDown, TrendingUp, Users, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

// Sub-components
import { AmbientBackground } from './AmbientBackground';
import { HeroContent } from './HeroContent';
import { LiveTicker } from './LiveTicker';

export interface GlassHeroProps {
    /** Main headline */
    title: string;
    /** Subtitle/description */
    subtitle: string;
    /** Primary CTA button */
    ctaPrimary?: {
        label: string;
        onClick: () => void;
    };
    /** Secondary CTA button */
    ctaSecondary?: {
        label: string;
        onClick: () => void;
    };
    /** Background animation type */
    background?: 'particles' | 'gradient' | 'mesh';
    /** Show live market ticker */
    showTicker?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * GlassHero - Immersive hero component with ambient animations
 * 
 * Features:
 * - Animated particle/gradient background
 * - Live market ticker
 * - Animated CTA buttons
 * - Glass morphism overlay
 */
export const GlassHero: React.FC<GlassHeroProps> = ({
    title,
    subtitle,
    ctaPrimary,
    ctaSecondary,
    background = 'particles',
    showTicker = true,
    className,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLDivElement>(null);

    // Track mouse for interactive effects
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                setMousePosition({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Animation on load
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Scroll to content
    const scrollToContent = useCallback(() => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
        });
    }, []);

    return (
        <section
            ref={heroRef}
            className={cn(
                'relative min-h-screen flex flex-col',
                'overflow-hidden',
                'bg-[var(--glass-surface)]',
                className
            )}
            style={{
                '--mouse-x': `${mousePosition.x}%`,
                '--mouse-y': `${mousePosition.y}%`,
            } as React.CSSProperties}
        >
            {/* Ambient Background */}
            <AmbientBackground type={background} isLoaded={isLoaded} />

            {/* Glass Gradient Overlay */}
            <div
                className={cn(
                    'absolute inset-0 pointer-events-none',
                    'bg-gradient-to-b from-transparent via-transparent to-[var(--glass-surface)]',
                    'opacity-60'
                )}
            />

            {/* Mouse-following glow effect */}
            <div
                className="absolute pointer-events-none"
                style={{
                    left: 'var(--mouse-x)',
                    top: 'var(--mouse-y)',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div
                    className={cn(
                        'w-96 h-96 rounded-full',
                        'bg-gradient-to-r from-[var(--glass-accent)] to-[var(--glass-primary)]',
                        'opacity-10 blur-3xl transition-opacity duration-500',
                        isLoaded ? 'opacity-20' : 'opacity-0'
                    )}
                />
            </div>

            {/* Live Ticker */}
            <AnimatePresence>
                {showTicker && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <LiveTicker />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pt-20 pb-32">
                <HeroContent
                    title={title}
                    subtitle={subtitle}
                    ctaPrimary={ctaPrimary}
                    ctaSecondary={ctaSecondary}
                    isLoaded={isLoaded}
                />

                {/* Scroll indicator */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ delay: 1 }}
                    onClick={scrollToContent}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    aria-label="Scroll to content"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div
                            className={cn(
                                'w-10 h-16 rounded-full border-2',
                                'border-[var(--glass-border)]',
                                'flex items-start justify-center p-2',
                                'bg-[var(--glass-surface)]/50 backdrop-blur-sm',
                                'hover:bg-[var(--glass-surface)]/80 transition-colors'
                            )}
                        >
                            <motion.div
                                animate={{ y: [0, 12, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-[var(--glass-accent)]"
                            />
                        </div>
                    </motion.div>
                </motion.button>
            </main>
        </section>
    );
};

export default GlassHero;
