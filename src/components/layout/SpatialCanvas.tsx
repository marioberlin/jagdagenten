import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { Backgrounds } from '../Backgrounds/BackgroundRegistry';
import { cn } from '../../utils/cn';

interface SpatialCanvasProps {
    children?: ReactNode;
    className?: string;
    /**
     * Z-axis depth simulation.
     * 1.0 = Standard
     * 0.8 = "Receded" (e.g. when modal is open)
     */
    scale?: number;
    /**
     * Blur amount in px for the background layer
     */
    blur?: number;
}

/**
 * SpatialCanvas
 *
 * The infinite "Deep Space" container for the Liquid OS.
 * Manages the background rendering and "Camera" depth effects.
 */
export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
    children,
    className,
    scale = 1,
    blur = 0
}) => {
    const { activeBackgroundId } = useThemeStore();

    // Resolve background config
    const bgConfig = Backgrounds.find(b => b.id === activeBackgroundId) || Backgrounds[0];

    return (
        <div className={cn("relative w-full h-screen overflow-hidden bg-black", className)}>
            {/* 1. Deep Space Layer (Background) */}
            <motion.div
                className="absolute inset-0 z-0"
                animate={{
                    scale,
                    filter: `blur(${blur}px) brightness(${scale})`
                }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }} // Spring-like feel
            >
                {bgConfig.type === 'image' && (
                    <img
                        src={bgConfig.src}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                )}

                {bgConfig.type === 'video' && (
                    <div className="w-full h-full">
                        {/* Note: In a real app we might use a better Video player component */}
                        <iframe
                            className="w-full h-full pointer-events-none scale-125" // Scale up to hide controls/borders
                            src={bgConfig.videoUrl}
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            title="Background"
                        />
                        <div className="absolute inset-0 bg-black/20" /> {/* Overlay for contrast */}
                    </div>
                )}

                {bgConfig.type === 'element' && bgConfig.component && (
                    <bgConfig.component />
                )}
            </motion.div>

            {/* 2. Spatial Layer (Content) */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};
