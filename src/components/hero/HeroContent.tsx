import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassButton } from '@/components';

export interface HeroContentProps {
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
    /** Whether the parent is loaded */
    isLoaded: boolean;
    /** Custom className */
    className?: string;
}

/**
 * HeroContent - Main hero text content with animated CTAs
 */
export const HeroContent: React.FC<HeroContentProps> = ({
    title,
    subtitle,
    ctaPrimary,
    ctaSecondary,
    isLoaded,
    className,
}) => {
    return (
        <div className={cn('text-center max-w-4xl mx-auto', className)}>
            {/* Animated title with gradient */}
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                    'text-5xl md:text-7xl lg:text-8xl font-bold',
                    'tracking-tight',
                    'bg-gradient-to-r from-[var(--glass-primary)] via-[var(--glass-accent)] to-[var(--glass-primary)]',
                    'bg-clip-text text-transparent',
                    'bg-[length:200%_auto] animate-gradient',
                    'mb-6'
                )}
            >
                {title}
            </motion.h1>

            {/* Animated subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className={cn(
                    'text-lg md:text-xl lg:text-2xl',
                    'text-[var(--text-secondary)]',
                    'max-w-2xl mx-auto',
                    'mb-10'
                )}
            >
                {subtitle}
            </motion.p>

            {/* Animated CTA buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                {ctaPrimary && (
                    <GlassButton
                        size="lg"
                        variant="primary"
                        onClick={ctaPrimary.onClick}
                        className={cn(
                            'min-w-[180px]',
                            'group'
                        )}
                        endContent={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                    >
                        {ctaPrimary.label}
                    </GlassButton>
                )}

                {ctaSecondary && (
                    <GlassButton
                        size="lg"
                        variant="outline"
                        onClick={ctaSecondary.onClick}
                        className="min-w-[180px]"
                    >
                        {ctaSecondary.label}
                    </GlassButton>
                )}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-[var(--text-muted)]"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-success)]" />
                    <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-success)]" />
                    <span>Free tier available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-success)]" />
                    <span>Cancel anytime</span>
                </div>
            </motion.div>
        </div>
    );
};

export default HeroContent;
