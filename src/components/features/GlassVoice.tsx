import { useEffect, useRef, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassVoiceProps {
    className?: string;
    isListening?: boolean;
}

export const GlassVoice = ({ className }: GlassVoiceProps) => {
    const [listening, setListening] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!listening) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            // Clear canvas cleanly
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // Enhanced visualizer vars
        const bars = 60;
        const barWidth = canvas.width / bars;
        let time = 0;

        const animate = () => {
            time += 0.05;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const midY = canvas.height / 2;

            for (let i = 0; i < bars; i++) {
                // Complex wave simulation
                const noise = Math.sin(time + i * 0.2) * Math.cos(time * 0.5 + i * 0.1) * Math.sin(time * 2);
                const height = Math.abs(noise * 60) + 6;
                const x = i * barWidth;

                // Cyberpunk gradients
                const gradient = ctx.createLinearGradient(0, midY - height, 0, midY + height);
                gradient.addColorStop(0, 'rgba(56, 189, 248, 0)'); // fade out top
                gradient.addColorStop(0.2, 'rgba(56, 189, 248, 0.4)'); // blue
                gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.9)'); // purple glow center
                gradient.addColorStop(0.8, 'rgba(56, 189, 248, 0.4)'); // blue
                gradient.addColorStop(1, 'rgba(56, 189, 248, 0)'); // fade out bottom

                ctx.fillStyle = gradient;

                // Rounded bar
                ctx.beginPath();
                ctx.roundRect(x + 1, midY - height / 2, barWidth - 2, height, 4);
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [listening]);

    return (
        <GlassContainer className={cn("flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-[300px]", className)}>
            {/* Ambient Background Glow (Active State) */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-1000 pointer-events-none",
                listening ? "opacity-100" : "opacity-0"
            )}>
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-blue-500/5 to-transparent animate-pulse-slow" />
            </div>

            {/* Visualizer Canvas - Layered behind content but front of background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover opacity-80"
                />
            </div>

            {/* Interactive Content */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-8 w-full">

                {/* Dynamic Status Text */}
                <div className="h-8 flex items-center justify-center">
                    {listening ? (
                        <span className="flex items-center gap-2 text-primary font-medium tracking-widest uppercase text-xs animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
                            Listening...
                        </span>
                    ) : (
                        <span className="text-label-tertiary text-sm font-medium tracking-wide">Tap microphone to interact</span>
                    )}
                </div>

                {/* Glowing Microphone Button */}
                <div className="relative">
                    {/* Ripple Rings when idle to invite click */}
                    {!listening && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping-slow pointer-events-none" />
                            <div className="absolute -inset-4 rounded-full border border-primary/10 animate-ping-slower pointer-events-none" />
                        </>
                    )}

                    {/* Active audio rings */}
                    {listening && (
                        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
                    )}

                    <GlassButton
                        onClick={() => setListening(!listening)}
                        size="icon"
                        className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform",
                            listening
                                ? "bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-110"
                                : "bg-glass-surface-highlight text-primary hover:bg-white/10 hover:scale-105 border-white/20 shadow-glass-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        )}
                        aria-label={listening ? "Stop listening" : "Start listening"}
                    >
                        {listening ? <MicOff size={32} strokeWidth={2} /> : <Mic size={32} strokeWidth={2} />}
                    </GlassButton>
                </div>

                {listening && (
                    <div className="flex gap-1 h-2 items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-label-quaternary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 rounded-full bg-label-quaternary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 rounded-full bg-label-quaternary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>

            <style>{`
                @keyframes ping-slow {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes ping-slower {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
                .animate-ping-slower { animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
            `}</style>
        </GlassContainer>
    );
};

GlassVoice.displayName = 'GlassVoice';
