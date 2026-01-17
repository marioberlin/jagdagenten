import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

interface GlassVisualizerProps {
    className?: string;
    count?: number;
}

export function GlassVisualizer({ className, count = 32 }: GlassVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let tick = 0;

        const render = () => {
            if (!isPlaying) return;

            const width = canvas.width;
            const height = canvas.height;
            const barWidth = width / count;

            ctx.clearRect(0, 0, width, height);

            // Create gradient
            // Create gradient
            const computedStyle = getComputedStyle(canvas);
            const accentPrimary = computedStyle.getPropertyValue('--accent-primary-rgb').trim() || '59, 130, 246'; // Fallback blue
            const accentSecondary = computedStyle.getPropertyValue('--accent-secondary-rgb').trim() || '147, 51, 234'; // Fallback purple
            const accentTertiary = computedStyle.getPropertyValue('--accent-tertiary-rgb').trim() || '236, 72, 153'; // Fallback pink

            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, `rgba(${accentPrimary}, 0.8)`);
            gradient.addColorStop(0.5, `rgba(${accentSecondary}, 0.6)`);
            gradient.addColorStop(1, `rgba(${accentTertiary}, 0.4)`);

            ctx.fillStyle = gradient;

            for (let i = 0; i < count; i++) {
                // Compose waves
                const wave1 = Math.sin(tick * 0.05 + i * 0.2);
                const wave2 = Math.cos(tick * 0.03 + i * 0.3);
                const wave3 = Math.sin(tick * 0.1 + i * 0.1);

                const magnitude = (wave1 + wave2 + wave3) / 3;
                // Map -1..1 to 0..1, then scale to height
                const normalized = (magnitude + 1.2) / 2.4;

                const barHeight = normalized * height * 0.8;
                const x = i * barWidth;
                const y = height - barHeight;

                // Draw bar with glass effect (rounded top)
                ctx.beginPath();
                ctx.roundRect(x + 2, y, barWidth - 4, barHeight, [4, 4, 0, 0]);
                ctx.fill();

                // Reflection/Shine on top
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.roundRect(x + 2, y, barWidth - 4, barHeight * 0.3, [4, 4, 0, 0]);
                ctx.fill();

                // Reset fill for next bar
                ctx.fillStyle = gradient;
            }

            tick++;
            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [count, isPlaying]);

    return (
        <div className={cn("glass-panel p-4 rounded-xl flex flex-col gap-4", className)}>
            <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[200px] rounded-lg bg-black/20"
            />

            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="glass-button px-4 py-2 text-xs flex items-center gap-2"
                    >
                        {isPlaying ? (
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                        ) : (
                            <span className="w-2 h-2 bg-white/20 rounded-full" />
                        )}
                        {isPlaying ? 'Visualizing Audio' : 'Paused'}
                    </button>
                </div>

                <div className="text-xs text-white/40 font-mono">
                    44.1 kHz • Stereo
                </div>
            </div>
        </div>
    );
}
