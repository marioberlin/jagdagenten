import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface AmbientBackgroundProps {
    /** Animation type */
    type: 'particles' | 'gradient' | 'mesh';
    /** Whether the parent is loaded */
    isLoaded: boolean;
    /** Custom className */
    className?: string;
}

/**
 * AmbientBackground - Animated background with particles, gradient, or mesh
 */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
    type,
    isLoaded,
    className,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Particle system
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
        }> = [];

        const createParticle = () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.2,
        });

        // Create initial particles
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle());
        }

        // Animation loop
        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
                ctx.fill();

                // Draw connections
                particles.slice(i + 1).forEach((p2) => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - distance / 150)})`;
                        ctx.stroke();
                    }
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [type]);

    return (
        <div className={cn('absolute inset-0 overflow-hidden', className)}>
            {/* Canvas for particles */}
            <canvas
                ref={canvasRef}
                className={cn(
                    'absolute inset-0 w-full h-full',
                    'transition-opacity duration-1000',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    type === 'particles' ? 'block' : 'hidden'
                )}
            />

            {/* Gradient mesh effect */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-br from-[var(--glass-primary)]/20 via-transparent to-[var(--glass-accent)]/20',
                    'transition-opacity duration-1000',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    type === 'gradient' || type === 'mesh' ? 'block' : 'hidden'
                )}
            />

            {/* Animated gradient orbs */}
            <div
                className={cn(
                    'absolute inset-0',
                    type === 'gradient' || type === 'mesh' ? 'block' : 'hidden'
                )}
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-conic from-[var(--glass-primary)] via-[var(--glass-accent)] to-[var(--glass-primary)] opacity-10 blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 180, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-conic from-[var(--glass-accent)] via-[var(--glass-primary)] to-[var(--glass-accent)] opacity-10 blur-3xl"
                />
            </div>

            {/* Mesh grid pattern */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)]',
                    'bg-[size:50px_50px]',
                    type === 'mesh' ? 'block' : 'hidden'
                )}
            />

            {/* Glass texture overlay */}
            <div
                className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-t from-[var(--glass-surface)]/80 via-transparent to-[var(--glass-surface)]/80'
                )}
            />
        </div>
    );
};

export default AmbientBackground;
